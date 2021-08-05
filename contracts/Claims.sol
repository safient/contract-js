// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IArbitrator.sol";
import "./interfaces/IArbitrable.sol";
import "./interfaces/IClaims.sol";
import "./libraries/Events.sol";

contract Claims is IArbitrable {
    Types.ClaimsData private _claimsData;

    constructor(IArbitrator _arbitratorAddress) {
        _claimsData.arbitratorContract = _arbitratorAddress;
        _claimsData.rulingOptions = 2;
        _claimsData.claimsCount = 0;
        _claimsData.evidenceGroupID = 0;
    }

    modifier onlyArbitrator() {
        require(
            msg.sender == address(_claimsData.arbitratorContract),
            "Only arbitrator can execute this"
        );
        _;
    }

    modifier shouldBeValidRuling(uint256 _ruling) {
        require(_ruling <= _claimsData.rulingOptions, "Ruling out of bounds!");
        _;
    }

    modifier submitEvidenceRequisite(
        uint256 _disputeID,
        string calldata _evidence,
        address _claimedBy
    ) {
        require(
            _disputeID <= _claimsData.claimsCount,
            "Claim or Dispute does not exist"
        );
        Types.Claim memory claim = _claimsData.claims[_disputeID];
        require(
            _claimedBy == claim.claimedBy,
            "Only creator of the claim can submit the evidence"
        );
        _;
    }

    receive() external payable {}

    function claimsCount() external view returns (uint256) {
        return _claimsData.claimsCount;
    }

    function claims(uint256 _disputeId)
        external
        view
        returns (Types.Claim memory)
    {
        return _claimsData.claims[_disputeId];
    }

    function claimsOnSafe(string memory _safeId)
        external
        view
        returns (uint256[] memory)
    {
        return _claimsData.claimsOnSafe[_safeId];
    }

    function submitEvidence(
        uint256 _disputeID,
        string calldata _evidence,
        address _claimedBy
    ) public submitEvidenceRequisite(_disputeID, _evidence, _claimedBy) {
        Types.Claim memory claim = _claimsData.claims[_disputeID];
        emit Events.Evidence(
            _claimsData.arbitratorContract,
            claim.evidenceGroupId,
            msg.sender,
            _evidence
        );
    }

    function createClaim(
        string memory _safeId,
        string calldata _evidence,
        uint256 _metaEvidenceId,
        address _claimedBy
    ) external returns (uint256) {
        uint256 disputeID = _claimsData.arbitratorContract.createDispute{
            value: _claimsData.arbitratorContract.arbitrationCost("")
        }(_claimsData.rulingOptions, "");
        _claimsData.evidenceGroupID += 1;
        emit Events.Dispute(
            _claimsData.arbitratorContract,
            disputeID,
            _metaEvidenceId,
            _claimsData.evidenceGroupID
        );
        Types.Claim memory claim = _claimsData.claims[disputeID];
        claim = Types.Claim({
            disputeId: disputeID,
            claimedBy: _claimedBy,
            metaEvidenceId: _metaEvidenceId,
            evidenceGroupId: _claimsData.evidenceGroupID,
            status: Types.ClaimStatus.Active,
            result: "Active"
        });
        _claimsData.claims[disputeID] = claim;
        _claimsData.claimsCount += 1;
        emit Events.CreateClaim(msg.sender, _safeId, disputeID);
        if (bytes(_evidence).length != 0) {
            submitEvidence(disputeID, _evidence, _claimedBy);
        }
        _claimsData.claimsOnSafe[_safeId].push(disputeID);
        return disputeID;
    }

    function rule(uint256 _disputeID, uint256 _ruling)
        external
        override
        onlyArbitrator
        shouldBeValidRuling(_ruling)
    {
        Types.Claim memory claim = _claimsData.claims[_disputeID];
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
        _claimsData.claims[_disputeID] = claim;
        emit Events.Ruling(_claimsData.arbitratorContract, _disputeID, _ruling);
    }
}
