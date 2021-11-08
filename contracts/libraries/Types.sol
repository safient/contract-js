// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/IArbitrator.sol";

/**
 * @title A collection of defined structs and enums
 * @notice This library defines the various data models that the Safient
 * Protocol uses
 */
library Types {
    enum ClaimStatus {
        Active,
        Passed,
        Failed,
        Refused
    }

    enum ClaimType {
        SignalBased,
        ArbitrationBased,
        DDayBased
    }

    struct Safe {
        string id;
        address createdBy;
        address currentOwner;
        address beneficiary;
        uint256 signalingPeriod;
        uint256 endSignalTime;
        uint256 latestSignalTime;
        uint256 dDay;
        ClaimType claimType;
        uint256 metaEvidenceId;
        uint256 claimsCount;
        uint256 funds;
    }

    struct Claim {
        uint256 id;
        address claimedBy;
        ClaimType claimType;
        uint256 metaEvidenceId;
        uint256 evidenceGroupId;
        ClaimStatus status;
    }

    struct RecoveryProof {
        bytes32 secretHash;
        address guardianAddress;
    }

    struct SignalBasedClaimData {
        string id;
        address currentOwner;
        address beneficiary;
        uint256 endSignalTime;
    }

    struct ArbitrationBasedClaimData {
        IArbitrator arbitrator;
        uint256 arbitrationCost;
        address currentOwner;
        address beneficiary;
        uint256 metaEvidenceId;
        uint256 funds;
    }

    struct DDayBasedClaimData {
        address currentOwner;
        address beneficiary;
        uint256 dDay;
    }
}
