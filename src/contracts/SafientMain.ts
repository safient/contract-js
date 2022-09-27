import {
  ContractABI,
  ContractAddress,
  Claim,
  ClaimStatus,
  ClaimType,
  ClaimAction,
  RecoveryProof,
  Safe,
  Signer,
} from '../types/Types';
import { JsonRpcProvider, TransactionResponse } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { formatEther, parseEther } from '@ethersproject/units';
import { Logger } from '@ethersproject/logger';
import { Bytes } from 'ethers';
import networks from '../utils/networks.json';
import { getNetworkUrl } from "../utils/networks"
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

  /** @ignore */
  private contract: Contract;

  /**@ignore */
  private provider: JsonRpcProvider

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

    const networkUrl = getNetworkUrl(chainId)
    this.provider = new JsonRpcProvider(networkUrl)

    network !== undefined && network.addresses.SafientMain !== ''
      ? (this.safientMainAddress = network.addresses.SafientMain)
      : this.logger.throwError(`SafientMain contract not deployed on network with chain id: ${chainId}`);

    this.contract = new Contract(this.safientMainAddress, this.safientMainABI, this.signer);
  }

  /**
   * This function creates a new safe by the safe creator
   * @param beneficiaryAddress Address of the beneficiary who can claim to inherit this safe
   * @param safeId Id of the safe
   * @param claimType Type of claim the inheritor has go through
   * @param claimPeriod The value use to vaiditate based on claimType after which the beneficiary can directly claim the safe
   * @param metaevidenceURI IPFS URI pointing to the metaevidence related to general agreement, arbitration details, actors involved etc
   * @param value Safe maintanence fee in Gwei, minimum arbitration fee required
   * @returns A transaction response
   */
  createSafe = async (
    beneficiaryAddress: string,
    safeId: string,
    claimType: ClaimType,
    claimPeriod: number,
    metaevidenceURI: string,
    value: string
  ): Promise<TransactionResponse> => {
    try {
      if (claimType === ClaimType.DDayBased || claimType === ClaimType.Expirion) {
        const latestBlockNumber = await this.provider.getBlockNumber();
        const latestBlock = await this.provider.getBlock(latestBlockNumber);
        claimPeriod = latestBlock.timestamp + claimPeriod
      }
      this.tx = await this.contract.createSafe(
        beneficiaryAddress,
        safeId,
        claimType,
        claimPeriod,
        metaevidenceURI,
        {
          value,
        }
      );
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
   * @param claimPeriod The value use to vaiditate based on claimType after which the beneficiary can directly claim the safe
   * @param metaevidenceURI IPFS URI pointing to the metaevidence related to general agreement, arbitration details, actors involved etc
   * @param value Safe maintanence fee in Gwei, minimum arbitration fee required
   * @returns A transaction response
   */
  syncSafe = async (
    creatorAddress: string,
    safeId: string,
    claimType: ClaimType,
    claimPeriod: number,
    metaevidenceURI: string,
    value: string
  ): Promise<TransactionResponse> => {
    try {

      if (claimType === ClaimType.DDayBased || claimType === ClaimType.Expirion) {
        const latestBlockNumber = await this.provider.getBlockNumber();
        const latestBlock = await this.provider.getBlock(latestBlockNumber);
        claimPeriod = latestBlock.timestamp + claimPeriod
      }

      this.tx = await this.contract.syncSafe(
        creatorAddress,
        safeId,
        claimType,
        claimPeriod,
        metaevidenceURI,
        {
          value,
        }
      );
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
      this.tx = await this.contract.createClaim(safeId, evidenceURI);
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
      this.tx = await this.contract.depositFunds(safeId, { value });
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
      this.tx = await this.contract.withdrawFunds(safeId);
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
      this.tx = await this.contract.submitEvidence(disputeId, evidenceURI);
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
  getClaimStatus = async (safeId: string, claimId: number): Promise<ClaimStatus> => {
    try {
      const claimStatus: ClaimStatus = await this.contract.getClaimStatus(safeId, claimId);
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
      const safe: Safe = await this.contract.safes(safeId);
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
      const claim: Claim = await this.contract.claims(claimId);
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
      const totalSafes: BigNumber = await this.contract.safesCount();
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
      const totalClaims: BigNumber = await this.contract.claimsCount();
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
      const mainContractBalance: BigNumber = await this.contract.getBalance();
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
  ): Promise<TransactionResponse> => {
    try {
      const result: TransactionResponse = await this.contract.guardianProof(message, signature, guardianProof, secrets, safeId);
      return result;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function allows the guardians to claim their rewards
   * @param funds Total funds need to be claimed in ETH
   * @returns A transaction response
   */
  claimRewards = async (funds: number): Promise<TransactionResponse> => {
    try {
      this.tx = await this.contract.claimRewards(parseEther(String(funds)));
      return this.tx;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function returns the total guardian reward balance of a guardian
   * @param address The address of the guardian
   * @returns The total guardian reward balance in ETH
   */
  getGuardianRewards = async (address: string): Promise<number> => {
    try {
      const guardianReward: BigNumber = await this.contract.guardianRewards(address);
      return Number(formatEther(guardianReward));
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * This function updates the Claim of a safe
   * @param safeId Id of the safe
   * @param beneficiary address of the benificiary
   * @param claimType Need to send if claimType needs to be updated along with claimPeriod
   * @param claimPeriod The timestamp in unix epoch milliseconds to update claimPeriod
   * @param metaEvidence
   * @param deprecated boolean defines if safe is deprecated set true to deprecate safe
   * @returns A transaction response
   */

  sendUpdateSafe = async (
    safeId: string,
    claimType: ClaimType,
    claimPeriod: number,
    metaevidenceURI: string,
    claimAction: ClaimAction): Promise<boolean> => {
    try {
      const isUpdated = await this.contract.updateSafe(safeId, claimType, claimPeriod, metaevidenceURI, claimAction);
      return isUpdated;
    } catch (e: any) {
      return e;
    }
  };
}
