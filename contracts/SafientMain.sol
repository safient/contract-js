// SPDX-License-Identifier: MIT
pragma solidity >=0.7;

import "./IArbitrable.sol";
import "./IArbitrator.sol";
import "./IEvidence.sol";

contract SafientMain is IArbitrable, IEvidence {
    /* Constants and Immutable */
    uint256 private constant RULING_OPTIONS = 2;

    /* Enums */
    enum ClaimStatus {Active, Passed, Failed, Refused}

    /* Structs */
    struct Safe {
        uint256 safeId;
        address safeCreatedBy;
        address safeCurrentOwner;
        address safeInheritor;
        uint256 metaEvidenceId;
        uint256 claimsCount;
        uint256 safeFunds;
    }

    struct Claim {
        uint256 safeId;
        uint256 disputeId;
        address claimedBy;
        uint256 metaEvidenceId;
        uint256 evidenceGroupId;
        ClaimStatus status;
        string result;
    }

    /* Storage - Public */
    IArbitrator public arbitrator;

    address public safexMainAdmin;

    uint256 public safesCount = 0;
    uint256 public claimsCount = 0;
    uint256 public metaEvidenceID = 0;
    uint256 public evidenceGroupID = 0;

    mapping(uint256 => Safe) public safes; // safes[safeId] => safe, starts from 1
    mapping(uint256 => Claim) public claims; // claims[disputeId] => claim, starts from 0 (because, disputeId starts from 0)

    /* Storage - Private */
    uint256 private _totalClaimsAllowed = 2;

    /* Modifiers */
    modifier onlySafexMainAdmin {
        require(
            msg.sender == safexMainAdmin,
            "Only SafexMain contract's admin can execute this"
        );
        _;
    }

    modifier onlyArbitrator() {
        require(
            msg.sender == address(arbitrator),
            "Only arbitrator can execute this"
        );
        _;
    }

    modifier safeShouldExist(uint256 _safeId) {
        require(_safeId <= safesCount, "Safe does not exist");
        _;
    }

    modifier shouldBeValidRuling(uint256 _ruling) {
        require(_ruling <= RULING_OPTIONS, "Ruling out of bounds!");
        _;
    }

    modifier safeCreationRequisite(
        address _inheritor,
        string calldata _metaEvidence
    ) {
        require(
            msg.value >= arbitrator.arbitrationCost(""),
            "Inadequate fee payment"
        );
        require(
            bytes(_metaEvidence).length > 0,
            "Should provide metaEvidence to create a safe"
        );
        require(
            _inheritor != address(0),
            "Should provide an inheritor for the safe"
        );
        require(
            msg.sender != _inheritor,
            "Safe creator should not be the inheritor of the safe"
        );
        _;
    }

    modifier claimCreationRequisite(
        uint256 _safeId,
        string calldata _evidence
    ) {
        Safe memory safe = safes[_safeId];

        require(
            safe.claimsCount < _totalClaimsAllowed,
            "Total number of claims on a safe has reached the limit"
        );
        require(
            msg.sender == safe.safeInheritor,
            "Only inheritor of the safe can create the claim"
        );
        require(
            safe.safeFunds >= arbitrator.arbitrationCost(""),
            "Insufficient funds in the safe to pay the arbitration fee"
        );
        _;
    }

    modifier recoverSafeFundsRequisite(uint256 _safeId) {
        Safe memory safe = safes[_safeId];

        require(
            msg.sender == safe.safeCurrentOwner,
            "Only safe owner can recover the deposit balance"
        );
        require(safe.safeFunds != 0, "No funds remaining in the safe");
        _;
    }

    modifier submitEvidenceRequisite(
        uint256 _disputeID,
        string calldata _evidence
    ) {
        require(_disputeID <= claimsCount, "Claim or Dispute does not exist");

        Claim memory claim = claims[_disputeID];

        require(
            msg.sender == claim.claimedBy,
            "Only creator of the claim can submit the evidence"
        );
        _;
    }

    /* Events */
    event CreateSafe(
        address indexed safeCreatedBy,
        address indexed safeInheritor,
        uint256 indexed metaEvidenceId
    );

    event CreateClaim(
        address indexed claimCreatedBy,
        uint256 indexed safeId,
        uint256 indexed disputeId
    );

    /* Constructor */
    constructor(IArbitrator _arbitrator) {
        arbitrator = _arbitrator;
        safexMainAdmin = msg.sender;
    }

    /* Functions - External */
    receive() external payable {}

    function createSafe(address _inheritor, string calldata _metaEvidence)
        external
        payable
        safeCreationRequisite(_inheritor, _metaEvidence)
    {
        safesCount += 1;
        metaEvidenceID += 1;

        Safe memory safe = safes[safesCount];
        safe = Safe({
            safeId: safesCount,
            safeCreatedBy: msg.sender,
            safeCurrentOwner: msg.sender,
            safeInheritor: _inheritor,
            metaEvidenceId: metaEvidenceID,
            claimsCount: 0,
            safeFunds: msg.value
        });
        safes[safesCount] = safe;

        (bool sent, bytes memory data) =
            address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        emit MetaEvidence(metaEvidenceID, _metaEvidence);
        emit CreateSafe(msg.sender, _inheritor, metaEvidenceID);
    }

    function createClaim(uint256 _safeId, string calldata _evidence)
        external
        payable
        safeShouldExist(_safeId)
        claimCreationRequisite(_safeId, _evidence)
    {
        Safe memory safe = safes[_safeId];

        uint256 disputeID =
            arbitrator.createDispute{value: arbitrator.arbitrationCost("")}(
                RULING_OPTIONS,
                ""
            );

        evidenceGroupID += 1;

        emit Dispute(
            arbitrator,
            disputeID,
            safe.metaEvidenceId,
            evidenceGroupID
        );

        Claim memory claim = claims[disputeID];
        claim = Claim({
            safeId: _safeId,
            disputeId: disputeID,
            claimedBy: msg.sender,
            metaEvidenceId: safe.metaEvidenceId,
            evidenceGroupId: evidenceGroupID,
            status: ClaimStatus.Active,
            result: "Active"
        });
        claims[disputeID] = claim;

        claimsCount += 1;

        emit CreateClaim(msg.sender, _safeId, disputeID);

        safe.claimsCount += 1;
        safe.safeFunds -= arbitrator.arbitrationCost("");
        safes[_safeId] = safe;

        if (bytes(_evidence).length != 0) {
            submitEvidence(disputeID, _evidence);
        }
    }

    function rule(uint256 _disputeID, uint256 _ruling)
        external
        override
        onlyArbitrator
        shouldBeValidRuling(_ruling)
    {
        Claim memory claim = claims[_disputeID];

        if (_ruling == 1) {
            claim.status = ClaimStatus.Passed; // 1
            claim.result = "Passed";
        } else if (_ruling == 2) {
            claim.status = ClaimStatus.Failed; // 2
            claim.result = "Failed";
        } else if (_ruling == 0) {
            claim.status = ClaimStatus.Refused; // 3
            claim.result = "RTA"; // Refused To Arbitrate (RTA)
        }

        claims[_disputeID] = claim;

        emit Ruling(IArbitrator(msg.sender), _disputeID, _ruling);
    }

    function depositSafeFunds(uint256 _safeId)
        external
        payable
        safeShouldExist(_safeId)
    {
        Safe memory safe = safes[_safeId];
        safe.safeFunds += msg.value;
        safes[_safeId] = safe;

        (bool sent, bytes memory data) =
            address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");
    }

    function recoverSafeFunds(uint256 _safeId)
        external
        safeShouldExist(_safeId)
        recoverSafeFundsRequisite(_safeId)
    {
        Safe memory safe = safes[_safeId];

        uint256 blanceAmount = safe.safeFunds;

        safe.safeFunds = 0;
        safes[_safeId] = safe;

        address _to = msg.sender;

        (bool sent, bytes memory data) = _to.call{value: blanceAmount}("");
        require(sent, "Failed to send Ether");
    }

    /* Functions - Public */
    function submitEvidence(uint256 _disputeID, string calldata _evidence)
        public
        submitEvidenceRequisite(_disputeID, _evidence)
    {
        Claim memory claim = claims[_disputeID];

        emit Evidence(arbitrator, claim.evidenceGroupId, msg.sender, _evidence);
    }

    /* Setters */
    function setTotalClaimsAllowed(uint256 _claimsAllowed)
        public
        onlySafexMainAdmin
    {
        _totalClaimsAllowed = _claimsAllowed;
    }

    /* Getters */
    function getSafexMainContractBalance()
        public
        view
        returns (uint256 balance)
    {
        return address(this).balance;
    }

    function getTotalClaimsAllowed()
        public
        view
        returns (uint256 totalClaimsAllowed)
    {
        return _totalClaimsAllowed;
    }
}
