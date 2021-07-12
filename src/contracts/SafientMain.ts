import { Safe, Claim, Tx, ContractAddress, ContractABI, Signer, RecoveryProof } from '../types/Types';
import { safientMainABI } from '../abis/SafientMain';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { Logger } from '@ethersproject/logger';
import { Bytes } from 'ethers';
import networks from '../utils/networks.json';

export class SafientMain {
  private signer: Signer;
  private safientMainABI: ContractABI;
  private safientMainAddress: ContractAddress;
  private logger: Logger;

  /**
   * Arbitrator Constructor
   * @param signer - Signer object
   * @param chainId - Provider chainId
   */
  constructor(signer: Signer, chainId: number) {
    this.logger = Logger.globalLogger();
    this.signer = signer;
    this.safientMainABI = safientMainABI;

    const network = Object.values(networks).find((network) => chainId === network.chainId);

    network !== undefined && network.addresses.safientMain !== ''
      ? (this.safientMainAddress = network.addresses.safientMain)
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
   * @param inheritorAddress - Address of the beneficiary who can claim to inherit this safe
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @param metaevidenceURI - IPFS URI pointing to the metaevidence related to general agreement, arbitration details, actors involved etc
   * @param value - Safe maintanence fee in Gwei, minimum arbitration fee required
   * @returns A transaction response
   */
  createSafe = async (
    inheritorAddress: string,
    safeIdOnThreadDB: string,
    metaevidenceURI: string,
    value: string
  ): Promise<Tx> => {
    try {
      const contract = await this.getContractInstance();
      const tx = await contract.createSafe(inheritorAddress, safeIdOnThreadDB, metaevidenceURI, { value });
      return tx;
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
  createClaim = async (safeIdOnThreadDB: string, evidenceURI: string): Promise<Tx> => {
    try {
      const contract = await this.getContractInstance();
      const tx = await contract.createClaim(safeIdOnThreadDB, evidenceURI);
      return tx;
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
  depositSafeFunds = async (safeIdOnThreadDB: string, value: string): Promise<Tx> => {
    try {
      const contract = await this.getContractInstance();
      const tx = await contract.depositSafeFunds(safeIdOnThreadDB, { value });
      return tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Recover funds from a safe - only safe's current owner can execute this
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @returns A transaction response
   */
  recoverSafeFunds = async (safeIdOnThreadDB: string): Promise<Tx> => {
    try {
      const contract = await this.getContractInstance();
      const tx = await contract.recoverSafeFunds(safeIdOnThreadDB);
      return tx;
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
  submitEvidence = async (disputeId: number, evidenceURI: string): Promise<Tx> => {
    try {
      const contract = await this.getContractInstance();
      const tx = await contract.submitEvidence(disputeId, evidenceURI);
      return tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Set a new value for the total claims allowed on a safe, only SafientMain contract deployer can execute this
   * @param claimsAllowed - Number of total claims allowed
   * @returns A transaction response
   */
  setTotalClaimsAllowed = async (claimsAllowed: number): Promise<Tx> => {
    try {
      const contract = await this.getContractInstance();
      const tx = await contract.setTotalClaimsAllowed(claimsAllowed);
      return tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get all the claims created on the SafientMain contract
   * @returns The array of all the claims
   */
  getAllClaims = async (): Promise<Claim[]> => {
    try {
      let claims: Claim[] = [];
      const contract = await this.getContractInstance();
      const claimsCountArray: 0[] = Array(Number(await contract.claimsCount())).fill(0);
      return new Promise((resolve, reject) => {
        claimsCountArray.forEach(async (_, i) => {
          try {
            const claim: Claim = await contract.claims(i);
            claims.push(claim);
            if (i === claimsCountArray.length - 1) {
              resolve(claims);
            }
          } catch (e) {
            reject(e.message);
          }
        });
      });
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
      const claimsCount: BigNumber = await contract.claimsCount();
      if (claimId + 1 > Number(claimsCount)) {
        this.logger.throwArgumentError('Claim Id does not exist', 'claimId', claimId);
      } else {
        const claim: Claim = await contract.claims(claimId);
        return claim;
      }
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get all the claims made on a safe by safe id
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @returns The array of all the Claim objects containing claim data on that safe
   */
  getClaimsOnSafeBySafeId = async (safeIdOnThreadDB: string): Promise<Claim[]> => {
    try {
      const claims = await this.getAllClaims();
      const claimsOnSafeId = claims.filter((claim) => claim.safeId === safeIdOnThreadDB);
      return claimsOnSafeId;
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
  getSafientMainContractBalance = async (): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const mainContractBalance: BigNumber = await contract.getSafientMainContractBalance();
      return Number(formatEther(mainContractBalance));
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the total number of claims allowed on a safe
   * @returns The total number of claims allowed on a safe
   */
  getTotalClaimsAllowed = async (): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const totalClaimsAllowed: BigNumber = await contract.getTotalClaimsAllowed();
      return Number(totalClaimsAllowed);
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the status (Active, Passed, Failed or Refused To Arbitrate) of a claim by claim id
   * @param claimId - Id of the claim
   * @returns The status of the claim
   */
  getClaimStatus = async (claimId: number): Promise<string> => {
    try {
      const contract = await this.getContractInstance();
      const claimsCount: BigNumber = await contract.claimsCount();
      if (claimId + 1 > Number(claimsCount)) {
        this.logger.throwArgumentError('Claim Id does not exist', 'claimId', claimId);
      } else {
        const claim: Claim = await contract.claims(claimId);
        let status: string;
        switch (claim.status) {
          case 0:
            status = 'Active';
            break;
          case 1:
            status = 'Passed';
            break;
          case 2:
            status = 'Failed';
            break;
          case 3:
            status = 'Refused To Arbitrate';
            break;
          default:
            status = 'Active';
            break;
        }
        return status;
      }
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Gaurdian proof
   * @param message - message
   * @param signature - signature
   * @param guardianProof - guardian proof
   * @param secrets - secrets
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @returns
   */
  gaurdianProof = async (
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
