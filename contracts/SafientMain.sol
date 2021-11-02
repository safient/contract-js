// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./components/Safes.sol";
import "./components/Claims.sol";
import "./components/Guardians.sol";
import "./interfaces/IArbitrator.sol";
import "./interfaces/IArbitrable.sol";
import "./libraries/Types.sol";

/**
 * @title Safient Protocol's main contract
 * @notice This contract implements the public and external interface for
 * the Safient Protocol to create and interact with Safes and Claims
 */
contract SafientMain is Safes, Claims, Guardians, IArbitrable {
    /** Address of the arbitrator */
    IArbitrator public arbitrator;

    /**
     * @notice Constructor sets the address of the arbitrator
     * @param _arbitrator address of the arbitrator
     */
    constructor(IArbitrator _arbitrator) {
        arbitrator = _arbitrator;
    }

    receive() external payable {}

    /**
     * @notice Get the contract balance
     * @return Balance of the contract
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Create a new safe by the safe creator
     * @param _beneficiary Address of the safe beneficiary
     * @param _safeId Id of the safe
     * @param _claimType Type of the claim
     * @param _signalingPeriod Signaling time window
     * @param _DDay The timestamp after which the beneficiary can directly claim the safe
     * @param _metaEvidence URL of the metaevidence
     */
    function createSafe(
        address _beneficiary,
        string memory _safeId,
        Types.ClaimType _claimType,
        uint256 _signalingPeriod,
        uint256 _DDay,
        string calldata _metaEvidence
    ) external payable returns (bool) {
        return
            _createSafe(
                _beneficiary,
                _safeId,
                _claimType,
                _signalingPeriod,
                _DDay,
                _metaEvidence
            );
    }

    /**
     * @notice Create a new safe by the safe beneficiary
     * @param _creator Address of the safe creator
     * @param _safeId Id of the safe
     * @param _claimType Type of the claim
     * @param _signalingPeriod Signaling time window
     * @param _DDay The timestamp after which the beneficiary can directly claim the safe
     * @param _metaEvidence URL of the metaevidence
     */
    function syncSafe(
        address _creator,
        string memory _safeId,
        Types.ClaimType _claimType,
        uint256 _signalingPeriod,
        uint256 _DDay,
        string calldata _metaEvidence
    ) external payable returns (bool) {
        return
            _syncSafe(
                _creator,
                _safeId,
                _claimType,
                _signalingPeriod,
                _DDay,
                _metaEvidence
            );
    }

    /**
     * @notice Create a claim on a safe
     * @param _safeId Id of the safe
     * @param _evidence URL of the evidence
     */
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
        } else if (safe.claimType == Types.ClaimType.DDayBased) {
            Types.DDayBasedClaimData memory data = Types.DDayBasedClaimData(
                safe.currentOwner,
                safe.beneficiary,
                safe.dDay
            );

            _createDDayBasedClaim(_safeId, data);

            safe.claimsCount += 1;
            safes[_safeId] = safe;
        }
        return true;
    }

    /**
     * @notice Submit the evidence for arbitration based claims
     * @param _disputeID Dispute id of the claim
     * @param _evidence URL of the evidence
     */
    function submitEvidence(uint256 _disputeID, string calldata _evidence)
        external
        returns (bool)
    {
        return _submitEvidence(_disputeID, _evidence, arbitrator);
    }

    /**
     * @notice Give a ruling on an arbitration based claim
     * @param _disputeID Dispute id of the claim
     * @param _ruling Ruling on the claim
     */
    function rule(uint256 _disputeID, uint256 _ruling) external override {
        _rule(_disputeID, _ruling, arbitrator);

        emit Ruling(IArbitrator(msg.sender), _disputeID, _ruling);
    }

    /**
     * @notice Deposit funds into a safe
     * @param _safeId Id of the safe
     */
    function depositFunds(string memory _safeId)
        external
        payable
        returns (bool)
    {
        return _depositFunds(_safeId);
    }

    /**
     * @notice Withdraw funds from the safe
     * @param _safeId Id of the safe
     */
    function withdrawFunds(string memory _safeId) external returns (bool) {
        return _withdrawFunds(_safeId);
    }

    /**
     * @notice Signal the safe in response to the claim made on
     * the safe
     * @param _safeId Id of the safe
     */
    function sendSignal(string memory _safeId) external returns (bool) {
        return _sendSignal(_safeId);
    }

    /**
     * @notice Get the status of a claim
     * @param _safeId Id of the safe
     * @param _claimId Id of the claim
     */
    function getClaimStatus(string memory _safeId, uint256 _claimId)
        external
        view
        returns (Types.ClaimStatus status)
    {
        Types.Safe memory safe = safes[_safeId];

        if (
            safe.claimType == Types.ClaimType.ArbitrationBased ||
            safe.claimType == Types.ClaimType.DDayBased
        ) {
            Types.Claim memory claim = claims[_claimId];

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

    /**
     * @notice Submit the guardian proof
     * @param _message Message generated during the safe creation and also
     * signed by the safe creator
     * @param _signature Signature of the message signed by the creator
     * @param _guardianproof Array of structs which includes guardian
     * address and the secret
     * @param _secrets Array of guardian secrets
     * @param _safeId Id of the safe
     */
    function guardianProof(
        string memory _message,
        bytes memory _signature,
        Types.RecoveryProof[] memory _guardianproof,
        string[] memory _secrets,
        string memory _safeId
    ) external returns (bool) {
        Types.Safe memory safe = safes[_safeId];

        uint256 safeFunds = safe.funds;

        safe.funds = 0;
        safes[_safeId] = safe;

        bool result = _guardianProof(
            _message,
            _signature,
            _guardianproof,
            _secrets,
            safe.createdBy,
            safeFunds
        );

        require(result == true, "Invalid guardian proof");

        return result;
    }

    /**
     * @notice Claim the guardian rewards
     * @param _funds Total funds need to be claimed
     */
    function claimRewards(uint256 _funds) external returns (bool) {
        return _claimRewards(_funds);
    }

    /**
     * @notice Update the D-Day
     * @param _safeId Id of the safe
     * @param _DDay The timestamp after which the beneficiary can directly claim the safe
     */
    function updateDDay(string memory _safeId, uint256 _DDay)
        external
        returns (bool)
    {
        return _updateDDay(_safeId, _DDay);
    }
}
