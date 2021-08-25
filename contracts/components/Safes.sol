// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "../interfaces/IArbitrator.sol";
import "../libraries/Types.sol";
import "../libraries/Events.sol";

contract Safes is Events {
    uint256 public safesCount;
    uint256 public metaEvidenceID;
    mapping(string => Types.Safe) public safes;

    constructor() {
        safesCount = 0;
        metaEvidenceID = 0;
    }

    modifier safeCreationByCreatorRequisite(
        string memory _safeId,
        address _beneficiary
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
        require(
            _beneficiary != address(0),
            "Should provide an beneficiary for the safe"
        );
        require(
            msg.sender != _beneficiary,
            "Safe creator should not be the beneficiary of the safe"
        );
        _;
    }

    modifier safeCreationByBeneficiaryRequisite(
        string memory _safeId,
        address _creator
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
        require(
            _creator != address(0),
            "Should provide an creator for the safe"
        );
        require(
            msg.sender != _creator,
            "Safe should be synced by the beneficiary of the safe"
        );
        _;
    }

    modifier depositSafeFundsRequisite(string memory _safeId) {
        Types.Safe memory safe = safes[_safeId];
        require(safe.safeCurrentOwner != address(0), "Safe does not exist");
        _;
    }

    modifier retrieveSafeFundsRequisite(string memory _safeId) {
        Types.Safe memory safe = safes[_safeId];
        require(safe.safeCurrentOwner != address(0), "Safe does not exist");
        require(
            msg.sender == safe.safeCurrentOwner,
            "Only safe owner can retrieve the deposit balance"
        );
        require(safe.safeFunds != 0, "No funds remaining in the safe");
        _;
    }

    function _createSafeByCreator(
        address _beneficiary,
        string memory _safeId,
        Types.ClaimType _claimType,
        uint256 _signalingPeriod,
        string calldata _metaEvidence
    )
        internal
        safeCreationByCreatorRequisite(_safeId, _beneficiary)
        returns (bool)
    {
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        if (_claimType == Types.ClaimType.KlerosCourt) {
            metaEvidenceID += 1;
        }

        safes[_safeId] = Types.Safe({
            safeId: _safeId,
            safeCreatedBy: msg.sender,
            safeCurrentOwner: msg.sender,
            safeBeneficiary: _beneficiary,
            signalingPeriod: _signalingPeriod,
            endSignalTime: 0,
            latestSignalTime: 0,
            claimType: _claimType,
            metaEvidenceId: metaEvidenceID,
            claimsCount: 0,
            safeFunds: msg.value
        });

        safesCount += 1;

        if (_claimType == Types.ClaimType.KlerosCourt) {
            emit Events.MetaEvidence(metaEvidenceID, _metaEvidence);
        }
        emit Events.CreateSafe(msg.sender, _beneficiary, metaEvidenceID);

        return true;
    }

    function _createSafeByBeneficiary(
        address _creator,
        string memory _safeId,
        Types.ClaimType _claimType,
        uint256 _signalingPeriod,
        string calldata _metaEvidence
    )
        internal
        safeCreationByBeneficiaryRequisite(_safeId, _creator)
        returns (bool)
    {
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        if (_claimType == Types.ClaimType.KlerosCourt) {
            metaEvidenceID += 1;
        }

        safes[_safeId] = Types.Safe({
            safeId: _safeId,
            safeCreatedBy: _creator,
            safeCurrentOwner: _creator,
            safeBeneficiary: msg.sender,
            signalingPeriod: _signalingPeriod,
            endSignalTime: 0,
            latestSignalTime: 0,
            claimType: _claimType,
            metaEvidenceId: metaEvidenceID,
            claimsCount: 0,
            safeFunds: msg.value
        });

        safesCount += 1;

        if (_claimType == Types.ClaimType.KlerosCourt) {
            emit Events.MetaEvidence(metaEvidenceID, _metaEvidence);
        }
        emit Events.CreateSafe(_creator, msg.sender, metaEvidenceID);

        return true;
    }

    function _depositSafeFunds(string memory _safeId)
        internal
        depositSafeFundsRequisite(_safeId)
        returns (bool)
    {
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        Types.Safe memory safe = safes[_safeId];
        safe.safeFunds += msg.value;
        safes[_safeId] = safe;

        return true;
    }

    function _retrieveSafeFunds(string memory _safeId)
        internal
        retrieveSafeFundsRequisite(_safeId)
        returns (bool)
    {
        Types.Safe memory safe = safes[_safeId];

        address _to = msg.sender;

        (bool sent, ) = _to.call{value: safe.safeFunds}("");
        require(sent, "Failed to send Ether");

        safe.safeFunds = 0;
        safes[_safeId] = safe;

        return true;
    }

    function _sendSignal(string memory _safeId) internal returns (bool) {
        Types.Safe memory safe = safes[_safeId];

        require(msg.sender == safe.safeCurrentOwner);
        require(safe.endSignalTime != 0);
        require(block.timestamp < safe.endSignalTime);
        require(safe.latestSignalTime == 0);

        safe.latestSignalTime = block.timestamp;
        safes[_safeId] = safe;

        return true;
    }
}
