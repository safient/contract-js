import { ContractAddress, ContractABI, ProviderOrUrl } from './types/Types';
import { SafientMain } from './contracts/SafientMain';
import { Arbitrator } from './contracts/Arbitrator';

export class SafientClaims {
  safientMain: SafientMain;
  arbitrator: Arbitrator;

  constructor(
    providerOrUrl: ProviderOrUrl,
    safientMainABI: ContractABI,
    safientMainAddress: ContractAddress,
    arbitratorABI: ContractABI,
    arbitratorAddress: ContractAddress
  ) {
    this.safientMain = new SafientMain(providerOrUrl, safientMainABI, safientMainAddress);
    this.arbitrator = new Arbitrator(providerOrUrl, arbitratorABI, arbitratorAddress);
  }
}
