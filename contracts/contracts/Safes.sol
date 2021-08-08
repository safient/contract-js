// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "../interfaces/IArbitrator.sol";
import "../libraries/Types.sol";
import "../libraries/Events.sol";

contract Safes {
    uint256 public safesCount;
    uint256 public metaEvidenceID;
    mapping(string => Types.Safe) public safes;

    constructor() {
        safesCount = 0;
        metaEvidenceID = 0;
    }

    modifier safeCreationRequisite(
        string memory _safeId,
        string calldata _metaEvidence,
        IArbitrator arbitrator
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
        require(
            msg.value >= arbitrator.arbitrationCost(""),
            "Inadequate fee payment"
        );
        require(
            bytes(_metaEvidence).length > 0,
            "Should provide metaEvidence to create a safe"
        );
        _;
    }

    modifier safeCreationByCreatorRequisite(address _beneficiary) {
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

    modifier safeCreationByBeneficiaryRequisite(address _creator) {
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
        string calldata _metaEvidence,
        IArbitrator arbitrator
    )
        internal
        safeCreationRequisite(_safeId, _metaEvidence, arbitrator)
        safeCreationByCreatorRequisite(_beneficiary)
        returns (bool)
    {
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        metaEvidenceID += 1;

        Types.Safe memory safe = safes[_safeId];
        safe = Types.Safe({
            safeId: _safeId,
            safeCreatedBy: msg.sender,
            safeCurrentOwner: msg.sender,
            safeBeneficiary: _beneficiary,
            metaEvidenceId: metaEvidenceID,
            claimsCount: 0,
            safeFunds: msg.value
        });
        safes[_safeId] = safe;

        safesCount += 1;

        emit Events.MetaEvidence(metaEvidenceID, _metaEvidence);
        emit Events.CreateSafe(msg.sender, _beneficiary, metaEvidenceID);

        return true;
    }

    function _createSafeByBeneficiary(
        address _creator,
        string memory _safeId,
        string calldata _metaEvidence,
        IArbitrator arbitrator
    )
        internal
        safeCreationRequisite(_safeId, _metaEvidence, arbitrator)
        safeCreationByBeneficiaryRequisite(_creator)
        returns (bool)
    {
        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        metaEvidenceID += 1;

        Types.Safe memory safe = safes[_safeId];
        safe = Types.Safe({
            safeId: _safeId,
            safeCreatedBy: _creator,
            safeCurrentOwner: _creator,
            safeBeneficiary: msg.sender,
            metaEvidenceId: metaEvidenceID,
            claimsCount: 0,
            safeFunds: msg.value
        });
        safes[_safeId] = safe;

        safesCount += 1;

        emit Events.MetaEvidence(metaEvidenceID, _metaEvidence);
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
}
