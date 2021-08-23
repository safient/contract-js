// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "../interfaces/IArbitrator.sol";
import "../libraries/Types.sol";
import "../libraries/Events.sol";

contract Claims is Events {
    uint256 public claimsCount;
    uint256 public evidenceGroupID;
    uint256 public rulingOptions;
    mapping(uint256 => Types.Claim) public claims;

    constructor() {
        claimsCount = 0;
        evidenceGroupID = 0;
        rulingOptions = 2;
    }

    modifier claimCreationRequisite(
        string memory _safeId,
        Types.claimCreationRequisiteData memory data
    ) {
        require(data.safeCurrentOwner != address(0), "Safe does not exist");
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
        require(
            msg.sender == data.safeBeneficiary,
            "Only beneficiary of the safe can create the claim"
        );
        require(
            data.safeFunds >= data.arbitrationCost,
            "Insufficient funds in the safe to pay the arbitration fee"
        );
        _;
    }

    modifier submitEvidenceRequisite(
        uint256 _disputeID,
        string calldata _evidence
    ) {
        require(_disputeID <= claimsCount, "Claim or Dispute does not exist");
        Types.Claim memory claim = claims[_disputeID];
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

    modifier shouldBeValidRuling(uint256 _ruling) {
        require(_ruling <= rulingOptions, "Ruling out of bounds!");
        _;
    }

    function _submitEvidence(
        uint256 _disputeID,
        string calldata _evidence,
        IArbitrator arbitrator
    ) internal submitEvidenceRequisite(_disputeID, _evidence) returns (bool) {
        Types.Claim memory claim = claims[_disputeID];

        emit Evidence(
            arbitrator,
            claim.evidenceGroupId,
            msg.sender,
            _evidence
        );

        return true;
    }

    function _createClaim(
        string memory _safeId,
        string calldata _evidence,
        Types.claimCreationRequisiteData memory data
    ) internal claimCreationRequisite(_safeId, data) returns (uint256) {
        uint256 disputeID = data.arbitrator.createDispute{
            value: data.arbitrationCost
        }(rulingOptions, "");

        evidenceGroupID += 1;

        emit Dispute(
            data.arbitrator,
            disputeID,
            data.metaEvidenceId,
            evidenceGroupID
        );

        claims[disputeID] = Types.Claim({
            disputeId: disputeID,
            claimedBy: msg.sender,
            metaEvidenceId: data.metaEvidenceId,
            evidenceGroupId: evidenceGroupID,
            status: Types.ClaimStatus.Active,
            result: "Active"
        });

        claimsCount += 1;

        emit CreateClaim(msg.sender, _safeId, disputeID);

        if (bytes(_evidence).length != 0) {
            _submitEvidence(disputeID, _evidence, data.arbitrator);
        }

        return disputeID;
    }

    function _rule(
        uint256 _disputeID,
        uint256 _ruling,
        IArbitrator arbitrator
    ) internal onlyArbitrator(arbitrator) shouldBeValidRuling(_ruling) {
        Types.Claim memory claim = claims[_disputeID];

        if (_ruling == 1) {
            claim.status = Types.ClaimStatus.Passed; // 1
            claim.result = "Passed";
        } else if (_ruling == 2) {
            claim.status = Types.ClaimStatus.Failed; // 2
            claim.result = "Failed";
        } else if (_ruling == 0) {
            claim.status = Types.ClaimStatus.Refused; // 3
            claim.result = "RTA"; // Refused To Arbitrate (RTA)
        }

        claims[_disputeID] = claim;

        emit ClaimRuling(IArbitrator(msg.sender), _disputeID, _ruling);
    }
}
