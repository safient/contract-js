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

    enum ClaimType {
        SignalBased,
        ArbitrationBased
    }

    struct Safe {
        string safeId;
        address createdBy;
        address currentOwner;
        address beneficiary;
        uint256 signalingPeriod;
        uint256 endSignalTime;
        uint256 latestSignalTime;
        ClaimType claimType;
        uint256 metaEvidenceId;
        uint256 claimsCount;
        uint256 funds;
    }

    struct Claim {
        ClaimType claimType;
        uint256 disputeId;
        address claimedBy;
        uint256 metaEvidenceId;
        uint256 evidenceGroupId;
        ClaimStatus status;
    }

    struct RecoveryProof {
        bytes32 secretHash;
        address guardianAddress;
    }

    struct ArbitrationBasedClaimCreationRequisiteData {
        IArbitrator arbitrator;
        uint256 arbitrationCost;
        uint256 metaEvidenceId;
        address currentOwner;
        address beneficiary;
        uint256 funds;
    }
}
