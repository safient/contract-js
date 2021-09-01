// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "../interfaces/IArbitrator.sol";
import "../libraries/Types.sol";

contract Safes {
    uint256 public safesCount;
    uint256 public metaEvidenceID;
    mapping(string => Types.Safe) public safes;

    constructor() {
        safesCount = 0;
        metaEvidenceID = 0;
    }

    modifier createSafeByCreator(string memory _safeId, address _beneficiary) {
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

    modifier syncSafeByBeneficiary(string memory _safeId, address _creator) {
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

    modifier depositSafeFunds(string memory _safeId) {
        Types.Safe memory safe = safes[_safeId];
        require(safe.currentOwner != address(0), "Safe does not exist");
        _;
    }

    modifier withdrawSafeFunds(string memory _safeId) {
        Types.Safe memory safe = safes[_safeId];
        require(safe.currentOwner != address(0), "Safe does not exist");
        require(
            msg.sender == safe.currentOwner,
            "Only safe owner can withdraw the deposit balance"
        );
        require(safe.funds != 0, "No funds remaining in the safe");
        _;
    }

    modifier signal(string memory _safeId) {
        Types.Safe memory safe = safes[_safeId];
        require(
            msg.sender == safe.currentOwner,
            "Only safe current owner can send the signal"
        );
        require(
            safe.endSignalTime != 0,
            "Safe is not claimed since safe's endSignalTime is zero"
        );
        require(
            block.timestamp < safe.endSignalTime,
            "Signaling period is over"
        );
        require(
            safe.latestSignalTime == 0,
            "Safe is not claimed since safe's latestSignalTime is not zero"
        );
        _;
    }

    event MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence);

    event CreateSafe(
        address indexed createdBy,
        address indexed beneficiary,
        uint256 indexed metaEvidenceId
    );

    function _createSafe(
        address _beneficiary,
        string memory _safeId,
        Types.ClaimType _claimType,
        uint256 _signalingPeriod,
        string calldata _metaEvidence
    ) internal createSafeByCreator(_safeId, _beneficiary) returns (bool) {
        if (_claimType == Types.ClaimType.ArbitrationBased) {
            metaEvidenceID += 1;

            emit MetaEvidence(metaEvidenceID, _metaEvidence);
        }

        safes[_safeId] = Types.Safe({
            id: _safeId,
            createdBy: msg.sender,
            currentOwner: msg.sender,
            beneficiary: _beneficiary,
            signalingPeriod: _signalingPeriod,
            endSignalTime: 0,
            latestSignalTime: 0,
            claimType: _claimType,
            metaEvidenceId: metaEvidenceID,
            claimsCount: 0,
            funds: msg.value
        });

        safesCount += 1;

        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        emit CreateSafe(msg.sender, _beneficiary, metaEvidenceID);

        return true;
    }

    function _syncSafe(
        address _creator,
        string memory _safeId,
        Types.ClaimType _claimType,
        uint256 _signalingPeriod,
        string calldata _metaEvidence
    ) internal syncSafeByBeneficiary(_safeId, _creator) returns (bool) {
        if (_claimType == Types.ClaimType.ArbitrationBased) {
            metaEvidenceID += 1;

            emit MetaEvidence(metaEvidenceID, _metaEvidence);
        }

        safes[_safeId] = Types.Safe({
            id: _safeId,
            createdBy: _creator,
            currentOwner: _creator,
            beneficiary: msg.sender,
            signalingPeriod: _signalingPeriod,
            endSignalTime: 0,
            latestSignalTime: 0,
            claimType: _claimType,
            metaEvidenceId: metaEvidenceID,
            claimsCount: 0,
            funds: msg.value
        });

        safesCount += 1;

        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        emit CreateSafe(_creator, msg.sender, metaEvidenceID);

        return true;
    }

    function _depositFunds(string memory _safeId)
        internal
        depositSafeFunds(_safeId)
        returns (bool)
    {
        Types.Safe memory safe = safes[_safeId];
        safe.funds += msg.value;
        safes[_safeId] = safe;

        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        return true;
    }

    function _withdrawFunds(string memory _safeId)
        internal
        withdrawSafeFunds(_safeId)
        returns (bool)
    {
        Types.Safe memory safe = safes[_safeId];

        address _to = msg.sender;

        uint256 funds = safe.funds;

        safe.funds = 0;
        safes[_safeId] = safe;

        (bool sent, ) = _to.call{value: funds}("");
        require(sent, "Failed to send Ether");

        return true;
    }

    function _sendSignal(string memory _safeId)
        internal
        signal(_safeId)
        returns (bool)
    {
        Types.Safe memory safe = safes[_safeId];

        safe.latestSignalTime = block.timestamp;
        safe.endSignalTime = 0;
        safes[_safeId] = safe;

        return true;
    }
}
