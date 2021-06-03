import SafientMainABI from '../abis/SafientMain';
import { Safe, Claim, Tx, Provider, ContractAddress, ContractABI, ProviderOrUrl, Signer } from '../types/Types';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { isAddress } from '@ethersproject/address';
import { Logger } from '@ethersproject/logger';

export class SafientMain {
  private provider: Provider;
  private safientMainABI: ContractABI;
  private safientMainAddress: ContractAddress;
  private providerType: string;
  private logger: Logger;

  /**
   * SafientMain Constructor
   * @param providerOrUrl - Injected provider object like metamask or JsonRpcUrl like http://localhost:8545
   * @param safientMainABI - SafientMain contract ABI
   * @param safientMainAddress - SafientMain contract address
   */
  constructor(providerOrUrl: ProviderOrUrl, safientMainAddress: ContractAddress) {
    if (isAddress(safientMainAddress)) {
      if (typeof providerOrUrl === 'string') {
        this.provider = new JsonRpcProvider(providerOrUrl);
        this.providerType = 'TestJsonRpc';
      } else if (typeof providerOrUrl === 'object') {
        this.provider = providerOrUrl;
        this.providerType = 'Web3';
      }
      this.safientMainABI = SafientMainABI;
      this.safientMainAddress = safientMainAddress;
      this.logger = Logger.globalLogger();
    }
  }

