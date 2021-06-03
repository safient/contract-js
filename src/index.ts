import { ContractAddress, ContractABI, ProviderOrUrl } from './types/Types';
import { SafientMain } from './contracts/SafientMain';
import { Arbitrator } from './contracts/Arbitrator';

export class SafientClaims {
  safientMain: SafientMain;
  arbitrator: Arbitrator;

  constructor(providerOrUrl: ProviderOrUrl, safientMainAddress: ContractAddress, arbitratorAddress: ContractAddress) {
    this.safientMain = new SafientMain(providerOrUrl, safientMainAddress);
    this.arbitrator = new Arbitrator(providerOrUrl, arbitratorAddress);
  }
}
