// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

import "../interfaces/IArbitrator.sol";

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

    struct claimCreationRequisiteData {
        IArbitrator arbitrator;
        uint256 arbitrationCost;
        uint256 metaEvidenceId;
        address safeCurrentOwner;
        address safeBeneficiary;
        uint256 safeFunds;
    }
}
