// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/**
 * @title Utility functions used within the Safient Protocol
 * @notice This library implements functions that are mainly used in
 * Safient Protocol's Guardians contract
 */
library Utils {
    /**
     * @notice Get the hash of a message
     * @param _message The message
     */
    function getMessageHash(string memory _message)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(_message));
    }

    /**
     * @notice Get the ethereum signed message hash
     * @param _messageHash Hash of the message
     */
    function getEthSignedMessageHash(bytes32 _messageHash)
        internal
        pure
        returns (bytes32)
    {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
    */
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    _messageHash
                )
            );
    }
}
