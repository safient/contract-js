import { Signer } from './types/Types';
import { SafientMain } from './contracts/SafientMain';
import { Arbitrator } from './contracts/Arbitrator';

import { JsonRpcProvider } from '@ethersproject/providers';

export class SafientClaims {
  safientMain: SafientMain;
  arbitrator: Arbitrator;

  constructor(signer: Signer, chainId: number) {
    this.safientMain = new SafientMain(signer, chainId);
    this.arbitrator = new Arbitrator(signer, chainId);
  }
}
