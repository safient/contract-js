import { JsonRpcProvider, Web3Provider, JsonRpcSigner, TransactionResponse } from '@ethersproject/providers';
import { ContractInterface } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';

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
  safeId: BigNumber;
  disputeId: BigNumber;
  claimedBy: string;
  metaEvidenceId: BigNumber;
  evidenceGroupId: BigNumber;
  status: number;
  result: string;
};

export type Tx = TransactionResponse;

export type Provider = JsonRpcProvider | Web3Provider;

export type ContractAddress = string;

export type ContractABI = ContractInterface | object[];

export type ProviderOrUrl = string | Web3Provider;

export type Signer = JsonRpcSigner;
