// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IArbitrator.sol";
import "./interfaces/IClaims.sol";
import "./libraries/Safes.sol";
import "./libraries/Types.sol";

// import "./libraries/Guardians.sol";

contract SafientMain {
    Types.MainData private _mainData;

    constructor(IArbitrator _arbitratorAddress, IClaims _claimsAddress) {
        _mainData.arbitratorContract = _arbitratorAddress;
        _mainData.claimsContract = _claimsAddress;
        _mainData.safientMainAdmin = msg.sender;
        _mainData.safesCount = 0;
        _mainData.metaEvidenceID = 0;
    }

    modifier claimCreationRequisite(
        string memory _safeId,
        string calldata _evidence
    ) {
        require(
            bytes(_safeId).length > 1,
            "Should provide ID of the safe on threadDB"
        );
        Types.Safe memory safe = _mainData.safes[_safeId];
        require(safe.safeCurrentOwner != address(0), "Safe does not exist");
        require(
            msg.sender == safe.safeBeneficiary,
            "Only beneficiary of the safe can create the claim"
        );
        require(
            safe.safeFunds >= _mainData.arbitratorContract.arbitrationCost(""),
            "Insufficient funds in the safe to pay the arbitration fee"
        );
        _;
    }

    receive() external payable {}

    function arbitratorContract() public view returns (IArbitrator) {
        return _mainData.arbitratorContract;
    }

    function claimsContract() public view returns (IClaims) {
        return _mainData.claimsContract;
    }

    function safesCount() public view returns (uint256) {
        return _mainData.safesCount;
    }

    function safes(string memory _safeId)
        public
        view
        returns (Types.Safe memory)
    {
        return _mainData.safes[_safeId];
    }

    function claimsCount() public view returns (uint256) {
        return _mainData.claimsContract.claimsCount();
    }

    function claims(uint256 _disputeId)
        public
        view
        returns (Types.Claim memory)
    {
        return _mainData.claimsContract.claims(_disputeId);
    }

    function claimsOnSafe(string memory _safeId)
        public
        view
        returns (uint256[] memory)
    {
        return _mainData.claimsContract.claimsOnSafe(_safeId);
    }

    function getSafientMainContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function createSafe(
        address _beneficiary,
        string memory _safeId,
        string calldata _metaEvidence
    ) external payable returns (bool) {
        return
            Safes.createSafe(_mainData, _beneficiary, _safeId, _metaEvidence);
    }

    function syncSafe(
        address _creator,
        string memory _safeId,
        string calldata _metaEvidence
    ) external payable returns (bool) {
        return Safes.syncSafe(_mainData, _creator, _safeId, _metaEvidence);
    }

    function createClaim(string memory _safeId, string calldata _evidence)
        external
        claimCreationRequisite(_safeId, _evidence)
        returns (uint256)
    {
        // send arbitration fee from SafientMain.sol to Claims.sol
        (bool sent, ) = address(_mainData.claimsContract).call{
            value: _mainData.arbitratorContract.arbitrationCost("")
        }("");
        require(sent, "Failed to send Ether");
        // pass msg.sender as claimedBy since createClaim is called by SafientMain.sol
        address claimedBy = msg.sender;
        Types.Safe storage safe = _mainData.safes[_safeId];
        // createClaim on Claims.sol
        uint256 disputeID = _mainData.claimsContract.createClaim(
            _safeId,
            _evidence,
            safe.metaEvidenceId,
            claimedBy
        );
        safe.claimsCount += 1;
        safe.safeFunds -= _mainData.arbitratorContract.arbitrationCost("");
        return disputeID;
    }

    function depositSafeFunds(string memory _safeId)
        external
        payable
        returns (bool)
    {
        return Safes.depositSafeFunds(_mainData, _safeId);
    }

    function retrieveSafeFunds(string memory _safeId) external returns (bool) {
        return Safes.retrieveSafeFunds(_mainData, _safeId);
    }

    // function guardianProof(
    //     string memory _message,
    //     bytes memory _signature,
    //     Types.RecoveryProof[] memory _guardianproof,
    //     string[] memory _secrets,
    //     string memory _safeId
    // ) public payable returns (bool) {
    //     return
    //         Guardians.guardianProof(
    //             _mainData,
    //             _message,
    //             _signature,
    //             _guardianproof,
    //             _secrets,
    //             _safeId
    //         );
    // }
}
