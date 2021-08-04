// SPDX-License-Identifier: MIT
pragma solidity >=0.7;

import "../interfaces/IArbitrator.sol";
import "./Events.sol";
import "./Datas.sol";

library Claims {
    modifier claimCreationRequisite(
        Datas.Data storage _data,
        string memory _safeId,
        string calldata _evidence
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
        Types.Safe memory safe = _data.safes[_safeId];
        require(safe.safeCreatedBy != address(0), "safe does not exist");
        require(safe.safeCurrentOwner != address(0), "safe does not exist");
        require(safe.safeInheritor != address(0), "safe does not exist");
        require(
            msg.sender == safe.safeInheritor,
            "Only inheritor of the safe can create the claim"
        );
        require(
            safe.safeFunds >= _data.arbitrator.arbitrationCost(""),
            "Insufficient funds in the safe to pay the arbitration fee"
        );
        _;
    }

    modifier submitEvidenceRequisite(
        Datas.Data storage _data,
        uint256 _disputeID,
        string calldata _evidence
    ) {
        require(
            _disputeID <= _data.claimsCount,
            "Claim or Dispute does not exist"
        );
        Types.Claim memory claim = _data.claims[_disputeID];
        require(
            msg.sender == claim.claimedBy,
            "Only creator of the claim can submit the evidence"
        );
        _;
    }

    modifier onlyArbitrator(Datas.Data storage _data) {
        require(
            msg.sender == address(_data.arbitrator),
            "Only arbitrator can execute this"
        );
        _;
    }

    modifier shouldBeValidRuling(Datas.Data storage _data, uint256 _ruling) {
        require(_ruling <= _data.rulingOptions, "Ruling out of bounds!");
        _;
    }

    function submitEvidence(
        Datas.Data storage _data,
        uint256 _disputeID,
        string calldata _evidence
    )
        public
        submitEvidenceRequisite(_data, _disputeID, _evidence)
        returns (bool)
    {
        Types.Claim memory claim = _data.claims[_disputeID];
        emit Events.Evidence(
            _data.arbitrator,
            claim.evidenceGroupId,
            msg.sender,
            _evidence
        );
        return true;
    }

    function createClaim(
        Datas.Data storage _data,
        string memory _safeId,
        string calldata _evidence
    )
        internal
        claimCreationRequisite(_data, _safeId, _evidence)
        returns (bool)
    {
        uint256 disputeID = _data.arbitrator.createDispute{
            value: _data.arbitrator.arbitrationCost("")
        }(_data.rulingOptions, "");
        Types.Safe memory safe = _data.safes[_safeId];
        _data.evidenceGroupID += 1;
        emit Events.Dispute(
            _data.arbitrator,
            disputeID,
            safe.metaEvidenceId,
            _data.evidenceGroupID
        );
        Types.Claim memory claim = _data.claims[disputeID];
        claim = Types.Claim({
            safeId: _safeId,
            disputeId: disputeID,
            claimedBy: msg.sender,
            metaEvidenceId: safe.metaEvidenceId,
            evidenceGroupId: _data.evidenceGroupID,
            status: Types.ClaimStatus.Active,
            result: "Active"
        });
        _data.claims[disputeID] = claim;
        _data.claimsCount += 1;
        emit Events.CreateClaim(msg.sender, _safeId, disputeID);
        safe.claimsCount += 1;
        safe.safeFunds -= _data.arbitrator.arbitrationCost("");
        _data.safes[_safeId] = safe;
        if (bytes(_evidence).length != 0) {
            submitEvidence(_data, disputeID, _evidence);
        }
        return true;
    }

    function rule(
        Datas.Data storage _data,
        uint256 _disputeID,
        uint256 _ruling
    )
        internal
        onlyArbitrator(_data)
        shouldBeValidRuling(_data, _ruling)
        returns (bool)
    {
        Types.Claim memory claim = _data.claims[_disputeID];
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
        _data.claims[_disputeID] = claim;
        emit Events.Ruling(IArbitrator(msg.sender), _disputeID, _ruling);
        return true;
    }
}
