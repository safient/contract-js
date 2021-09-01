// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "../interfaces/IArbitrator.sol";
import "../libraries/Types.sol";

contract Claims {
    uint256 public claimsCount;
    uint256 public evidenceGroupID;
    uint256 public rulingOptions;
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

    modifier evidenceSubmission(uint256 _disputeID, string calldata _evidence) {
        require(_disputeID <= claimsCount, "Claim or Dispute does not exist");
        require(bytes(_evidence).length > 1, "Should provide evidence URI");
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
        uint256 _metaEvidenceID,
        uint256 _evidenceGroupID
    );

    event CreateClaim(
        address indexed createdBy,
        string indexed safeId,
        uint256 indexed id
    );

    function _submitEvidence(
        uint256 _disputeID,
        string calldata _evidence,
        IArbitrator arbitrator
    ) internal evidenceSubmission(_disputeID, _evidence) returns (bool) {
        Types.Claim memory claim = claims[_disputeID];

        emit Evidence(arbitrator, claim.evidenceGroupId, msg.sender, _evidence);

        return true;
    }

    function _createArbitrationBasedClaim(
        string memory _safeId,
        string calldata _evidence,
        Types.ArbitrationBasedClaimData memory data
    ) internal arbitrationBasedClaim(_safeId, data) returns (uint256) {
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
            id: disputeID,
            claimedBy: msg.sender,
            claimType: Types.ClaimType.ArbitrationBased,
            metaEvidenceId: data.metaEvidenceId,
            evidenceGroupId: evidenceGroupID,
            status: Types.ClaimStatus.Active
        });

        claimsCount += 1;

        emit CreateClaim(msg.sender, _safeId, disputeID);

        if (bytes(_evidence).length != 0) {
            _submitEvidence(disputeID, _evidence, data.arbitrator);
        }

        return disputeID;
    }

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

        emit CreateClaim(msg.sender, _safeId, claimsCount);
    }

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
