import { ContractABI, ContractAddress, Signer } from '../types/Types';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { Logger } from '@ethersproject/logger';
import {networks} from '../utils/networks';
import data from '../abis/AutoAppealableArbitrator.json';
import { JsonRpcProvider } from '@ethersproject/providers';

/**
 * This class implements an interface to interact with the arbitrator contract
 * to fetch the arbitration details
 */
export class Arbitrator {
  /** @ignore */
  private signer: Signer;

  /** @ignore */
  private arbitratorABI: ContractABI;

  /** @ignore */
  private arbitratorAddress: ContractAddress;

  /** @ignore */
  private logger: Logger;

  /** @ignore */
  private contract: Contract;

  /**
   * Arbitrator Constructor
   * @param signer - Signer object
   * @param chainId - Provider chainId
   */
  constructor(signer: Signer, chainId: number) {
    this.logger = Logger.globalLogger();
    this.signer = signer;
    this.arbitratorABI = data.abi;

    const network = Object.values(networks).find((network) => chainId === network.chainId);

    network !== undefined && network.addresses.AutoAppealableArbitrator !== ''
      ? (this.arbitratorAddress = network.addresses.AutoAppealableArbitrator)
      : this.logger.throwError(`Arbitrator contract not deployed on network with chain id: ${chainId}`);

    this.contract = new Contract(this.arbitratorAddress, this.arbitratorABI, this.signer);
  }

  /**
   * This function returns the arbitration fee
   * @returns The arbitration fee in ETH
   */
  getArbitrationFee = async (): Promise<number> => {
    try {
      const arbitrationFee: BigNumber = await this.contract.arbitrationCost(0x0);
      return Number(formatEther(arbitrationFee));
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };

  /** @ignore */
  giveRulingCall = async (disputeId: number, ruling: number): Promise<boolean> => {
    try {
      await this.contract.giveRuling(disputeId, ruling);
      return true;
    } catch (e: any) {
      this.logger.throwError(e.message);
    }
  };
}
