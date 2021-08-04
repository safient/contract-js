// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IArbitrator.sol";
import "./libraries/Guardians.sol";
import "./libraries/Claims.sol";
import "./libraries/Datas.sol";
import "./libraries/Safes.sol";
import "./libraries/Types.sol";

contract SafientMain {
    Datas.Data private _data;

    constructor(IArbitrator _arbitrator) {
        _data.arbitrator = _arbitrator;
        _data.safientMainAdmin = msg.sender;
        _data.rulingOptions = 2;
        _data.safesCount = 0;
        _data.claimsCount = 0;
        _data.metaEvidenceID = 0;
        _data.evidenceGroupID = 0;
    }

    receive() external payable {}

    function arbitrator() public view returns (IArbitrator) {
        return _data.arbitrator;
    }

    function safesCount() public view returns (uint256) {
        return _data.safesCount;
    }

    function claimsCount() public view returns (uint256) {
        return _data.claimsCount;
    }

    function safes(string memory _safeId)
        public
        view
        returns (Types.Safe memory)
    {
        return _data.safes[_safeId];
    }

    function claims(uint256 _claimId) public view returns (Types.Claim memory) {
        return _data.claims[_claimId];
    }

    function getSafientMainContractBalance()
        public
        view
        returns (uint256 balance)
    {
        return address(this).balance;
    }

    function createSafe(
        address _inheritor,
        string memory _safeId,
        string calldata _metaEvidence
    ) external payable returns (bool) {
        return Safes.createSafe(_data, _inheritor, _safeId, _metaEvidence);
    }

    function syncSafe(
        address _creator,
        string memory _safeId,
        string calldata _metaEvidence
    ) external payable returns (bool) {
        return Safes.syncSafe(_data, _creator, _safeId, _metaEvidence);
    }

    function createClaim(string memory _safeId, string calldata _evidence)
        external
        returns (bool)
    {
        return Claims.createClaim(_data, _safeId, _evidence);
    }

    function rule(uint256 _disputeID, uint256 _ruling) external returns (bool) {
        return Claims.rule(_data, _disputeID, _ruling);
    }

    function depositSafeFunds(string memory _safeId)
        external
        payable
        returns (bool)
    {
        return Safes.depositSafeFunds(_data, _safeId);
    }

    function recoverSafeFunds(string memory _safeId) external returns (bool) {
        return Safes.recoverSafeFunds(_data, _safeId);
    }

    function submitEvidence(uint256 _disputeID, string calldata _evidence)
        public
        returns (bool)
    {
        return Claims.submitEvidence(_data, _disputeID, _evidence);
    }

    function guardianProof(
        string memory _message,
        bytes memory _signature,
        Types.RecoveryProof[] memory _guardianproof,
        string[] memory _secrets,
        string memory _safeId
    ) public payable returns (bool) {
        return
            Guardians.guardianProof(
                _data,
                _message,
                _signature,
                _guardianproof,
                _secrets,
                _safeId
            );
    }
}
