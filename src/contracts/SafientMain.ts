import {
  Safe,
  Claim,
  Tx,
  ContractAddress,
  ContractABI,
  Signer,
  Connection,
  SafeData,
  RecoveryProof,
} from '../types/Types';
import { Client, PrivateKey, ThreadID, Where } from '@textile/hub';
import { getThreadId } from '../utils/threadDb';
import { safientMainABI } from '../abis/SafientMain';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { Logger } from '@ethersproject/logger';
import { Bytes } from 'ethers';
import networks from '../utils/networks.json';

const safeStages = {
  ACTIVE: 0,
  CLAIMING: 1,
  RECOVERING: 2,
  RECOVERED: 3,
  CLAIMED: 4,
};

const claimStages = {
  ACTIVE: 0,
  PASSED: 1,
  FAILED: 2,
  REJECTED: 3,
};

export class SafientMain {
  private signer: Signer;
  private seed: Uint8Array;
  private safientMainABI: ContractABI;
  private safientMainAddress: ContractAddress;
  private logger: Logger;

  /**
   * Arbitrator Constructor
   * @param signer - Signer object
   * @param chainId - Provider chainId
   */
  constructor(signer: Signer, chainId: number, seed: Uint8Array) {
    this.logger = Logger.globalLogger();
    this.signer = signer;
    this.seed = seed;
    this.safientMainABI = safientMainABI;

    const network = Object.values(networks).find((network) => chainId === network.chainId);

    network !== undefined && network.addresses.safientMain !== ''
      ? (this.safientMainAddress = network.addresses.safientMain)
      : this.logger.throwError(`SafientMain contract not deployed on network with chain id: ${chainId}`);
  }

  /**
   * Get the threadDB connection object
   * @returns The threadDB connection object with Client and threadId
   */
  connectUser = async (): Promise<Connection> => {
    const identity = PrivateKey.fromRawEd25519Seed(Uint8Array.from(this.seed));
    const client = await Client.withKeyInfo({
      key: `${process.env.USER_API_KEY}`,
      secret: `${process.env.USER_API_SECRET}`,
    });
    await client.getToken(identity);
    const threadId = ThreadID.fromBytes(Uint8Array.from(await getThreadId()));
    return {
      client,
      threadId,
    };
  };

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
   * @param safeIdOnThreadDB - Safe Id on threadDB
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
   * @param conn - ThreadDB connection object resolved from connectUser method
   * @param did - DID of the user
   * @param safeIdOnThreadDB - Id of the safe on threadDB
   * @param evidenceURI - IPFS URI pointing to the evidence submitted by the claim creator
   * @returns A transaction response
   */
  createClaim = async (conn: Connection, did: string, safeIdOnThreadDB: string, evidenceURI: string): Promise<Tx> => {
    try {
      const contract = await this.getContractInstance();
      const tx = await contract.createClaim(safeIdOnThreadDB, evidenceURI);
      const txReceipt = await tx.wait();

      // If transaction is successful, update the safe on threadDB
      if (txReceipt.status === 1) {
        console.log('Claim created on contract successfully!');
        let disputeId = txReceipt.events[2].args[2];
        disputeId = parseInt(disputeId._hex);

        const query = new Where('_id').eq(safeIdOnThreadDB);
        const result: SafeData[] = await conn.client.find(conn.threadId, 'Safes', query);

        if (result[0].stage === 0) {
          console.log('Adding claim to threadDB...');
          result[0].stage = safeStages.CLAIMING;
          if (result[0].claims.length < 0) {
            result[0].claims = [
              {
                createdBy: did,
                claimStatus: claimStages.ACTIVE,
                disputeID: disputeId,
              },
            ];
          } else {
            result[0].claims.push({
              createdBy: did,
              claimStatus: claimStages.ACTIVE,
              disputeID: disputeId,
            });
          }
        }

        await conn.client.save(conn.threadId, 'Safes', [result[0]]);
        console.log('Claim added to threadDB successfully!');
        return tx;
      } else {
        this.logger.throwError('Transaction failed!');
      }
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
   * Get the safe by safe's id
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
   * Get the claim by claim's id
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
   * Get all the claims made on a safe by safe's id
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

  /**
   * Gaurdian proof
   * @param message - message
   * @param signature - signature
   * @param guardianProof - guardianProof
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
