// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../libraries/Types.sol";
import "../libraries/Utils.sol";

/**
 * @title Safient Protocol's Guardians contract
 * @notice This contract implements functions for guardian
 * proofs and guardian incentivization
 */
contract Guardians {
    /** @notice Maps guardian address to their earned rewards */
    mapping(address => uint256) public guardianRewards;

    modifier withdrawRewards(uint256 _funds) {
        require(guardianRewards[msg.sender] != 0, "No rewards remaining");

        require(
            guardianRewards[msg.sender] >= _funds,
            "Funds requested exceeds the total remaining funds"
        );
        _;
    }

    /**
     * @notice Submit the guardian proof
     * @param _message Message generated during the safe creation and also
     * signed by the safe creator
     * @param _signature Signature of the message signed by the creator
     * @param _guardianproof Array of structs which includes guardian
     * address and the secret
     * @param _secrets Array of guardian secrets
     * @param safeCreatedBy Address of the safe creator
     * @param safeFunds Total funds in the safe
     */
    function _guardianProof(
        string memory _message,
        bytes memory _signature,
        Types.RecoveryProof[] memory _guardianproof,
        string[] memory _secrets,
        address safeCreatedBy,
        uint256 safeFunds
    ) internal returns (bool) {
        uint256 noOfGuardians = _secrets.length;
        bytes32 r;
        bytes32 s;
        uint8 v;
        if (_signature.length != 65) {
            return false;
        }
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        if (v < 27) {
            v += 27;
        }
        if (v != 27 && v != 28) {
            return false;
        } else {
            bytes32 _messagehash = Utils.getMessageHash(_message);
            bytes32 _hash = Utils.getEthSignedMessageHash(_messagehash);
            address creator = ecrecover(_hash, v, r, s);
            if (creator == safeCreatedBy && safeFunds != 0) {
                uint256 guardianValue = safeFunds / noOfGuardians;
                for (
                    uint8 guardianIndex = 0;
                    guardianIndex < _guardianproof.length;
                    guardianIndex++
                ) {
                    //Check if the hashes match
                    for (
                        uint8 secretIndex = 0;
                        secretIndex < noOfGuardians;
                        secretIndex++
                    ) {
                        if (
                            _guardianproof[guardianIndex].secretHash ==
                            keccak256(abi.encodePacked(_secrets[secretIndex]))
                        ) {
                            safeFunds -= guardianValue;
                            address guardianAddress = _guardianproof[
                                guardianIndex
                            ].guardianAddress;
                            guardianRewards[guardianAddress] += guardianValue;
                        }
                    }
                }
                return true;
            } else {
                return false;
            }
        }
    }

    /**
     * @notice Claim the guardian rewards
     * @param _funds Total funds need to be claimed
     */
    function _claimRewards(uint256 _funds)
        internal
        withdrawRewards(_funds)
        returns (bool)
    {
        guardianRewards[msg.sender] -= _funds;

        address _to = msg.sender;

        (bool sent, ) = _to.call{value: _funds}("");
        require(sent, "Failed to send Ether");

        return sent;
    }
}
