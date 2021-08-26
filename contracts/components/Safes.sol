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
        require(safe.currentOwner != address(0), "Safe does not exist");
        _;
    }

    modifier retrieveSafeFundsRequisite(string memory _safeId) {
        Types.Safe memory safe = safes[_safeId];
        require(safe.currentOwner != address(0), "Safe does not exist");
        require(
            msg.sender == safe.currentOwner,
            "Only safe owner can retrieve the deposit balance"
        );
        require(safe.funds != 0, "No funds remaining in the safe");
        _;
    }

    event MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence);

    event CreateSafe(
        address indexed createdBy,
        address indexed beneficiary,
        uint256 indexed metaEvidenceId
    );

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

        if (_claimType == Types.ClaimType.ArbitrationBased) {
            metaEvidenceID += 1;
        }

        safes[_safeId] = Types.Safe({
            safeId: _safeId,
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

        if (_claimType == Types.ClaimType.ArbitrationBased) {
            emit MetaEvidence(metaEvidenceID, _metaEvidence);
        }
        emit CreateSafe(msg.sender, _beneficiary, metaEvidenceID);

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

        if (_claimType == Types.ClaimType.ArbitrationBased) {
            metaEvidenceID += 1;
        }

        safes[_safeId] = Types.Safe({
            safeId: _safeId,
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

        if (_claimType == Types.ClaimType.ArbitrationBased) {
            emit MetaEvidence(metaEvidenceID, _metaEvidence);
        }
        emit CreateSafe(_creator, msg.sender, metaEvidenceID);

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
        safe.funds += msg.value;
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

        (bool sent, ) = _to.call{value: safe.funds}("");
        require(sent, "Failed to send Ether");

        safe.funds = 0;
        safes[_safeId] = safe;

        return true;
    }

    function _sendSignal(string memory _safeId) internal returns (bool) {
        Types.Safe memory safe = safes[_safeId];

        require(
            msg.sender == safe.currentOwner,
            "Only safe current owner can send the signal"
        );
        require(
            safe.endSignalTime != 0,
            "Safe is not claimed since safe end signal time is zero"
        );
        require(
            block.timestamp < safe.endSignalTime,
            "Signaling period is over"
        );
        require(
            safe.latestSignalTime == 0,
            "Safe is already signaled since latest signal time of safe is not zero"
        );

        safe.latestSignalTime = block.timestamp;
        safes[_safeId] = safe;

        return true;
    }
}
