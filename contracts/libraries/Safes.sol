// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

import "../interfaces/IArbitrator.sol";
import "./Events.sol";
import "./Types.sol";

library Safes {
    modifier safeCreationRequisite(
        Types.MainData storage _mainData,
        address _beneficiary,
        string memory _safeId,
        string calldata _metaEvidence
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
        require(
            msg.value >= _mainData.arbitratorContract.arbitrationCost(""),
            "Inadequate fee payment"
        );
        require(
            bytes(_metaEvidence).length > 0,
            "Should provide metaEvidence to create a safe"
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

    modifier syncSafeRequisite(
        Types.MainData storage _mainData,
        address _creator,
        string memory _safeId,
        string calldata _metaEvidence
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
        require(
            msg.value >= _mainData.arbitratorContract.arbitrationCost(""),
            "Inadequate fee payment"
        );
        require(
            bytes(_metaEvidence).length > 0,
            "Should provide metaEvidence to create a safe"
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

    modifier depositSafeFundsRequisite(
        Types.MainData storage _mainData,
        string memory _safeId
    ) {
        Types.Safe memory safe = _mainData.safes[_safeId];
        require(safe.safeCurrentOwner != address(0), "Safe does not exist");
        _;
    }

    modifier retrieveSafeFundsRequisite(
        Types.MainData storage _mainData,
        string memory _safeId
    ) {
        Types.Safe memory safe = _mainData.safes[_safeId];
        require(safe.safeCurrentOwner != address(0), "Safe does not exist");
        require(
            msg.sender == safe.safeCurrentOwner,
            "Only safe owner can retrieve the deposit balance"
        );
        require(safe.safeFunds != 0, "No funds remaining in the safe");
        _;
    }

    function createSafe(
        Types.MainData storage _mainData,
        address _beneficiary,
        string memory _safeId,
        string calldata _metaEvidence
    )
        internal
        safeCreationRequisite(_mainData, _beneficiary, _safeId, _metaEvidence)
        returns (bool)
    {
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        _mainData.metaEvidenceID += 1;
        Types.Safe memory safe = _mainData.safes[_safeId];
        safe = Types.Safe({
            safeId: _safeId,
            safeCreatedBy: msg.sender,
            safeCurrentOwner: msg.sender,
            safeBeneficiary: _beneficiary,
            metaEvidenceId: _mainData.metaEvidenceID,
            claimsCount: 0,
            safeFunds: msg.value
        });
        _mainData.safes[_safeId] = safe;
        _mainData.safesCount += 1;
        emit Events.MetaEvidence(_mainData.metaEvidenceID, _metaEvidence);
        emit Events.CreateSafe(
            msg.sender,
            _beneficiary,
            _mainData.metaEvidenceID
        );
        return true;
    }

    function syncSafe(
        Types.MainData storage _mainData,
        address _creator,
        string memory _safeId,
        string calldata _metaEvidence
    )
        internal
        syncSafeRequisite(_mainData, _creator, _safeId, _metaEvidence)
        returns (bool)
    {
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        _mainData.metaEvidenceID += 1;
        Types.Safe memory safe = _mainData.safes[_safeId];
        safe = Types.Safe({
            safeId: _safeId,
            safeCreatedBy: _creator,
            safeCurrentOwner: _creator,
            safeBeneficiary: msg.sender,
            metaEvidenceId: _mainData.metaEvidenceID,
            claimsCount: 0,
            safeFunds: msg.value
        });
        _mainData.safes[_safeId] = safe;
        _mainData.safesCount += 1;
        emit Events.MetaEvidence(_mainData.metaEvidenceID, _metaEvidence);
        emit Events.CreateSafe(msg.sender, _creator, _mainData.metaEvidenceID);
        return true;
    }

    function depositSafeFunds(
        Types.MainData storage _mainData,
        string memory _safeId
    ) internal depositSafeFundsRequisite(_mainData, _safeId) returns (bool) {
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        Types.Safe memory safe = _mainData.safes[_safeId];
        safe.safeFunds += msg.value;
        _mainData.safes[_safeId] = safe;
        return true;
    }

    function retrieveSafeFunds(
        Types.MainData storage _mainData,
        string memory _safeId
    ) internal retrieveSafeFundsRequisite(_mainData, _safeId) returns (bool) {
        Types.Safe memory safe = _mainData.safes[_safeId];
        uint256 blanceAmount = safe.safeFunds;
        address _to = msg.sender;
        (bool sent, ) = _to.call{value: blanceAmount}("");
        require(sent, "Failed to send Ether");
        safe.safeFunds = 0;
        _mainData.safes[_safeId] = safe;
        return true;
    }
}
