export const safientMainABI = [
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
        internalType: 'string',
        name: 'safeId',
        type: 'string',
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
        internalType: 'string',
        name: 'safeId',
        type: 'string',
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
        internalType: 'enum SafientMain.ClaimStatus',
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
        internalType: 'string',
        name: '_safeId',
        type: 'string',
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
        name: '_safeId',
        type: 'string',
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
        internalType: 'string',
        name: '_safeId',
        type: 'string',
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
    inputs: [
      {
        internalType: 'bytes32',
        name: '_messageHash',
        type: 'bytes32',
      },
    ],
    name: 'getEthSignedMessageHash',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_message',
        type: 'string',
      },
    ],
    name: 'getMessageHash',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_claimId',
        type: 'uint256',
      },
    ],
    name: 'getSafeStage',
    outputs: [
      {
        internalType: 'enum SafientMain.ClaimStatus',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getSafientMainContractBalance',
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
    inputs: [
      {
        internalType: 'string',
        name: '_message',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: '_signature',
        type: 'bytes',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'secretHash',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'guardianAddress',
            type: 'address',
          },
        ],
        internalType: 'struct SafientMain.RecoveryProof[]',
        name: '_guardianproof',
        type: 'tuple[]',
      },
      {
        internalType: 'string[]',
        name: '_secrets',
        type: 'string[]',
      },
      {
        internalType: 'string',
        name: '_safeId',
        type: 'string',
      },
    ],
    name: 'guardianProof',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'payable',
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
        internalType: 'string',
        name: '_safeId',
        type: 'string',
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
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    name: 'safes',
    outputs: [
      {
        internalType: 'string',
        name: 'safeId',
        type: 'string',
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
