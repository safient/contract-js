// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "../libraries/Types.sol";
import "../libraries/Utils.sol";

contract Guardians {
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
                            _guardianproof[guardianIndex].guardianAddress.call{
                                value: guardianValue
                            }("");
                        }
                    }
                }
                return true;
            } else {
                return false;
            }
        }
    }
}
