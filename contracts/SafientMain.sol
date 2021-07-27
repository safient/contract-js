// SPDX-License-Identifier: MIT
pragma solidity >=0.7;
pragma experimental ABIEncoderV2;
import "./IArbitrable.sol";
import "./IArbitrator.sol";
import "./IEvidence.sol";

contract SafientMain is IArbitrable, IEvidence {
    /* Constants and Immutable */
    uint256 private constant RULING_OPTIONS = 2;

    /* Enums */
    enum ClaimStatus {
        Active,
        Passed,
        Failed,
        Refused
    }

    /* Structs */
    struct Safe {
        string safeId;
        address safeCreatedBy;
        address safeCurrentOwner;
        address safeInheritor;
        uint256 metaEvidenceId;
        uint256 claimsCount;
        uint256 safeFunds;
    }

    struct Claim {
        string safeId;
        uint256 disputeId;
        address claimedBy;
        uint256 metaEvidenceId;
        uint256 evidenceGroupId;
        ClaimStatus status;
        string result;
    }

    struct RecoveryProof {
        bytes32 secretHash;
        address guardianAddress;
    }

    /* Storage - Public */
    IArbitrator public arbitrator;

    address public safientMainAdmin;

    uint256 public safesCount = 0;
    uint256 public claimsCount = 0;
    uint256 public metaEvidenceID = 0;
    uint256 public evidenceGroupID = 0;

    mapping(string => Safe) public safes; // safes[safeId] => Safe
    mapping(uint256 => Claim) public claims; // claims[disputeId] => Claim, starts from 0 (because, disputeId starts from 0)

    /* Modifiers */
    modifier onlySafientMainAdmin() {
        require(
            msg.sender == safientMainAdmin,
            "Only SafientMain contract's admin can execute this"
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

    modifier shouldBeValidRuling(uint256 _ruling) {
        require(_ruling <= RULING_OPTIONS, "Ruling out of bounds!");
        _;
    }

    modifier safeCreationRequisite(
        address _inheritor,
        string memory _safeId,
        string calldata _metaEvidence
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
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

    modifier syncSafeRequisite(
        address _creator,
        string memory _safeId,
        string calldata _metaEvidence
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
        require(
            msg.value >= arbitrator.arbitrationCost(""),
            "Inadequate fee payment"
        );
        require(
            bytes(_metaEvidence).length > 0,
            "Should provide metaEvidence to create a safe"
        );
        require(
            _creator != address(0),
            "Should provide an creator for the safe"
        );
        require(
            msg.sender != _creator,
            "Safe should be synced by the inheritor of the safe"
        );
        _;
    }

    modifier claimCreationRequisite(
        string memory _safeId,
        string calldata _evidence
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );

        Safe memory safe = safes[_safeId];

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

    modifier recoverSafeFundsRequisite(string memory _safeId) {
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
        string indexed safeId,
        uint256 indexed disputeId
    );

    /* Constructor */
    constructor(IArbitrator _arbitrator) {
        arbitrator = _arbitrator;
        safientMainAdmin = msg.sender;
    }

    /* Functions - External */
    receive() external payable {}

    function createSafe(
        address _inheritor,
        string memory _safeId,
        string calldata _metaEvidence
    )
        external
        payable
        safeCreationRequisite(_inheritor, _safeId, _metaEvidence)
    {
        metaEvidenceID += 1;

        Safe memory safe = safes[_safeId];
        safe = Safe({
            safeId: _safeId,
            safeCreatedBy: msg.sender,
            safeCurrentOwner: msg.sender,
            safeInheritor: _inheritor,
            metaEvidenceId: metaEvidenceID,
            claimsCount: 0,
            safeFunds: msg.value
        });
        safes[_safeId] = safe;

        (bool sent, bytes memory data) = address(this).call{value: msg.value}(
            ""
        );
        require(sent, "Failed to send Ether");

        safesCount += 1;

        emit MetaEvidence(metaEvidenceID, _metaEvidence);
        emit CreateSafe(msg.sender, _inheritor, metaEvidenceID);
    }

    function syncSafe(
        address _creator,
        string memory _safeId,
        string calldata _metaEvidence
    ) external payable syncSafeRequisite(_creator, _safeId, _metaEvidence) {
        metaEvidenceID += 1;

        Safe memory safe = safes[_safeId];
        safe = Safe({
            safeId: _safeId,
            safeCreatedBy: _creator,
            safeCurrentOwner: _creator,
            safeInheritor: msg.sender,
            metaEvidenceId: metaEvidenceID,
            claimsCount: 0,
            safeFunds: msg.value
        });
        safes[_safeId] = safe;

        (bool sent, bytes memory data) = address(this).call{value: msg.value}(
            ""
        );
        require(sent, "Failed to send Ether");

        safesCount += 1;

        emit MetaEvidence(metaEvidenceID, _metaEvidence);
        emit CreateSafe(_creator, msg.sender, metaEvidenceID);
    }

    function createClaim(string memory _safeId, string calldata _evidence)
        external
        payable
        claimCreationRequisite(_safeId, _evidence)
    {
        Safe memory safe = safes[_safeId];

        uint256 disputeID = arbitrator.createDispute{
            value: arbitrator.arbitrationCost("")
        }(RULING_OPTIONS, "");

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

    function depositSafeFunds(string memory _safeId) external payable {
        Safe memory safe = safes[_safeId];
        safe.safeFunds += msg.value;
        safes[_safeId] = safe;

        (bool sent, bytes memory data) = address(this).call{value: msg.value}(
            ""
        );
        require(sent, "Failed to send Ether");
    }

    function recoverSafeFunds(string memory _safeId)
        external
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

    function getMessageHash(string memory _message)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(_message));
    }

    function getEthSignedMessageHash(bytes32 _messageHash)
        public
        pure
        returns (bytes32)
    {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }

    function guardianProof(
        string memory _message,
        bytes memory _signature,
        RecoveryProof[] memory _guardianproof,
        string[] memory _secrets,
        string memory _safeId
    ) public payable returns (bool) {
        Safe memory safe = safes[_safeId];
        uint256 noOfGuardians = _secrets.length;

        bytes32 r;
        bytes32 s;
        uint8 v;
        if (_signature.length != 65) {
            return false;
        }
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        if (v < 27) {
            v += 27;
        }
        if (v != 27 && v != 28) {
            return false;
        } else {
            bytes32 _messagehash = getMessageHash(_message);
            bytes32 _hash = getEthSignedMessageHash(_messagehash);
            address creator = ecrecover(_hash, v, r, s);
            if (creator == safe.safeCreatedBy && safe.safeFunds != 0) {
                uint256 guardianValue = safe.safeFunds / noOfGuardians;

                for (
                    uint8 guardianIndex = 0;
                    guardianIndex < _guardianproof.length;
                    guardianIndex++
                ) {
                    //Check if the hashes match
                    for (
                        uint8 secretIndex = 0;
                        secretIndex < noOfGuardians;
                        secretIndex++
                    ) {
                        if (
                            _guardianproof[guardianIndex].secretHash ==
                            keccak256(abi.encodePacked(_secrets[secretIndex]))
                        ) {
                            safe.safeFunds -= guardianValue;
                            _guardianproof[guardianIndex].guardianAddress.call{
                                value: guardianValue
                            }("");
                        }
                    }
                }
                return true;
            } else {
                return false;
            }
        }
    }

    /* Getters */
    function getSafientMainContractBalance()
        public
        view
        returns (uint256 balance)
    {
        return address(this).balance;
    }
}
