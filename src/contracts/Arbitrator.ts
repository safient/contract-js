import ArbitratorABI from '../abis/Arbitrator';
import { Provider, ContractAddress, ContractABI, ProviderOrUrl, Signer } from '../types/Types';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { isAddress } from '@ethersproject/address';
import { Logger } from '@ethersproject/logger';

export class Arbitrator {
  private provider: Provider;
  private arbitratorABI: ContractABI;
  private arbitratorAddress: ContractAddress;
  private logger: Logger;

  /**
   * Arbitrator Constructor
   * @param providerOrUrl - Injected provider object like metamask or JsonRpcUrl like http://localhost:8545
   * @param arbitratorABI - Arbitrator contract ABI
   * @param arbitratorAddress - Arbitrator contract address
   */
  constructor(providerOrUrl: ProviderOrUrl, arbitratorAddress: ContractAddress) {
    if (isAddress(arbitratorAddress)) {
      if (typeof providerOrUrl === 'string') {
        this.provider = new JsonRpcProvider(providerOrUrl);
      } else if (typeof providerOrUrl === 'object') {
        this.provider = providerOrUrl;
      }
      this.arbitratorABI = ArbitratorABI;
      this.arbitratorAddress = arbitratorAddress;
      this.logger = Logger.globalLogger();
    }
  }

  /**
   * Get the signer object from a provider
   * @param provider - Provider object like JsonRpcProvider or Web3Provider
   * @returns The signer object
   */
  private getSignerFromProvider = async (provider: Provider): Promise<Signer> => {
    try {
      const signer = await provider.getSigner();
      return signer;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the Arbitrator contract instance
   * @returns The Arbitrator contract instance associated with the signer
   */
  private getContractInstance = async (): Promise<Contract> => {
    try {
      const signer = await this.getSignerFromProvider(this.provider);
      const contractInstance = new Contract(this.arbitratorAddress, this.arbitratorABI, signer);
      return contractInstance;
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };

  /**
   * Get the arbitration fee
   * @returns The arbitration fee in ETH
   */
  getArbitrationFee = async (): Promise<number> => {
    try {
      const contract = await this.getContractInstance();
      const arbitrationFee: BigNumber = await contract.arbitrationCost(0x0);
      return Number(formatEther(arbitrationFee));
    } catch (e) {
      this.logger.throwError(e.message);
    }
  };
}
