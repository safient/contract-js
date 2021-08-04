// SPDX-License-Identifier: MIT
pragma solidity >=0.7;

import "../interfaces/IArbitrator.sol";
import "./Types.sol";

library Datas {
    struct Data {
        IArbitrator arbitrator;
        address safientMainAdmin;
        uint256 rulingOptions;
        uint256 safesCount;
        uint256 claimsCount;
        uint256 metaEvidenceID;
        uint256 evidenceGroupID;
        mapping(string => Types.Safe) safes;
        mapping(uint256 => Types.Claim) claims;
    }
}
