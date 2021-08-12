const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const chai = require('chai');

require('dotenv').config();

const expect = chai.expect;
chai.use(require('chai-as-promised'));

const metaevidenceOrEvidenceURI =
  'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/';

const { SafientClaims } = require('./dist/index');

describe('safientMain', async () => {
  const safeIdOnThreadDB = '123456789';
  let provider, chainId;
  let safientMainAdminSigner,
    safeCreatorSigner,
    beneficiarySigner,
    accountXSigner,
    safeCreatorAddress,
    beneficiaryAddress;

  describe('SafientClaims SDK Test Flow', async () => {
    before(async () => {
      // Provider and ChainId
      provider = new JsonRpcProvider('http://localhost:8545');
      const providerNetworkData = await provider.getNetwork();
      chainId = providerNetworkData.chainId;

      // Signers, Signer addresses
      safientMainAdminSigner = await provider.getSigner(0);
      safeCreatorSigner = await provider.getSigner(1);
      beneficiarySigner = await provider.getSigner(2);
      accountXSigner = await provider.getSigner(3);

      safeCreatorAddress = await safeCreatorSigner.getAddress();
      beneficiaryAddress = await beneficiarySigner.getAddress();
    });

    it('Should allow safe creators to create a safe', async () => {
      const sc = new SafientClaims(safeCreatorSigner, chainId);

      const arbitrationFee = await sc.arbitrator.getArbitrationFee(); // 0.001 ETH
      const guardianFee = 0.01; // 0.01 ETH

      // SUCCESS : create a safe
      await sc.safientMain.createSafe(
        beneficiaryAddress, // 2nd account
        safeIdOnThreadDB,
        metaevidenceOrEvidenceURI,
        String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
      );

      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(1);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0.011);

      const safe = await sc.safientMain.getSafeBySafeId(safeIdOnThreadDB);

      expect(safe.safeBeneficiary).to.equal(beneficiaryAddress);
      expect(ethers.utils.formatEther(safe.safeFunds)).to.equal('0.011');

      // FAILURE : ID of the safe on threadDB is not passed
      await expect(
        sc.safientMain.createSafe(
          beneficiaryAddress,
          '',
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : paying inadequate or no fee(arbitration fee) for safe creation
      await expect(
        sc.safientMain.createSafe(
          beneficiaryAddress,
          safeIdOnThreadDB,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee - 0.0001)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : metaEvidence is not passed
      await expect(
        sc.safientMain.createSafe(
          beneficiaryAddress,
          safeIdOnThreadDB,
          '',
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : beneficiary is an zero address
      await expect(
        sc.safientMain.createSafe(
          '0x0',
          safeIdOnThreadDB,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : safe creator and beneficiary are same
      await expect(
        sc.safientMain.createSafe(
          safeCreatorAddress,
          safeIdOnThreadDB,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);
    });

    it('Should allow beneficiaries to create a claim', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : only beneficiary of the safe can create the claim
      await expect(sc.safientMain.createClaim(safeIdOnThreadDB, metaevidenceOrEvidenceURI)).to.be.rejectedWith(Error);

      sc = new SafientClaims(beneficiarySigner, chainId);

      // SUCCESS : create a claim
      await sc.safientMain.createClaim(safeIdOnThreadDB, metaevidenceOrEvidenceURI);

      expect(await sc.safientMain.getTotalNumberOfClaims()).to.equal(1);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0.01);

      const claim = await sc.safientMain.getClaimByClaimId(0);

      expect(claim.claimedBy).to.equal(beneficiaryAddress);
      expect(claim.result).to.equal('Active');
    });

    it('Should allow users to deposit funds in a safe', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      // SUCCESS : deposit funds in a safe
      await sc.safientMain.depositSafeFunds(safeIdOnThreadDB, String(ethers.utils.parseEther('2')));

      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(2.01);
    });

    it('Should allow current owner of the to retrieve funds in the safe', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : only safe owner can retrieve the funds
      await expect(sc.safientMain.retrieveSafeFunds(safeIdOnThreadDB)).to.be.rejectedWith(Error);

      sc = new SafientClaims(safeCreatorSigner, chainId);

      // SUCCESS : retrieve funds from a safe
      await sc.safientMain.retrieveSafeFunds(safeIdOnThreadDB);

      // FAILURE : no funds remaining in the safe
      await expect(sc.safientMain.retrieveSafeFunds(safeIdOnThreadDB)).to.be.rejectedWith(Error);
    });

    it('Should get the safe by its Safe Id', async () => {
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

      expect(claim.disputeId).to.equal(0);
      expect(claim.claimedBy).to.equal(beneficiaryAddress);
    });

    it('Should get all the claims on the contract', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      const claims = await sc.safientMain.getAllClaims();

      expect(claims.length).to.equal(1);
      expect(claims[0].disputeId).to.equal(0);
      expect(claims[0].claimedBy).to.equal(beneficiaryAddress);
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

    it('Should get the status of the claim on a safe', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      expect(await sc.safientMain.getClaimStatus(0)).to.equal(0);
    });

    it('Should give ruling on a claim', async () => {
      const sc = new SafientClaims(safientMainAdminSigner, chainId);

      const result = await sc.arbitrator.giveRulingCall(0, 1);

      expect(result).to.equal(true);
      expect(await sc.safientMain.getClaimStatus(0)).to.equal(1);
    });

    it('Should allow safe beneficiaries to create a safe (syncSafe)', async () => {
      const sc = new SafientClaims(beneficiarySigner, chainId);

      const arbitrationFee = await sc.arbitrator.getArbitrationFee(); // 0.001 ETH
      const guardianFee = 0.01; // 0.01 ETH

      // SUCCESS : create a safe
      await sc.safientMain.syncSafe(
        safeCreatorAddress, // 2nd account
        safeIdOnThreadDB,
        metaevidenceOrEvidenceURI,
        String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
      );

      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(2);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0.011);

      const safe = await sc.safientMain.getSafeBySafeId(safeIdOnThreadDB);

      expect(safe.safeBeneficiary).to.equal(beneficiaryAddress);
      expect(ethers.utils.formatEther(safe.safeFunds)).to.equal('0.011');
    });
  });
});
