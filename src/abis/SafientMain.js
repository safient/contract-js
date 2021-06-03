module.exports = [
  {
    inputs: [
      {
        internalType: 'contract IArbitrator',
        name: '_arbitrator',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'claimCreatedBy',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'safeId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'disputeId',
        type: 'uint256',
      },
    ],
    name: 'CreateClaim',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'safeCreatedBy',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'safeInheritor',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'metaEvidenceId',
        type: 'uint256',
      },
    ],
    name: 'CreateSafe',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'contract IArbitrator',
        name: '_arbitrator',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_disputeID',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_metaEvidenceID',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_evidenceGroupID',
        type: 'uint256',
      },
    ],
    name: 'Dispute',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'contract IArbitrator',
        name: '_arbitrator',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_evidenceGroupID',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_party',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_evidence',
        type: 'string',
      },
    ],
    name: 'Evidence',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_metaEvidenceID',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_evidence',
        type: 'string',
      },
    ],
    name: 'MetaEvidence',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'contract IArbitrator',
        name: '_arbitrator',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_disputeID',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_ruling',
        type: 'uint256',
      },
    ],
    name: 'Ruling',
    type: 'event',
  },
  {
    inputs: [],
    name: 'arbitrator',
    outputs: [
      {
        internalType: 'contract IArbitrator',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'claims',
    outputs: [
      {
        internalType: 'uint256',
        name: 'safeId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'disputeId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'claimedBy',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'metaEvidenceId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'evidenceGroupId',
        type: 'uint256',
      },
      {
        internalType: 'enum SafexMain.ClaimStatus',
        name: 'status',
        type: 'uint8',
      },
      {
        internalType: 'string',
        name: 'result',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimsCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_safeId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: '_evidence',
        type: 'string',
      },
    ],
    name: 'createClaim',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_inheritor',
        type: 'address',
      },
      {
        internalType: 'string',
        name: '_metaEvidence',
        type: 'string',
      },
    ],
    name: 'createSafe',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_safeId',
        type: 'uint256',
      },
    ],
    name: 'depositSafeFunds',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'evidenceGroupID',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getSafexMainContractBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: 'balance',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalClaimsAllowed',
    outputs: [
      {
        internalType: 'uint256',
        name: 'totalClaimsAllowed',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'metaEvidenceID',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_safeId',
        type: 'uint256',
      },
    ],
    name: 'recoverSafeFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_disputeID',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_ruling',
        type: 'uint256',
      },
    ],
    name: 'rule',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'safes',
    outputs: [
      {
        internalType: 'uint256',
        name: 'safeId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'safeCreatedBy',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'safeCurrentOwner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'safeInheritor',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'metaEvidenceId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'claimsCount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'safeFunds',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'safesCount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'safexMainAdmin',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_claimsAllowed',
        type: 'uint256',
      },
    ],
    name: 'setTotalClaimsAllowed',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_disputeID',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: '_evidence',
        type: 'string',
      },
    ],
    name: 'submitEvidence',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
];
