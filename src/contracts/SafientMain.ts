import { Safe, Claim, ContractAddress, ContractABI, Signer, RecoveryProof, ClaimType } from '../types/Types';
import { TransactionResponse } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { Logger } from '@ethersproject/logger';
import { Bytes } from 'ethers';
import networks from '../utils/networks.json';
import data from '../artifacts/SafientMain.json';
export class SafientMain {
  private signer: Signer;
  private safientMainABI: ContractABI;
  private safientMainAddress: ContractAddress;
  private logger: Logger;
  private tx: TransactionResponse;

  /**
   * Arbitrator Constructor
   * @param signer - Signer object
   * @param chainId - Provider chainId
   */
  constructor(signer: Signer, chainId: number) {
    this.logger = Logger.globalLogger();
    this.signer = signer;
    this.safientMainABI = data.abi;

    const network = Object.values(networks).find((network) => chainId === network.chainId);

    network !== undefined && network.addresses.safientMain !== ''
      ? (this.safientMainAddress = data.address)
      : this.logger.throwError(`SafientMain contract not deployed on network with chain id: ${chainId}`);
  }

  /**
   * Get the SafientMain contract instance
   * @returns The SafientMain contract instance associated with the signer
   */
  private getContractInstance = async (): Promise<Contract> => {
    try {
      const contractInstance = new Contract(this.safientMainAddress, this.safientMainABI, this.signer);
      return contractInstance;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Create a safient safe
   * @param beneficiaryAddress - Address of the beneficiary who can claim to inherit this safe
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @param claimType - Type of claim the inheritor has go through
   * @param signalingPeriod - Number of days within which the safe creator is willing to send a signal
   * @param metaevidenceURI - IPFS URI pointing to the metaevidence related to general agreement, arbitration details, actors involved etc
   * @param value - Safe maintanence fee in Gwei, minimum arbitration fee required
   * @returns A transaction response
   */
  createSafe = async (
    beneficiaryAddress: string,
    safeIdOnThreadDB: string,
    claimType: ClaimType,
    signalingPeriod: number,
    metaevidenceURI: string,
    value: string
  ): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.createSafe(
        beneficiaryAddress,
        safeIdOnThreadDB,
        claimType,
        signalingPeriod,
        metaevidenceURI,
        { value }
      );
      return this.tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Sync safe
   * @param creatorAddress - Address of the creator who created the safe offchain
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @param claimType - Type of claim the inheritor has go through
   * @param signalingPeriod - Number of days within which the safe creator is willing to send a signal
   * @param metaevidenceURI - IPFS URI pointing to the metaevidence related to general agreement, arbitration details, actors involved etc
   * @param value - Safe maintanence fee in Gwei, minimum arbitration fee required
   * @returns A transaction response
   */
  syncSafe = async (
    creatorAddress: string,
    safeIdOnThreadDB: string,
    claimType: ClaimType,
    signalingPeriod: number,
    metaevidenceURI: string,
    value: string
  ): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.syncSafe(creatorAddress, safeIdOnThreadDB, claimType, signalingPeriod, metaevidenceURI, {
        value,
      });
      return this.tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Create a claim on a safe
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @param evidenceURI - IPFS URI pointing to the evidence submitted by the claim creator
   * @returns A transaction response
   */
  createClaim = async (safeIdOnThreadDB: string, evidenceURI: string): Promise<TransactionResponse> => {
    try {
      const contract: Contract = await this.getContractInstance();
      this.tx = await contract.createClaim(safeIdOnThreadDB, evidenceURI);
      return this.tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Deposit funds in a safe
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @param value - Funds in Gwei
   * @returns A transaction response
   */
  depositFunds = async (safeIdOnThreadDB: string, value: string): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.depositFunds(safeIdOnThreadDB, { value });
      return this.tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Withdraw funds from a safe - only safe's current owner can execute this
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @returns A transaction response
   */
  withdrawFunds = async (safeIdOnThreadDB: string): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.withdrawFunds(safeIdOnThreadDB);
      return this.tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Submit the evidence supporting the claim - only claim creator can execute this
   * @param disputeId - Id of the dispute representing the claim
   * @param evidenceURI - IPFS URI pointing to the evidence submitted by the claim creator
   * @returns A transaction response
   */
  submitEvidence = async (disputeId: number, evidenceURI: string): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.submitEvidence(disputeId, evidenceURI);
      return this.tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Send signal after a claim is raised
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @returns A transaction response
   */
  sendSignal = async (safeIdOnThreadDB: string): Promise<TransactionResponse> => {
    try {
      const contract = await this.getContractInstance();
      this.tx = await contract.sendSignal(safeIdOnThreadDB);
      return this.tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the status (0 - Active, 1 - Passed, 2 - Failed or 3 - Refused To Arbitrate) of a claim by claimId
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @param claimId - Id of the claim
   * @returns The status of the claim
   */
  getClaimStatus = async (safeIdOnThreadDB: string, claimId: number): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const claimStatus: number = await contract.getClaimStatus(safeIdOnThreadDB, claimId);
      return claimStatus;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the safe by safe id
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @returns The Safe object containing safe data
   */
  getSafeBySafeId = async (safeIdOnThreadDB: string): Promise<Safe> => {
    try {
      const contract = await this.getContractInstance();
      const safe: Safe = await contract.safes(safeIdOnThreadDB);
      return safe;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the claim by claim id
   * @param claimId - Id of the claim
   * @returns The Claim object containing claim data
   */
  getClaimByClaimId = async (claimId: number): Promise<Claim> => {
    try {
      const contract = await this.getContractInstance();
      const claim: Claim = await contract.claims(claimId);
      return claim;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the total number of safes created on the SafientMain contract
   * @returns The total number of safes created on the SafientMain contract
   */
  getTotalNumberOfSafes = async (): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const totalSafes: BigNumber = await contract.safesCount();
      return Number(totalSafes);
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the total number of claims created on the SafientMain contract
   * @returns The total number of claims created on the SafientMain contract
   */
  getTotalNumberOfClaims = async (): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const totalClaims: BigNumber = await contract.claimsCount();
      return Number(totalClaims);
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the total balance of the SafientMain contract
   * @returns The total balance of SafientMain contract in ETH
   */
  getContractBalance = async (): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const mainContractBalance: BigNumber = await contract.getBalance();
      return Number(formatEther(mainContractBalance));
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Guardian proof
   * @param message - message generated during safe creation, also signed by the safe creator
   * @param signature - signature of the message signed by the creator
   * @param guardianProof - object containing guardian address and his secret
   * @param secrets - array of all the secrets of all the guardians, for cross verification
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @returns If the guardian proof was true or false
   */
  guardianProof = async (
    message: string,
    signature: Bytes,
    guardianProof: RecoveryProof[],
    secrets: string[],
    safeIdOnThreadDB: string
  ): Promise<boolean> => {
    try {
      const contract = await this.getContractInstance();
      const result: boolean = await contract.guardianProof(
        message,
        signature,
        guardianProof,
        secrets,
        safeIdOnThreadDB
      );
      return result;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };
}