  /**
   * Get the signer object from a provider
   * @param provider - Provider object like JsonRpcProvider or Web3Provider
   * @param [signer] - Specific signer account for test purpose
   * @returns The signer object
   */
  private getSignerFromProvider = async (provider: Provider, signer?: number): Promise<Signer> => {
    try {
      let signer_;
      signer !== undefined ? (signer_ = await provider.getSigner(signer)) : (signer_ = await provider.getSigner());
      return signer_;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the SafientMain contract instance
   * @param [signer] - Specific signer account for test purpose
   * @returns The SafientMain contract instance associated with the signer
   */
  private getContractInstance = async (signer?: number): Promise<Contract> => {
    try {
      let signer_;
      signer !== undefined
        ? (signer_ = await this.getSignerFromProvider(this.provider, signer))
        : (signer_ = await this.getSignerFromProvider(this.provider));
      const contractInstance = new Contract(this.safientMainAddress, this.safientMainABI, signer_);
      return contractInstance;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Create a safient safe
   * @param inheritorAddress - Address of the beneficiary who can claim to inherit this safe
   * @param metaevidenceURI - IPFS URI pointing to the metaevidence related to general agreement, arbitration details, actors involved etc
   * @param value - Safe maintanence fee in Gwei, minimum arbitration fee required
   * @returns A transaction response
   */
  createSafe = async (inheritorAddress: string, metaevidenceURI: string, value: string): Promise<Tx> => {
    try {
      const contract = await this.getContractInstance();
      const tx: Tx = await contract.createSafe(inheritorAddress, metaevidenceURI, { value });
      return tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Create a claim on a safe
   * @param safeId - Id of the safe
   * @param evidenceURI - IPFS URI pointing to the evidence submitted by the claim creator
   * @param [signer] - Specific signer account for test purpose
   * @returns A transaction response
   */
  createClaim = async (safeId: number, evidenceURI: string, signer?: number): Promise<Tx> => {
    try {
      let contract;
      this.providerType === 'TestJsonRpc'
        ? (contract = await this.getContractInstance(signer))
        : (contract = await this.getContractInstance());
      const tx = await contract.createClaim(safeId, evidenceURI);
      return tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Deposit funds in a safe
   * @param safeId - Id of the safe
   * @param value - Funds in Gwei
   * @returns A transaction response
   */
  depositSafeFunds = async (safeId: number, value: string): Promise<Tx> => {
    try {
      const contract = await this.getContractInstance();
      const tx = await contract.depositSafeFunds(safeId, { value });
      return tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Recover funds from a safe - only safe's current owner can execute this
   * @param safeId - Id of the safe
   * @param [signer] - Specific signer account for test purpose
   * @returns A transaction response
   */
  recoverSafeFunds = async (safeId: number, signer?: number): Promise<Tx> => {
    try {
      let contract;
      this.providerType === 'TestJsonRpc'
        ? (contract = await this.getContractInstance(signer))
        : (contract = await this.getContractInstance());
      const tx = await contract.recoverSafeFunds(safeId);
      return tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Submit the evidence supporting the claim - only claim creator can execute this
   * @param disputeId - Id of the dispute representing the claim
   * @param evidenceURI - IPFS URI pointing to the evidence submitted by the claim creator
   * @param [signer] - Specific signer account for test purpose
   * @returns A transaction response
   */
  submitEvidence = async (disputeId: number, evidenceURI: string, signer?: number): Promise<Tx> => {
    try {
      let contract;
      this.providerType === 'TestJsonRpc'
        ? (contract = await this.getContractInstance(signer))
        : (contract = await this.getContractInstance());
      const tx = await contract.submitEvidence(disputeId, evidenceURI);
      return tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Set a new value for the total claims allowed on a safe, only SafientMain contract deployer can execute this
   * @param claimsAllowed - Number of total claims allowed
   * @param [signer] - Specific signer account for test purpose
   * @returns A transaction response
   */
  setTotalClaimsAllowed = async (claimsAllowed: number, signer?: number): Promise<Tx> => {
    try {
      let contract;
      this.providerType === 'TestJsonRpc'
        ? (contract = await this.getContractInstance(signer))
        : (contract = await this.getContractInstance());
      const tx = await contract.setTotalClaimsAllowed(claimsAllowed);
      return tx;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get all the safes created on the SafientMain contract
   * @returns The array of all the safes
   */
  getAllSafes = async (): Promise<Safe[]> => {
    try {
      let safes: Safe[] = [];
      const contract = await this.getContractInstance();
      const safesCountArray: 0[] = Array(Number(await contract.safesCount())).fill(0);
      return new Promise((resolve, reject) => {
        safesCountArray.forEach(async (_, i) => {
          try {
            const safe: Safe = await contract.safes(i + 1);
            safes.push(safe);
            if (i === safesCountArray.length - 1) {
              resolve(safes);
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
   * Get the safe by safe's id
   * @param safeId - Id of the safe
   * @returns The safe's object containing safe data
   */
  getSafeBySafeId = async (safeId: number): Promise<Safe> => {
    try {
      const contract = await this.getContractInstance();
      const safesCount: BigNumber = await contract.safesCount();
      if (safeId === 0 || safeId > Number(safesCount)) {
        this.logger.throwArgumentError('Safe Id does not exist', 'safeId', safeId);
      } else {
        const safe: Safe = await contract.safes(safeId);
        return safe;
      }
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the claim by claim's id
   * @param claimId - Id of the claim
   * @returns The claim's object containing claim data
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
   * Get all the claims made on a safe by safe's id
   * @param safeId - Id of the safe
   * @returns The array of all the claim objects containing claim data on that safe
   */
  getClaimsOnSafeBySafeId = async (safeId: number): Promise<Claim[]> => {
    try {
      const contract = await this.getContractInstance();
      const safesCount: BigNumber = await contract.safesCount();
      if (safeId > Number(safesCount)) {
        this.logger.throwArgumentError('Safe Id does not exist', 'safeId', safeId);
      } else {
        const claims = await this.getAllClaims();
        const claimsOnSafeId = claims.filter((claim) => Number(claim.safeId) === safeId);
        return claimsOnSafeId;
      }
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
      const mainContractBalance: BigNumber = await contract.getSafexMainContractBalance();
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
   * Get the status (Active, Passed, Failed or Refused To Arbitrate) of a claim by claim's id
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
}
