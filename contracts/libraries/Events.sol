// SPDX-License-Identifier: MIT
pragma solidity >=0.7;

import "../interfaces/IArbitrator.sol";

library Events {
    // IArbitrable
    event Ruling(
        IArbitrator indexed _arbitrator,
        uint256 indexed _disputeID,
        uint256 _ruling
    );

    // IEvidence
    event MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence);

    event Evidence(
        IArbitrator indexed _arbitrator,
        uint256 indexed _evidenceGroupID,
        address indexed _party,
        string _evidence
    );

    event Dispute(
        IArbitrator indexed _arbitrator,
        uint256 indexed _disputeID,
        uint256 _metaEvidenceID,
        uint256 _evidenceGroupID
    );

    // Safient
    event CreateSafe(
        address indexed safeCreatedBy,
        address indexed safeInheritor,
        uint256 indexed metaEvidenceId
    );

    event CreateClaim(
        address indexed claimCreatedBy,
        string indexed safeId,
        uint256 indexed disputeId
    );
}
