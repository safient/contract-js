import { ContractABI, ContractAddress, Claim, ClaimType, RecoveryProof, Safe, Signer } from '../types/Types';
import { TransactionResponse } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { Logger } from '@ethersproject/logger';
import { Bytes } from 'ethers';
import networks from '../utils/networks.json';
import data from '../abis/SafientMain.json';

/**
 * This class implements an interface for the safient protocol's contract interaction allowing
 * users to create and interact with the safes and the claims
 */
export class SafientMain {
  /** @ignore */
  private signer: Signer;

  /** @ignore */
  private safientMainABI: ContractABI;

  /** @ignore */
  private safientMainAddress: ContractAddress;

  /** @ignore */
  private logger: Logger;

  /** @ignore */
  private tx: TransactionResponse;

  /**
   * Arbitrator Constructor
   * @param signer Signer object
   * @param chainId Provider chainId
   */
  constructor(signer: Signer, chainId: number) {
    this.logger = Logger.globalLogger();
    this.signer = signer;
    this.safientMainABI = data.abi;

    const network = Object.values(networks).find((network) => chainId === network.chainId);

    network !== undefined && network.addresses.SafientMain !== ''
      ? (this.safientMainAddress = network.addresses.SafientMain)
      : this.logger.throwError(`SafientMain contract not deployed on network with chain id: ${chainId}`);
  }

  /**
   * This function returns the SafientMain contract instance associated with the signer
   * @ignore
   * @returns The SafientMain contract instance associated with the signer
   */
  private getContractInstance = async (): Promise<Contract> => {
    try {
      const contractInstance = new Contract(this.safientMainAddress, this.safientMainABI, this.signer);
      return contractInstance;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function creates a new safe by the safe creator
   * @param beneficiaryAddress Address of the beneficiary who can claim to inherit this safe
   * @param safeId Id of the safe
   * @param claimType Type of claim the inheritor has go through
   * @param signalingPeriod Number of days within which the safe creator is willing to send a signal
   * @param metaevidenceURI IPFS URI pointing to the metaevidence related to general agreement, arbitration details, actors involved etc
   * @param value Safe maintanence fee in Gwei, minimum arbitration fee required
   * @returns A transaction response
   */
  createSafe = async (
    beneficiaryAddress: string,
    safeId: string,
    claimType: ClaimType,
    signalingPeriod: number,
    metaevidenceURI: string,
    value: string
  ): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.createSafe(beneficiaryAddress, safeId, claimType, signalingPeriod, metaevidenceURI, {
        value,
      });
      return this.tx;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function creates a new safe by the safe beneficiary
   * @param creatorAddress Address of the creator who created the safe offchain
   * @param safeId Id of the safe
   * @param claimType Type of claim the inheritor has go through
   * @param signalingPeriod Number of days within which the safe creator is willing to send a signal
   * @param metaevidenceURI IPFS URI pointing to the metaevidence related to general agreement, arbitration details, actors involved etc
   * @param value Safe maintanence fee in Gwei, minimum arbitration fee required
   * @returns A transaction response
   */
  syncSafe = async (
    creatorAddress: string,
    safeId: string,
    claimType: ClaimType,
    signalingPeriod: number,
    metaevidenceURI: string,
    value: string
  ): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.syncSafe(creatorAddress, safeId, claimType, signalingPeriod, metaevidenceURI, {
        value,
      });
      return this.tx;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function creates a claim on a safe
   * @param safeId Id of the safe
   * @param evidenceURI IPFS URI pointing to the evidence submitted by the claim creator
   * @returns A transaction response
   */
  createClaim = async (safeId: string, evidenceURI: string): Promise<TransactionResponse> => {
    try {
      const contract: Contract = await this.getContractInstance();
      this.tx = await contract.createClaim(safeId, evidenceURI);
      return this.tx;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function deposits funds into a safe
   * @param safeId Id of the safe
   * @param value Funds in Gwei
   * @returns A transaction response
   */
  depositFunds = async (safeId: string, value: string): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.depositFunds(safeId, { value });
      return this.tx;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function withdraws funds from a safe, only safe's current owner can execute this
   * @param safeId Id of the safe
   * @returns A transaction response
   */
  withdrawFunds = async (safeId: string): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.withdrawFunds(safeId);
      return this.tx;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function submits the evidence supporting a claim, only claim creator can execute this
   * @param disputeId Id of the dispute representing the claim
   * @param evidenceURI IPFS URI pointing to the evidence submitted by the claim creator
   * @returns A transaction response
   */
  submitEvidence = async (disputeId: number, evidenceURI: string): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.submitEvidence(disputeId, evidenceURI);
      return this.tx;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function signals a safe in response to the claim made on that safe
   * @param safeId Id of the safe
   * @returns A transaction response
   */
  sendSignal = async (safeId: string): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.sendSignal(safeId);
      return this.tx;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function returns the status (0 - Active, 1 - Passed, 2 - Failed or 3 - Refused To Arbitrate) of a claim by it's id
   * @param safeId Id of the safe
   * @param claimId Id of the claim
   * @returns The status of the claim
   */
  getClaimStatus = async (safeId: string, claimId: number): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const claimStatus: number = await contract.getClaimStatus(safeId, claimId);
      return claimStatus;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function returns a safe by it's id
   * @param safeId Id of the safe
   * @returns The Safe object containing safe data
   */
  getSafeBySafeId = async (safeId: string): Promise<Safe> => {
    try {
      const contract = await this.getContractInstance();
      const safe: Safe = await contract.safes(safeId);
      return safe;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function returns a claim by it's id
   * @param claimId Id of the claim
   * @returns The Claim object containing claim data
   */
  getClaimByClaimId = async (claimId: number): Promise<Claim> => {
    try {
      const contract = await this.getContractInstance();
      const claim: Claim = await contract.claims(claimId);
      return claim;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function returns the total number of safes created on the SafientMain contract
   * @returns The total number of safes created on the SafientMain contract
   */
  getTotalNumberOfSafes = async (): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const totalSafes: BigNumber = await contract.safesCount();
      return Number(totalSafes);
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function returns the total number of claims created on the SafientMain contract
   * @returns The total number of claims created on the SafientMain contract
   */
  getTotalNumberOfClaims = async (): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const totalClaims: BigNumber = await contract.claimsCount();
      return Number(totalClaims);
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function returns the balance of the SafientMain contract
   * @returns The balance of SafientMain contract in ETH
   */
  getContractBalance = async (): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const mainContractBalance: BigNumber = await contract.getBalance();
      return Number(formatEther(mainContractBalance));
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function submits the guardian proof
   * @param message Message generated during safe creation, also signed by the safe creator
   * @param signature Signature of the message signed by the creator
   * @param guardianProof Object containing guardian address and his secret
   * @param secrets Array of all the secrets of all the guardians, for cross verification
   * @param safeId Id of the safe
   * @returns If the guardian proof was true or false
   */
  guardianProof = async (
    message: string,
    signature: Bytes,
    guardianProof: RecoveryProof[],
    secrets: string[],
    safeId: string
  ): Promise<boolean> => {
    try {
      const contract = await this.getContractInstance();
      const result: boolean = await contract.guardianProof(message, signature, guardianProof, secrets, safeId);
      return result;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };
}
