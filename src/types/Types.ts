import { JsonRpcSigner, TransactionResponse } from '@ethersproject/providers';
import { ContractInterface } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';

export type Safe = {
  safeId: string;
  safeCreatedBy: string;
  safeCurrentOwner: string;
  safeBeneficiary: string;
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

export type ContractAddress = string;
export type ContractABI = ContractInterface | object[];
export type Signer = JsonRpcSigner;

export type RecoveryProof = {
  secret: string;
  address: string;
};

export enum ClaimType {
  SignalBased,
  ArbitrationBased
}
