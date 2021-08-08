// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "./contracts/Safes.sol";
import "./contracts/Claims.sol";
import "./contracts/Guardians.sol";
import "./interfaces/IArbitrator.sol";
import "./interfaces/IArbitrable.sol";

contract SafientMain is Safes, Claims, Guardians, IArbitrable {
    IArbitrator public arbitrator;
    address public safientMainAdmin;

    constructor(IArbitrator _arbitrator) {
        arbitrator = _arbitrator;
        safientMainAdmin = msg.sender;
    }

    receive() external payable {}

    function getSafientMainContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function createSafe(
        address _beneficiary,
        string memory _safeId,
        string calldata _metaEvidence
    ) external payable returns (bool) {
        return
            _createSafeByCreator(
                _beneficiary,
                _safeId,
                _metaEvidence,
                arbitrator
            );
    }

    function syncSafe(
        address _creator,
        string memory _safeId,
        string calldata _metaEvidence
    ) external payable returns (bool) {
        return
            _createSafeByBeneficiary(
                _creator,
                _safeId,
                _metaEvidence,
                arbitrator
            );
    }

    function createClaim(string memory _safeId, string calldata _evidence)
        external
        payable
        returns (bool)
    {
        Types.Safe memory safe = safes[_safeId];

        uint256 arbitrationCost = arbitrator.arbitrationCost("");

        Types.claimCreationRequisiteData memory data = Types
            .claimCreationRequisiteData(
                arbitrator,
                arbitrationCost,
                safe.metaEvidenceId,
                safe.safeCurrentOwner,
                safe.safeBeneficiary,
                safe.safeFunds
            );

        _createClaim(_safeId, _evidence, data);

        safe.claimsCount += 1;
        safe.safeFunds -= arbitrationCost;

        safes[_safeId] = safe;

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
    }

    function depositSafeFunds(string memory _safeId)
        external
        payable
        returns (bool)
    {
        return _depositSafeFunds(_safeId);
    }

    function retrieveSafeFunds(string memory _safeId) external returns (bool) {
        return _retrieveSafeFunds(_safeId);
    }

    function guardianProof(
        string memory _message,
        bytes memory _signature,
        Types.RecoveryProof[] memory _guardianproof,
        string[] memory _secrets,
        string memory _safeId
    ) internal returns (bool) {
        Types.Safe memory safe = safes[_safeId];
        return
            _guardianProof(
                _message,
                _signature,
                _guardianproof,
                _secrets,
                safe.safeCreatedBy,
                safe.safeFunds
            );
    }
}
