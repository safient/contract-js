import { Signer } from './types/Types';
import { SafientMain } from './contracts/SafientMain';
import { Arbitrator } from './contracts/Arbitrator';
export class SafientClaims {
  safientMain: SafientMain;
  arbitrator: Arbitrator;

  constructor(signer: Signer, chainId: number, seed: Uint8Array) {
    this.safientMain = new SafientMain(signer, chainId, seed);
    this.arbitrator = new Arbitrator(signer, chainId);
  }
}
