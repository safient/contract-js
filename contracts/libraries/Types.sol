// SPDX-License-Identifier: MIT
pragma solidity >=0.7;

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
        address safeInheritor;
        uint256 metaEvidenceId;
        uint256 claimsCount;
        uint256 safeFunds;
    }

    struct Claim {
        string safeId;
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
}
