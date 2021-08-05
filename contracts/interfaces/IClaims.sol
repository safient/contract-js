// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;
pragma experimental ABIEncoderV2;

import "../libraries/Types.sol";

interface IClaims {
    function claimsCount() external view returns (uint256);

    function claims(uint256 _disputeId)
        external
        view
        returns (Types.Claim memory);

    function claimsOnSafe(string memory _safeId)
        external
        view
        returns (uint256[] memory);

    function createClaim(
        string memory _safeId,
        string calldata _evidence,
        uint256 _metaEvidenceId,
        address _claimedBy
    ) external returns (uint256);
}
