// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/IArbitrator.sol";
import "../libraries/Types.sol";

/**
 * @title Safient Protocol's Safes contract
 * @notice This contract implements functions for creating and interacting
 * with the safient safes
 */
contract Safes {
    /** @notice Total number of safes created */
    uint256 public safesCount;

    /**
     * @notice Total number of metaevidence's created
     * @dev metaEvidenceID is incremented when a new safe is created irrespective
     * of it's claimType
     */
    uint256 public metaEvidenceID;

    /** @notice Maps each safe with it's id */
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

        require(!safe.deprecated, "Safe has been deprecated");
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

        require(!safe.deprecated, "Safe has been deprecated");

        require(safe.funds != 0, "No funds remaining in the safe");
        _;
    }

    modifier SafeOwner(string memory _safeId) {
        Types.Safe memory safe = safes[_safeId];
        require(
            msg.sender == safe.currentOwner,
            "Only safe current owner can send the signal"
        );
        require(!safe.deprecated, "Safe has been deprecated");
        _;
    }

    event MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence);

    event CreateSafe(
        address indexed createdBy,
        address indexed beneficiary,
        uint256 indexed metaEvidenceId
    );

    /**
     * @notice Create a new safe by the safe creator
     * @param _beneficiary Address of the safe beneficiary
     * @param _safeId Id of the safe
     * @param _claimType Type of the claim
     * @param _claimPeriod Value of claim is uint256 it can be signaling period or dday or eday
     * @param _metaEvidence URL of the metaevidence
     */
    function _createSafe(
        address _beneficiary,
        string memory _safeId,
        Types.ClaimType _claimType,
        uint256 _claimPeriod,
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
            claimPeriod: _claimPeriod,
            claimType: _claimType,
            claimTimeStamp: 0,
            metaEvidenceId: metaEvidenceID,
            claimsCount: 0,
            funds: msg.value,
            deprecated: false
        });

        safesCount += 1;

        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        emit CreateSafe(msg.sender, _beneficiary, metaEvidenceID);

        return sent;
    }

    /**
     * @notice Create a new safe by the safe beneficiary
     * @param _creator Address of the safe creator
     * @param _safeId Id of the safe
     * @param _claimType Type of the claim
     * @param _claimPeriod Value of claim is uint256 it can be signaling period or dday or eday
     * @param _metaEvidence URL of the metaevidence
     */
    function _syncSafe(
        address _creator,
        string memory _safeId,
        Types.ClaimType _claimType,
        uint256 _claimPeriod,
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
            claimPeriod: _claimPeriod,
            claimType: _claimType,
            claimTimeStamp: 0,
            metaEvidenceId: metaEvidenceID,
            claimsCount: 0,
            funds: msg.value,
            deprecated: false
        });

        safesCount += 1;

        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        emit CreateSafe(_creator, msg.sender, metaEvidenceID);

        return sent;
    }

    /**
     * @notice Deposit funds into a safe
     * @param _safeId Id of the safe
     */
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

        return sent;
    }

    /**
     * @notice Withdraw funds from the safe
     * @param _safeId Id of the safe
     */
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

        return sent;
    }

    function updateClaimType(
        string calldata _safeId,
        Types.ClaimType _claimType,
        uint256 _claimPeriod,
        string calldata _metaEvidence
    ) internal returns (bool) {
        Types.Safe memory safe = safes[_safeId];
        if (_claimType == Types.ClaimType.ArbitrationBased) {
            metaEvidenceID += 1;
            emit MetaEvidence(metaEvidenceID, _metaEvidence);
        }
        safe.claimType = _claimType;
        safe.claimPeriod = _claimPeriod;
        safe.metaEvidenceId = metaEvidenceID;
        safes[_safeId] = safe;
        return true;
    }

    function _updateSafe(
        string calldata _safeId,
         Types.ClaimAction _claimAction,
        Types.ClaimType _claimType,
        uint256 _claimPeriod,
        string calldata _metaEvidence
    ) internal SafeOwner(_safeId) returns (bool status) {
        Types.Safe memory safe = safes[_safeId];
        if (_claimAction == Types.ClaimAction.Deprecated) {
            safe.deprecated = true;
            safes[_safeId] = safe;
            return true;
        } else if (_claimAction == Types.ClaimAction.Signal) {
            require(
                safe.claimTimeStamp != 0,
                "Safe is not claimed since safes endSignalTime is zero"
            );
            require(
                block.timestamp < safe.claimTimeStamp,
                "Signaling period is over"
            );
            safe.claimTimeStamp = 0;
            safes[_safeId] = safe;
            return true;
        } else if (_claimAction == Types.ClaimAction.Dday) {
            require(
                block.timestamp < safe.claimPeriod,
                "DDay has already passed"
            );
            safe.claimPeriod = _claimPeriod;
            safes[_safeId] = safe;
            return true;
        } else if (_claimAction == Types.ClaimAction.Eday) {
            require(block.timestamp < safe.claimPeriod, "EDay has expired");
            safe.claimPeriod = _claimPeriod;
            safes[_safeId] = safe;
            return true;
        } else if (_claimAction == Types.ClaimAction.Update) {
            if (safe.claimType == Types.ClaimType.SignalBased) {
                require(
                    safe.claimTimeStamp != 0,
                    "Safe is not claimed since safes endSignalTime is zero"
                );
                require(
                    block.timestamp < safe.claimTimeStamp,
                    "Signaling period is over"
                );
            }
            if (safe.claimType == Types.ClaimType.DDayBased) {
                require(
                    block.timestamp < safe.claimPeriod,
                    "DDay has already passed"
                );
            }
            if (safe.claimType == Types.ClaimType.Expirion) {
                require(block.timestamp < safe.claimPeriod, "EDay has expired");
            }
            return
                updateClaimType(
                    _safeId,
                    _claimType,
                    _claimPeriod,
                    _metaEvidence
                );
        }
    }
}
