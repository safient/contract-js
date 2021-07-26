const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { Contract } = require('@ethersproject/contracts');
const { arbitratorABI } = require('./abis/arbitratorABI');
const chai = require('chai');

require('dotenv').config();

const expect = chai.expect;
chai.use(require('chai-as-promised'));

const metaevidenceOrEvidenceURI =
  'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/';

const { SafientClaims } = require('../dist/index');

describe('safientMain', async () => {
  const safeIdOnThreadDB = '123456789';
  let provider, chainId;
  let safientMainAdminSigner, safeCreatorSigner, inheritorSigner, accountXSigner, safeCreatorAddress, inheritorAddress;
  let arbitratorAddress;

  describe('SafientClaims SDK Flow', async () => {
    before(async () => {
      // Provider and ChainId
      provider = new JsonRpcProvider('http://localhost:8545');
      const providerNetworkData = await provider.getNetwork();
      chainId = providerNetworkData.chainId;

      // Signers, Signer addresses
      safientMainAdminSigner = await provider.getSigner(0);
      safeCreatorSigner = await provider.getSigner(1);
      inheritorSigner = await provider.getSigner(2);
      accountXSigner = await provider.getSigner(3);

      safeCreatorAddress = await safeCreatorSigner.getAddress();
      inheritorAddress = await inheritorSigner.getAddress();
    });

    it('Should deploy SafientMain', async () => {
      const AutoAppealableArbitrator = await ethers.getContractFactory('AutoAppealableArbitrator');
      let arbitrator = await AutoAppealableArbitrator.deploy(ethers.utils.parseEther('0.001'));
      await arbitrator.deployed();

      const SafientMain = await ethers.getContractFactory('SafientMain');
      let safientMain = await SafientMain.deploy(arbitrator.address);
      await safientMain.deployed();

      arbitratorAddress = arbitrator.address;
      safientMainAddress = safientMain.address;

      expect(await safientMain.arbitrator()).to.equal(arbitrator.address);
      expect(await arbitrator.arbitrationCost(123)).to.equal(ethers.utils.parseEther('0.001'));
    });

    it('Should allow users to create a safe', async () => {
      const sc = new SafientClaims(safeCreatorSigner, chainId);

      const arbitrationFee = await sc.arbitrator.getArbitrationFee(); // 0.001 ETH
      const gaurdianFee = 0.01; // 0.01 ETH

      // SUCCESS : create a safe
      await sc.safientMain.createSafe(
        inheritorAddress, // 2nd account
        safeIdOnThreadDB,
        metaevidenceOrEvidenceURI,
        String(ethers.utils.parseEther(String(arbitrationFee + gaurdianFee)))
      );

      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(1);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0.011);

      const safe = await sc.safientMain.getSafeBySafeId(safeIdOnThreadDB);

      expect(safe.safeInheritor).to.equal(inheritorAddress);
      expect(ethers.utils.formatEther(safe.safeFunds)).to.equal('0.011');

      // FAILURE : ID of the safe on threadDB is not passed
      await expect(
        sc.safientMain.createSafe(
          inheritorAddress,
          '',
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + gaurdianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : paying inadequate or no fee(arbitration fee) for safe creation
      await expect(
        sc.safientMain.createSafe(
          inheritorAddress,
          safeIdOnThreadDB,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee - 0.0001)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : metaEvidence is not passed
      await expect(
        sc.safientMain.createSafe(
          inheritorAddress,
          safeIdOnThreadDB,
          '',
          String(ethers.utils.parseEther(String(arbitrationFee + gaurdianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : inheritor is an zero address
      await expect(
        sc.safientMain.createSafe(
          '0x0',
          safeIdOnThreadDB,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + gaurdianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : safe creator and inheritor are same
      await expect(
        sc.safientMain.createSafe(
          safeCreatorAddress,
          safeIdOnThreadDB,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + gaurdianFee)))
        )
      ).to.be.rejectedWith(Error);
    });

    

    it('Should allow users to create a claim', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : only inheritor of the safe can create the claim
      await expect(sc.safientMain.createClaim(safeIdOnThreadDB, metaevidenceOrEvidenceURI)).to.be.rejectedWith(Error);

      sc = new SafientClaims(inheritorSigner, chainId);

      // SUCCESS : create a claim
      await sc.safientMain.createClaim(safeIdOnThreadDB, metaevidenceOrEvidenceURI);

      expect(await sc.safientMain.getTotalNumberOfClaims()).to.equal(1);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0.01);

      const claim = await sc.safientMain.getClaimByClaimId(0);

      expect(claim.claimedBy).to.equal(inheritorAddress);
      expect(claim.result).to.equal('Active');
    });

    // it('Arbitrator should be able to give ruling', async () => {
    //   const sc = new SafientClaims(accountXSigner, chainId);

    //   const arbitratorContract = new Contract(arbitratorAddress, arbitratorABI, safientMainAdminSigner);
    //   await arbitratorContract.giveRuling(0, 2);

    //   expect(await sc.safientMain.getClaimStatus(0)).to.equal('Failed');
    // });

    it('Should allow users to deposit funds in a safe', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      // SUCCESS : deposit funds in a safe
      await sc.safientMain.depositSafeFunds(safeIdOnThreadDB, String(ethers.utils.parseEther('2')));

      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(2.01);
    });

    it('Should allow the safe owner to recover funds in the safe', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : only safe owner can recover the funds
      await expect(sc.safientMain.recoverSafeFunds(safeIdOnThreadDB)).to.be.rejectedWith(Error);

      sc = new SafientClaims(safeCreatorSigner, chainId);

      // SUCCESS : recover funds from a safe
      await sc.safientMain.recoverSafeFunds(safeIdOnThreadDB);

      // FAILURE : no funds remaining in the safe
      await expect(sc.safientMain.recoverSafeFunds(safeIdOnThreadDB)).to.be.rejectedWith(Error);
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

    it('Should get the safe on contract by its Safe Id', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      const safe = await sc.safientMain.getSafeBySafeId(safeIdOnThreadDB);

      expect(safe.safeId).to.equal(safeIdOnThreadDB);
      expect(safe.safeCreatedBy).to.equal(safeCreatorAddress);
      expect(safe.claimsCount).to.equal(1);
      expect(safe.safeFunds).to.equal(0);
    });

    it('Should get the claim by its Claim Id', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      const claim = await sc.safientMain.getClaimByClaimId(0);

      expect(claim.safeId).to.equal(safeIdOnThreadDB);
      expect(claim.disputeId).to.equal(0);
      expect(claim.claimedBy).to.equal(inheritorAddress);
    });

    it('Should get all the claims on SafientMain', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      const claims = await sc.safientMain.getAllClaims();

      expect(claims.length).to.equal(1);
      expect(claims[0].safeId).to.equal(safeIdOnThreadDB);
      expect(claims[0].disputeId).to.equal(0);
      expect(claims[0].claimedBy).to.equal(inheritorAddress);
    });

    it('Should get all the claims on a safe by Safe Id', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      const claims = await sc.safientMain.getClaimsOnSafeBySafeId(safeIdOnThreadDB);

      expect(claims.length).to.equal(1);
      expect(claims[0].safeId).to.equal(safeIdOnThreadDB);
      expect(claims[0].disputeId).to.equal(0);
      expect(claims[0].claimedBy).to.equal(inheritorAddress);
    });

    it('Should get the total number of safes on the contract', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(1);
    });

    it('Should get the total number of claims on the contract', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      expect(await sc.safientMain.getTotalNumberOfClaims()).to.equal(1);
    });

    it('Should get the SafientMain contract balance', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0);
    });

    it('Should get the total number of claims allowed on a safe', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      expect(await sc.safientMain.getTotalClaimsAllowed()).to.equal(3);
    });

    it('Should get the status of the claim on a safe', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      // expect(await sc.safientMain.getClaimStatus(0)).to.equal('Failed');
      expect(await sc.safientMain.getClaimStatus(0)).to.equal('Active');
    });

    it('Should get give ruling on a safe', async () => {
      const sc = new SafientClaims(safientMainAdminSigner, chainId);
      // expect(await sc.safientMain.getClaimStatus(0)).to.equal('Failed');
      await sc.arbitrator.giveRulingCall(0,1);

      expect(await sc.safientMain.getClaimStatus(0)).to.equal('Passed');
    });

    it('Should allow safe data sync', async () => {
      const sc = new SafientClaims(inheritorSigner, chainId);

      const arbitrationFee = await sc.arbitrator.getArbitrationFee(); // 0.001 ETH
      const gaurdianFee = 0.01; // 0.01 ETH

      // SUCCESS : create a safe
      await sc.safientMain.syncSafe(
        safeCreatorAddress, // 2nd account
        safeIdOnThreadDB,
        metaevidenceOrEvidenceURI,
        String(ethers.utils.parseEther(String(arbitrationFee + gaurdianFee)))
      );

      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(2);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0.011);

      const safe = await sc.safientMain.getSafeBySafeId(safeIdOnThreadDB);

      expect(safe.safeInheritor).to.equal(inheritorAddress);
      expect(ethers.utils.formatEther(safe.safeFunds)).to.equal('0.011');
    });

  });
});
