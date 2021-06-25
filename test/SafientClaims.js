const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const chai = require('chai');

const expect = chai.expect;

chai.use(require('chai-as-promised'));

const metaevidenceOrEvidenceURI =
  'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/';

const { SafientClaims } = require('safient-claims');
// const { SafientClaims } = require('../dist/index');

let provider, chainId;

(async () => {
  provider = new JsonRpcProvider('http://localhost:8545');
  const providerNetworkData = await provider.getNetwork();
  chainId = providerNetworkData.chainId;
})();

describe('safientMain', async () => {
  let safientMainAdminSigner, safeCreatorSigner, inheritorSigner, accountXSigner, safeCreatorAddress, inheritorAddress;

  describe('SafientMain Flow', async () => {
    it('Should deploy SafientMain', async () => {
      const AutoAppealableArbitrator = await ethers.getContractFactory('AutoAppealableArbitrator');
      const arbitrator = await AutoAppealableArbitrator.deploy(ethers.utils.parseEther('0.001'));
      await arbitrator.deployed();

      const SafientMain = await ethers.getContractFactory('SafientMain');
      const safientMain = await SafientMain.deploy(arbitrator.address);
      await safientMain.deployed();

      arbitratorAddress = arbitrator.address;
      safientMainAddress = safientMain.address;

      expect(await safientMain.arbitrator()).to.equal(arbitrator.address);
      expect(await arbitrator.arbitrationCost(123)).to.equal(ethers.utils.parseEther('0.001'));

      safientMainAdminSigner = await provider.getSigner(0);
      safeCreatorSigner = await provider.getSigner(1);
      inheritorSigner = await provider.getSigner(2);
      accountXSigner = await provider.getSigner(3);

      safeCreatorAddress = await safeCreatorSigner.getAddress();
      inheritorAddress = await inheritorSigner.getAddress();
    });

    it('Should allow users to create a safe', async () => {
      const sc = new SafientClaims(safeCreatorSigner, chainId);

      const fee = await sc.arbitrator.getArbitrationFee(); // 0.001 ETH

      // SUCCESS : create a safe
      await sc.safientMain.createSafe(
        inheritorAddress, // 2nd account
        metaevidenceOrEvidenceURI,
        String(ethers.utils.parseEther(String(fee + 0.001)))
      );

      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(1);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0.002);

      const safe = await sc.safientMain.getSafeBySafeId(1);

      expect(safe.safeInheritor).to.equal(inheritorAddress);
      expect(ethers.utils.formatEther(safe.safeFunds)).to.equal('0.002');

      // FAILURE : paying inadequate or no fee(arbitration fee) for safe creation
      await expect(
        sc.safientMain.createSafe(
          inheritorAddress,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(fee - 0.001)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : metaEvidence is not passed
      await expect(
        sc.safientMain.createSafe(inheritorAddress, '', String(ethers.utils.parseEther(String(fee + 0.001))))
      ).to.be.rejectedWith(Error);

      // FAILURE : inheritor is an zero address
      await expect(
        sc.safientMain.createSafe(
          '0x0',
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(fee + 0.001)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : safe creator and inheritor are same
      await expect(
        sc.safientMain.createSafe(
          safeCreatorAddress,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(fee + 0.001)))
        )
      ).to.be.rejectedWith(Error);
    });

    it('Should allow users to create a claim', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : safe does not exist
      await expect(
        sc.safientMain.createClaim(
          4,
          metaevidenceOrEvidenceURI,
          1 // 2nd account
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : only inheritor of the safe can create the claim
      await expect(sc.safientMain.createClaim(1, metaevidenceOrEvidenceURI)).to.be.rejectedWith(Error);

      sc = new SafientClaims(inheritorSigner, chainId);

      // SUCCESS : create 1st claim
      await sc.safientMain.createClaim(1, metaevidenceOrEvidenceURI);

      expect(await sc.safientMain.getTotalNumberOfClaims()).to.equal(1);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0.001);

      const claim1 = await sc.safientMain.getClaimByClaimId(0);

      expect(claim1.claimedBy).to.equal(inheritorAddress);
      expect(claim1.result).to.equal('Active');

      // SUCCESS : create 2nd claim on the same safe
      await sc.safientMain.createClaim(1, metaevidenceOrEvidenceURI);

      expect(await sc.safientMain.getTotalNumberOfClaims()).to.equal(2);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0);

      const claim2 = await sc.safientMain.getClaimByClaimId(1);

      expect(claim2.claimedBy).to.equal(inheritorAddress);
      expect(claim2.result).to.equal('Active');

      // FAILURE : total number of claims on a safe has reached the limit
      await expect(sc.safientMain.createClaim(1, metaevidenceOrEvidenceURI, 1)).to.be.rejectedWith(Error);

      // FAILURE : insufficient funds in the safe to pay the arbitration fee
      await expect(sc.safientMain.createClaim(1, metaevidenceOrEvidenceURI, 1)).to.be.rejectedWith(Error);
    });

    it('Should allow users to deposit funds in a safe', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : safe does not exist
      await expect(sc.safientMain.depositSafeFunds(4, String(ethers.utils.parseEther('2')))).to.be.rejectedWith(Error);

      // SUCCESS : deposit funds in a safe
      await sc.safientMain.depositSafeFunds(1, String(ethers.utils.parseEther('2')));

      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(2);
    });

    it('Should allow the safe owner to recover funds in the safe', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : safe does not exist
      await expect(sc.safientMain.recoverSafeFunds(4)).to.be.rejectedWith(Error);

      // FAILURE : only safe owner can recover the funds
      await expect(sc.safientMain.recoverSafeFunds(1)).to.be.rejectedWith(Error);

      sc = new SafientClaims(safeCreatorSigner, chainId);

      // SUCCESS : recover funds from a safe
      await sc.safientMain.recoverSafeFunds(1);

      // FAILURE : no funds remaining in the safe
      await expect(sc.safientMain.recoverSafeFunds(1)).to.be.rejectedWith(Error);
    });

    it('Should allow admin to set the total number of claims allowed on a safe', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : only SafexMain contract's admin can execute this
      await expect(sc.safientMain.setTotalClaimsAllowed(3)).to.be.rejectedWith(Error);

      sc = new SafientClaims(safientMainAdminSigner, chainId);

      // SUCCESS : set new total number of claims allowed
      await sc.safientMain.setTotalClaimsAllowed(3);

      expect(await sc.safientMain.getTotalClaimsAllowed()).to.equal(3);
    });
  });
});
