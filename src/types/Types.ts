import { JsonRpcSigner } from '@ethersproject/providers';
import { ContractInterface } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { Wallet } from '@ethersproject/wallet';

export type Safe = {
  id: string;
  createdBy: string;
  currentOwner: string;
  beneficiary: string;
  claimPeriod: BigNumber;
  claimTimeStamp: BigNumber;
  claimType: ClaimType;
  metaEvidenceId: BigNumber;
  claimsCount: BigNumber;
  funds: BigNumber;
};

export type Claim = {
  id: BigNumber;
  claimedBy: string;
  claimType: ClaimType;
  metaEvidenceId: BigNumber;
  evidenceGroupId: BigNumber;
  status: ClaimStatus;
};

/** @ignore */
export type ContractAddress = string;

/** @ignore */
export type ContractABI = ContractInterface | object[];

/** @ignore */
export type Signer = Wallet | JsonRpcSigner;

export type RecoveryProof = {
  secretHash: string;
  guardianAddress: string;
};

export enum ClaimStatus {
  Active,
  Passed,
  Failed,
  Refused,
}

export enum ClaimType {
  SignalBased,
  ArbitrationBased,
  DDayBased,
  Expirion
}

export enum ClaimAction {
  Update,
  Signal,
  Dday,
  Eday,
  Deprecated
}