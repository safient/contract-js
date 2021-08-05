// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

import "../interfaces/IArbitrator.sol";
import "../interfaces/IClaims.sol";

library Types {
    enum ClaimStatus {
        Active,
        Passed,
        Failed,
        Refused
    }

    struct Safe {
        string safeId;
        address safeCreatedBy;
        address safeCurrentOwner;
        address safeBeneficiary;
        uint256 metaEvidenceId;
        uint256 claimsCount;
        uint256 safeFunds;
    }

    struct Claim {
        uint256 disputeId;
        address claimedBy;
        uint256 metaEvidenceId;
        uint256 evidenceGroupId;
        ClaimStatus status;
        string result;
    }

    struct RecoveryProof {
        bytes32 secretHash;
        address guardianAddress;
    }

    struct MainData {
        IArbitrator arbitratorContract;
        IClaims claimsContract;
        address safientMainAdmin;
        uint256 safesCount;
        uint256 metaEvidenceID;
        mapping(string => Types.Safe) safes;
    }

    struct ClaimsData {
        IArbitrator arbitratorContract;
        uint256 rulingOptions;
        uint256 evidenceGroupID;
        uint256 claimsCount;
        mapping(uint256 => Types.Claim) claims;
        mapping(string => uint256[]) claimsOnSafe;
    }
}
