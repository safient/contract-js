import { JsonRpcSigner, TransactionResponse } from '@ethersproject/providers';
import { ContractInterface } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { Client, ThreadID } from '@textile/hub';
import { JWE } from 'did-jwt';

export type Safe = {
  safeId: BigNumber;
  safeCreatedBy: string;
  safeCurrentOwner: string;
  safeInheritor: string;
  metaEvidenceId: BigNumber;
  claimsCount: BigNumber;
  safeFunds: BigNumber;
};

export type Claim = {
  safeId: string;
  disputeId: BigNumber;
  claimedBy: string;
  metaEvidenceId: BigNumber;
  evidenceGroupId: BigNumber;
  status: number;
  result: string;
};

export type Tx = TransactionResponse;
export type ContractAddress = string;
export type ContractABI = ContractInterface | object[];
export type Signer = JsonRpcSigner;

export type RecoveryProof = {
  secretHash: string;
  guardianAddress: string;
};

// ThreadDB Types

export type Connection = {
  client: Client;
  threadId: ThreadID;
};

export type Shard = {
  status: number;
  encShard: JWE;
  decData: null | Record<string, any>;
};

export type ThreadClaim = {
  createdBy: string;
  claimStatus: number;
  disputeID: number;
};

export type SafeData = {
  creator: string;
  guardians: string[];
  recipient: string;
  encSafeKey: Object;
  encSafeData: Object;
  stage: number;
  encSafeKeyShards: Shard[];
  claims: ThreadClaim[];
};
