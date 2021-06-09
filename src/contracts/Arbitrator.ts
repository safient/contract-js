import { arbitratorABI } from '../abis/Arbitrator';
import { networks } from '../networks/networks';
import { Provider, ContractAddress, ContractABI, Signer } from '../types/Types';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { formatEther } from '@ethersproject/units';
import { Logger } from '@ethersproject/logger';

export class Arbitrator {
  private provider: Provider;
  private arbitratorABI: ContractABI;
  private arbitratorAddress: ContractAddress;
  private logger: Logger;

  /**
   * Arbitrator Constructor
   * @param provider - Provider object ex: injected web3 provider like metamask
   * @param chainId - Provider chainId
   */
  constructor(provider: Provider, chainId: number) {
    this.logger = Logger.globalLogger();
    this.provider = provider;
    this.arbitratorABI = arbitratorABI;

    const network = networks.find((network) => chainId === network.chainId);

    network !== undefined && network.addresses.arbitrator !== ''
      ? (this.arbitratorAddress = network.addresses.arbitrator)
      : this.logger.throwError(`Arbitrator contract not deployed on network with chain id: ${chainId}`);
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
