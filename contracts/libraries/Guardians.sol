// SPDX-License-Identifier: MIT
pragma solidity >=0.7;

import "./Types.sol";
import "./Datas.sol";
import "./Utils.sol";

library Guardians {
    function guardianProof(
        Datas.Data storage _data,
        string memory _message,
        bytes memory _signature,
        Types.RecoveryProof[] memory _guardianproof,
        string[] memory _secrets,
        string memory _safeId
    ) internal returns (bool) {
        Types.Safe memory safe = _data.safes[_safeId];
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
            if (creator == safe.safeCreatedBy && safe.safeFunds != 0) {
                uint256 guardianValue = safe.safeFunds / noOfGuardians;
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
                            safe.safeFunds -= guardianValue;
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
