import { Provider } from './types/Types';
import { SafientMain } from './contracts/SafientMain';
import { Arbitrator } from './contracts/Arbitrator';

export class SafientClaims {
  safientMain: SafientMain;
  arbitrator: Arbitrator;

  constructor(provider: Provider, chainId: number) {
    this.safientMain = new SafientMain(provider, chainId);
    this.arbitrator = new Arbitrator(provider, chainId);
  }
}
