// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/IArbitrator.sol";
import "../libraries/Types.sol";

/**
 * @title Safient Protocol's Claims contract
 * @notice This contract implements functions for creating arbitration based
 * and signal based claims and includes a rule function to receive
 * arbitration based ruling
 */
contract Claims {
    /** @notice Total number of claims created */
    uint256 public claimsCount;

    /**
     * @notice Total number of evidences submitted
     * @dev evidenceGroupID is only incremented when an arbitration based claim
     * is created
     */
    uint256 public evidenceGroupID;

    /** @notice Total number of ruling options */
    uint256 public rulingOptions;

    /** @notice Maps each claim with it's id */
    mapping(uint256 => Types.Claim) public claims;

    constructor() {
        claimsCount = 0;
        evidenceGroupID = 0;
        rulingOptions = 2;
    }

    modifier arbitrationBasedClaim(
        string memory _safeId,
        Types.ArbitrationBasedClaimData memory data
    ) {
        require(data.currentOwner != address(0), "Safe does not exist");

        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );

        require(
            msg.sender == data.beneficiary,
            "Only beneficiary of the safe can create the claim"
        );

        require(
            data.funds >= data.arbitrationCost,
            "Insufficient funds in the safe to pay the arbitration fee"
        );
        _;
    }

    modifier signalBasedClaim(
        string memory _safeId,
        Types.SignalBasedClaimData memory data
    ) {
        require(data.currentOwner != address(0), "Safe does not exist");

        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );

        require(
            msg.sender == data.beneficiary,
            "Only beneficiary of the safe can create the claim"
        );

        require(data.endSignalTime == 0, "Safe end signal time should be zero");
        _;
    }

    modifier dDayBasedClaim(
        string memory _safeId,
        Types.DDayBasedClaimData memory data
    ) {
        require(data.currentOwner != address(0), "Safe does not exist");

        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );

        require(
            msg.sender == data.beneficiary,
            "Only beneficiary of the safe can create the claim"
        );

        require(data.dDay != 0, "D day is not set by the safe's current owner");
        _;
    }

    modifier ExpirionBasedClaim(
        string memory _safeId,
        Types.ExpirionClaimData memory data
    ) {
        require(data.currentOwner != address(0), "Safe does not exist");

        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );

        require(
            msg.sender == data.beneficiary,
            "Only beneficiary of the safe can create the claim"
        );

        require(
            data.expiryDay != 0,
            "Expiry date is not set by the safe's current owner"
        );
        _;
    }

    modifier evidenceSubmission(uint256 _disputeID, string calldata _evidence) {
        Types.Claim memory claim = claims[_disputeID];

        require(_disputeID <= claimsCount, "Claim or Dispute does not exist");

        require(bytes(_evidence).length > 1, "Should provide evidence URI");

        require(
            msg.sender == claim.claimedBy,
            "Only creator of the claim can submit the evidence"
        );
        _;
    }

    modifier onlyArbitrator(IArbitrator arbitrator) {
        require(
            msg.sender == address(arbitrator),
            "Only arbitrator can execute this"
        );
        _;
    }

    modifier validRuling(uint256 _ruling) {
        require(_ruling <= rulingOptions, "Ruling out of bounds!");
        _;
    }

    event Evidence(
        IArbitrator indexed _arbitrator,
        uint256 indexed _evidenceGroupID,
        address indexed _party,
        string _evidence
    );

    event Dispute(
        IArbitrator indexed _arbitrator,
        uint256 indexed _disputeID,
        uint256 _metaEvidenceID
    );

    event CreateClaim(
        string indexed safeId,
        uint256 indexed id,
        uint256 timeStamp
    );

    /**
     * @notice Submit evidence for arbitration based claims
     * @param _disputeID Dispute id of the claim
     * @param _evidence Evidence URL
     * @param arbitrator Address of the arbitrator
     */
    function _submitEvidence(
        uint256 _disputeID,
        string calldata _evidence,
        IArbitrator arbitrator
    ) internal evidenceSubmission(_disputeID, _evidence) returns (bool) {
        Types.Claim memory claim = claims[_disputeID];

        emit Evidence(arbitrator, claim.evidenceGroupId, msg.sender, _evidence);

        return true;
    }

    /**
     * @notice Create a new arbitration based claim
     * @param _safeId Id of the safe
     * @param _evidence Evidence URL
     * @param data Includes safe data and arbitration data
     */
    function _createArbitrationBasedClaim(
        string memory _safeId,
        string calldata _evidence,
        Types.ArbitrationBasedClaimData memory data
    ) internal arbitrationBasedClaim(_safeId, data) returns (uint256) {
        uint256 disputeID = data.arbitrator.createDispute{
            value: data.arbitrationCost
        }(rulingOptions, "");

        evidenceGroupID += 1;

        emit Dispute(data.arbitrator, disputeID, data.metaEvidenceId);

        claims[disputeID] = Types.Claim({
            id: disputeID,
            claimedBy: msg.sender,
            claimType: Types.ClaimType.ArbitrationBased,
            metaEvidenceId: data.metaEvidenceId,
            evidenceGroupId: evidenceGroupID,
            status: Types.ClaimStatus.Active
        });

        claimsCount += 1;
        emit CreateClaim(_safeId, disputeID, block.timestamp);
        if (bytes(_evidence).length != 0) {
            _submitEvidence(disputeID, _evidence, data.arbitrator);
        }

        return disputeID;
    }

    /**
     * @notice Create a new signal based claim
     * @param _safeId Id of the safe
     * @param data Includes safe data
     */
    function _createSignalBasedClaim(
        string memory _safeId,
        Types.SignalBasedClaimData memory data
    ) internal signalBasedClaim(_safeId, data) {
        claimsCount += 1;

        claims[claimsCount] = Types.Claim({
            id: claimsCount,
            claimedBy: msg.sender,
            claimType: Types.ClaimType.SignalBased,
            metaEvidenceId: 0,
            evidenceGroupId: 0,
            status: Types.ClaimStatus.Active
        });

        emit CreateClaim(_safeId, claimsCount, block.timestamp);
    }

    /**
     * @notice Create a new D-Day based claim
     * @param _safeId Id of the safe
     * @param data Includes safe data
     */
    function _createDDayBasedClaim(
        string memory _safeId,
        Types.DDayBasedClaimData memory data
    ) internal dDayBasedClaim(_safeId, data) {
        claimsCount += 1;

        require(
            block.timestamp >= data.dDay,
            "Cannot create claim before DDay"
        );
        claims[claimsCount] = Types.Claim({
            id: claimsCount,
            claimedBy: msg.sender,
            claimType: Types.ClaimType.DDayBased,
            metaEvidenceId: 0,
            evidenceGroupId: 0,
            status: Types.ClaimStatus.Passed
        });

        emit CreateClaim(_safeId, claimsCount, block.timestamp);
    }

    /**
     * @notice Create a new Expiry-Day based claim
     * @param _safeId Id of the safe
     * @param data Includes safe data
     */
    function _createExpirionBasedClaim(
        string memory _safeId,
        Types.ExpirionClaimData memory data
    ) internal ExpirionBasedClaim(_safeId, data) {
        claimsCount += 1;
        require(block.timestamp < data.expiryDay, "Claim has been expired");
        claims[claimsCount] = Types.Claim({
            id: claimsCount,
            claimedBy: msg.sender,
            claimType: Types.ClaimType.Expirion,
            metaEvidenceId: 0,
            evidenceGroupId: 0,
            status: Types.ClaimStatus.Passed
        });

        emit CreateClaim(_safeId, claimsCount, block.timestamp);
    }

    /**
     * @notice Give a ruling on an arbitration based claim
     * @param _disputeID Dispute id of the claim
     * @param _ruling Ruling on the claim
     * @param arbitrator Address of the arbitrator
     */
    function _rule(
        uint256 _disputeID,
        uint256 _ruling,
        IArbitrator arbitrator
    ) internal onlyArbitrator(arbitrator) validRuling(_ruling) {
        Types.Claim memory claim = claims[_disputeID];

        if (_ruling == 1) {
            claim.status = Types.ClaimStatus.Passed; // 1
        } else if (_ruling == 2) {
            claim.status = Types.ClaimStatus.Failed; // 2
        } else if (_ruling == 0) {
            claim.status = Types.ClaimStatus.Refused; // 3
        }

        claims[_disputeID] = claim;
    }
}
