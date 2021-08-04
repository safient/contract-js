// SPDX-License-Identifier: MIT
pragma solidity >=0.7;

import "./Events.sol";
import "./Types.sol";
import "./Datas.sol";

library Safes {
    modifier safeCreationRequisite(
        Datas.Data storage _data,
        address _inheritor,
        string memory _safeId,
        string calldata _metaEvidence
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
        require(
            msg.value >= _data.arbitrator.arbitrationCost(""),
            "Inadequate fee payment"
        );
        require(
            bytes(_metaEvidence).length > 0,
            "Should provide metaEvidence to create a safe"
        );
        require(
            _inheritor != address(0),
            "Should provide an inheritor for the safe"
        );
        require(
            msg.sender != _inheritor,
            "Safe creator should not be the inheritor of the safe"
        );
        _;
    }

    modifier syncSafeRequisite(
        Datas.Data storage _data,
        address _creator,
        string memory _safeId,
        string calldata _metaEvidence
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
        require(
            msg.value >= _data.arbitrator.arbitrationCost(""),
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
            "Safe should be synced by the inheritor of the safe"
        );
        _;
    }

    modifier depositSafeFundsRequisite(
        Datas.Data storage _data,
        string memory _safeId
    ) {
        Types.Safe memory safe = _data.safes[_safeId];
        require(safe.safeCreatedBy != address(0), "safe does not exist");
        require(safe.safeCurrentOwner != address(0), "safe does not exist");
        require(safe.safeInheritor != address(0), "safe does not exist");
        _;
    }

    modifier recoverSafeFundsRequisite(
        Datas.Data storage _data,
        string memory _safeId
    ) {
        Types.Safe memory safe = _data.safes[_safeId];
        require(safe.safeCreatedBy != address(0), "safe does not exist");
        require(safe.safeCurrentOwner != address(0), "safe does not exist");
        require(safe.safeInheritor != address(0), "safe does not exist");
        require(
            msg.sender == safe.safeCurrentOwner,
            "Only safe owner can recover the deposit balance"
        );
        require(safe.safeFunds != 0, "No funds remaining in the safe");
        _;
    }

    function createSafe(
        Datas.Data storage _data,
        address _inheritor,
        string memory _safeId,
        string calldata _metaEvidence
    )
        internal
        safeCreationRequisite(_data, _inheritor, _safeId, _metaEvidence)
        returns (bool)
    {
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        _data.metaEvidenceID += 1;
        Types.Safe memory safe = _data.safes[_safeId];
        safe = Types.Safe({
            safeId: _safeId,
            safeCreatedBy: msg.sender,
            safeCurrentOwner: msg.sender,
            safeInheritor: _inheritor,
            metaEvidenceId: _data.metaEvidenceID,
            claimsCount: 0,
            safeFunds: msg.value
        });
        _data.safes[_safeId] = safe;
        _data.safesCount += 1;
        emit Events.MetaEvidence(_data.metaEvidenceID, _metaEvidence);
        emit Events.CreateSafe(msg.sender, _inheritor, _data.metaEvidenceID);
        return true;
    }

    function syncSafe(
        Datas.Data storage _data,
        address _creator,
        string memory _safeId,
        string calldata _metaEvidence
    )
        internal
        syncSafeRequisite(_data, _creator, _safeId, _metaEvidence)
        returns (bool)
    {
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        _data.metaEvidenceID += 1;
        Types.Safe memory safe = _data.safes[_safeId];
        safe = Types.Safe({
            safeId: _safeId,
            safeCreatedBy: _creator,
            safeCurrentOwner: _creator,
            safeInheritor: msg.sender,
            metaEvidenceId: _data.metaEvidenceID,
            claimsCount: 0,
            safeFunds: msg.value
        });
        _data.safes[_safeId] = safe;
        _data.safesCount += 1;
        emit Events.MetaEvidence(_data.metaEvidenceID, _metaEvidence);
        emit Events.CreateSafe(_creator, msg.sender, _data.metaEvidenceID);
        return true;
    }

    function depositSafeFunds(Datas.Data storage _data, string memory _safeId)
        internal
        depositSafeFundsRequisite(_data, _safeId)
        returns (bool)
    {
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");
        Types.Safe memory safe = _data.safes[_safeId];
        safe.safeFunds += msg.value;
        _data.safes[_safeId] = safe;
        return true;
    }

    function recoverSafeFunds(Datas.Data storage _data, string memory _safeId)
        internal
        recoverSafeFundsRequisite(_data, _safeId)
        returns (bool)
    {
        Types.Safe memory safe = _data.safes[_safeId];
        uint256 blanceAmount = safe.safeFunds;
        safe.safeFunds = 0;
        _data.safes[_safeId] = safe;
        address _to = msg.sender;
        (bool sent, ) = _to.call{value: blanceAmount}("");
        require(sent, "Failed to send Ether");
        return true;
    }
}
