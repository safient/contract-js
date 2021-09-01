// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "./components/Safes.sol";
import "./components/Claims.sol";
import "./components/Guardians.sol";
import "./interfaces/IArbitrator.sol";
import "./interfaces/IArbitrable.sol";
import "./libraries/Types.sol";

contract SafientMain is Safes, Claims, Guardians, IArbitrable {
    IArbitrator public arbitrator;
    address public admin;

    constructor(IArbitrator _arbitrator) {
        arbitrator = _arbitrator;
        admin = msg.sender;
    }

    receive() external payable {}

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function createSafe(
        address _beneficiary,
        string memory _safeId,
        Types.ClaimType _claimType,
        uint256 _signalingPeriod,
        string calldata _metaEvidence
    ) external payable returns (bool) {
        return
            _createSafe(
                _beneficiary,
                _safeId,
                _claimType,
                _signalingPeriod,
                _metaEvidence
            );
    }

    function syncSafe(
        address _creator,
        string memory _safeId,
        Types.ClaimType _claimType,
        uint256 _signalingPeriod,
        string calldata _metaEvidence
    ) external payable returns (bool) {
        return
            _syncSafe(
                _creator,
                _safeId,
                _claimType,
                _signalingPeriod,
                _metaEvidence
            );
    }

    function createClaim(string memory _safeId, string calldata _evidence)
        external
        payable
        returns (bool)
    {
        Types.Safe memory safe = safes[_safeId];

        if (safe.claimType == Types.ClaimType.ArbitrationBased) {
            uint256 arbitrationCost = arbitrator.arbitrationCost("");

            Types.ArbitrationBasedClaimData memory data = Types
                .ArbitrationBasedClaimData(
                    arbitrator,
                    arbitrationCost,
                    safe.currentOwner,
                    safe.beneficiary,
                    safe.metaEvidenceId,
                    safe.funds
                );

            _createArbitrationBasedClaim(_safeId, _evidence, data);

            safe.claimsCount += 1;
            safe.funds -= arbitrationCost;
            safes[_safeId] = safe;
        } else if (safe.claimType == Types.ClaimType.SignalBased) {
            Types.SignalBasedClaimData memory data = Types.SignalBasedClaimData(
                _safeId,
                safe.currentOwner,
                safe.beneficiary,
                safe.endSignalTime
            );

            safe.latestSignalTime = 0;
            safe.endSignalTime = block.timestamp + safe.signalingPeriod;

            _createSignalBasedClaim(_safeId, data);

            safe.claimsCount += 1;
            safes[_safeId] = safe;
        }

        return true;
    }

    function submitEvidence(uint256 _disputeID, string calldata _evidence)
        external
        returns (bool)
    {
        return _submitEvidence(_disputeID, _evidence, arbitrator);
    }

    function rule(uint256 _disputeID, uint256 _ruling) external override {
        _rule(_disputeID, _ruling, arbitrator);

        emit Ruling(IArbitrator(msg.sender), _disputeID, _ruling);
    }

    function depositFunds(string memory _safeId)
        external
        payable
        returns (bool)
    {
        return _depositFunds(_safeId);
    }

    function withdrawFunds(string memory _safeId) external returns (bool) {
        return _withdrawFunds(_safeId);
    }

    function sendSignal(string memory _safeId) external returns (bool) {
        return _sendSignal(_safeId);
    }

    function getClaimStatus(string memory _safeId, uint256 _disputeID)
        external
        view
        returns (Types.ClaimStatus status)
    {
        Types.Safe memory safe = safes[_safeId];

        if (safe.claimType == Types.ClaimType.ArbitrationBased) {
            Types.Claim memory claim = claims[_disputeID];

            return claim.status;
        } else if (safe.claimType == Types.ClaimType.SignalBased) {
            if (
                safe.latestSignalTime == 0 &&
                safe.endSignalTime != 0 &&
                block.timestamp < safe.endSignalTime
            ) {
                return Types.ClaimStatus.Active;
            } else if (
                safe.latestSignalTime == 0 &&
                safe.endSignalTime != 0 &&
                block.timestamp > safe.endSignalTime
            ) {
                return Types.ClaimStatus.Passed;
            } else if (safe.latestSignalTime > 0 && safe.endSignalTime == 0) {
                return Types.ClaimStatus.Failed;
            }
        }
    }

    function guardianProof(
        string memory _message,
        bytes memory _signature,
        Types.RecoveryProof[] memory _guardianproof,
        string[] memory _secrets,
        string memory _safeId
    ) external returns (bool) {
        Types.Safe memory safe = safes[_safeId];
        return
            _guardianProof(
                _message,
                _signature,
                _guardianproof,
                _secrets,
                safe.createdBy,
                safe.funds
            );
    }
}
