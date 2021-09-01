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
  const safeId1OnThreadDB = '123456789a',
    safeId2OnThreadDB = '123456789b',
    safeId3OnThreadDB = '123456789c';
  let provider, chainId;
  let safientMainAdminSigner,
    safeCreatorSigner,
    beneficiarySigner,
    accountXSigner,
    safeCreatorAddress,
    beneficiaryAddress;

  const ClaimType = {
    SignalBased: 0,
    ArbitrationBased: 1,
  };

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
        safeId1OnThreadDB,
        ClaimType.ArbitrationBased,
        0, // 0 seconds because opting ArbitrationBased
        metaevidenceOrEvidenceURI,
        String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
      );

      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(1);
      expect(await sc.safientMain.getContractBalance()).to.equal(0.011);

      const safe = await sc.safientMain.getSafeBySafeId(safeId1OnThreadDB);
      expect(safe.beneficiary).to.equal(beneficiaryAddress);
      expect(ethers.utils.formatEther(safe.funds)).to.equal('0.011');
      expect(Number(safe.signalingPeriod)).to.equal(0); // 0 seconds
      expect(Number(safe.endSignalTime)).to.equal(0);
      expect(Number(safe.latestSignalTime)).to.equal(0);
      expect(Number(safe.claimType)).to.equal(1); // ArbitrationBased

      // FAILURE : ID of the safe on threadDB is not passed
      await expect(
        sc.safientMain.createSafe(
          beneficiaryAddress,
          '',
          ClaimType.ArbitrationBased,
          0,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : beneficiary is an zero address
      await expect(
        sc.safientMain.createSafe(
          '0x0',
          safeId1OnThreadDB,
          ClaimType.ArbitrationBased,
          0,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : safe creator and beneficiary are same
      await expect(
        sc.safientMain.createSafe(
          safeCreatorAddress,
          safeId1OnThreadDB,
          ClaimType.ArbitrationBased,
          0, // 0 seconds (6 * 0) because opting ArbitrationBased
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);
    });

    it('Should allow safe beneficiaries to create a safe (syncSafe)', async () => {
      const sc = new SafientClaims(beneficiarySigner, chainId);

      // SUCCESS : create a safe(for claimType - SignalBased & signal - won't signal)
      await sc.safientMain.syncSafe(
        safeCreatorAddress, // 2nd account
        safeId2OnThreadDB,
        ClaimType.SignalBased,
        6, // 6 seconds because opting SignalBased
        '', // no metaevidence because SignalBased
        '' // no safe maintenence fee because SignalBased
      );

      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(2);
      expect(await sc.safientMain.getContractBalance()).to.equal(0.011);

      const safe = await sc.safientMain.getSafeBySafeId(safeId2OnThreadDB);
      expect(safe.createdBy).to.equal(safeCreatorAddress);
      expect(safe.beneficiary).to.equal(beneficiaryAddress);
      expect(Number(safe.signalingPeriod)).to.equal(6); // 6 seconds
      expect(Number(safe.endSignalTime)).to.equal(0);
      expect(Number(safe.latestSignalTime)).to.equal(0);
      expect(Number(safe.claimType)).to.equal(0); // SignalBased

      // SUCCESS : create another safe with safeId3(for claimType - SignalBased & signal - will signal)
      const sc2 = new SafientClaims(safeCreatorSigner, chainId);
      await sc2.safientMain.createSafe(
        beneficiaryAddress, // 2nd account
        safeId3OnThreadDB,
        ClaimType.SignalBased,
        6,
        '',
        ''
      );
    });

    it('Should allow beneficiaries to create a claim (ArbitrationBased)', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : only beneficiary of the safe can create the claim
      await expect(sc.safientMain.createClaim(safeId1OnThreadDB, metaevidenceOrEvidenceURI)).to.be.rejectedWith(Error);

      sc = new SafientClaims(beneficiarySigner, chainId);

      // FAILURE : safe does not exist
      await expect(sc.safientMain.createClaim('123', metaevidenceOrEvidenceURI)).to.be.rejectedWith(Error);

      // SUCCESS : create a claim (ArbitrationBased) on safeId1
      await sc.safientMain.createClaim(safeId1OnThreadDB, metaevidenceOrEvidenceURI);

      expect(await sc.safientMain.getTotalNumberOfClaims()).to.equal(1);
      expect(await sc.safientMain.getContractBalance()).to.equal(0.01);

      const claim1 = await sc.safientMain.getClaimByClaimId(0);
      expect(claim1.id).to.equal(0);
      expect(claim1.claimedBy).to.equal(beneficiaryAddress);
    });

    it('Should allow beneficiaries to create a claim (SignalBased)', async () => {
      const sc = new SafientClaims(beneficiarySigner, chainId);

      // SUCCESS : create claim on safeId2
      await sc.safientMain.createClaim(safeId2OnThreadDB, '');
      const safeWithSafeId2 = await sc.safientMain.getSafeBySafeId(safeId2OnThreadDB);
      expect(safeWithSafeId2.claimsCount).to.equal(1);
      const claimOnSafeId2 = await sc.safientMain.getClaimByClaimId(2);
      expect(claimOnSafeId2.id).to.equal(2);
      expect(claimOnSafeId2.claimedBy).to.equal(beneficiaryAddress);

      // SUCCESS : create claim on safeId3
      await sc.safientMain.createClaim(safeId3OnThreadDB, '');
      const safeWithSafeId3 = await sc.safientMain.getSafeBySafeId(safeId3OnThreadDB);
      expect(safeWithSafeId3.claimsCount).to.equal(1);
      const claimOnSafeId3 = await sc.safientMain.getClaimByClaimId(3);
      expect(claimOnSafeId3.id).to.equal(3);
      expect(claimOnSafeId3.claimedBy).to.equal(beneficiaryAddress);
    });

    it('Should allow safe creator to SIGNAL when the safe is claimed', async () => {
      const sc = new SafientClaims(safeCreatorSigner, chainId);

      // SUCCESS: Signal safeId3 - results in a failed claim
      await sc.safientMain.sendSignal(safeId3OnThreadDB);

      const safeWithSafeId3 = await sc.safientMain.getSafeBySafeId(safeId3OnThreadDB);
      expect(Number(safeWithSafeId3.latestSignalTime)).greaterThan(0);

      // mine a new block after 6 seconds
      const mineNewBlock = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(provider.send('evm_mine'));
        }, 7000);
      });
      const result = await mineNewBlock;

      // check claim status (ArbitrationBased & SignalBased)
      const safeId1ClaimResult = await sc.safientMain.getClaimStatus(safeId1OnThreadDB, 0);
      expect(safeId1ClaimResult).to.equal(0); // claim is Active (Kleros has not given a ruling yet)

      const safeId2ClaimResult = await sc.safientMain.getClaimStatus(safeId2OnThreadDB, 2);
      expect(safeId2ClaimResult).to.equal(1); // claim is Passed (safe creator didn't signal)

      const safeId3ClaimResult = await sc.safientMain.getClaimStatus(safeId3OnThreadDB, 3);
      expect(safeId3ClaimResult).to.equal(2); // claim is Failed (safe creator gave a signal)
    });

    it('Should give ruling on a claim', async () => {
      const sc = new SafientClaims(safientMainAdminSigner, chainId);

      const result = await sc.arbitrator.giveRulingCall(0, 1);
      expect(result).to.equal(true);

      const safeId1ClaimResult = await sc.safientMain.getClaimStatus(safeId1OnThreadDB, 0);
      expect(safeId1ClaimResult).to.equal(1); // claim is Passed (Kleros has given a ruling)
    });

    it('Should allow users to deposit funds in a safe', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      // SUCCESS : deposit funds in a safe
      await sc.safientMain.depositFunds(safeId1OnThreadDB, String(ethers.utils.parseEther('2')));

      expect(await sc.safientMain.getContractBalance()).to.equal(2.01);
    });

    it('Should allow current owner of the to withdraw funds in the safe', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId);

      // FAILURE : only safe owner can withdraw the funds
      await expect(sc.safientMain.withdrawFunds(safeId1OnThreadDB)).to.be.rejectedWith(Error);

      sc = new SafientClaims(safeCreatorSigner, chainId);

      // SUCCESS : withdraw funds from a safe
      await sc.safientMain.withdrawFunds(safeId1OnThreadDB);

      expect(await sc.safientMain.getContractBalance()).to.equal(0);

      // FAILURE : no funds remaining in the safe
      await expect(sc.safientMain.withdrawFunds(safeId1OnThreadDB)).to.be.rejectedWith(Error);
    });

    it('Should get the safe by its Safe Id', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      const safe = await sc.safientMain.getSafeBySafeId(safeId1OnThreadDB);

      expect(safe.id).to.equal(safeId1OnThreadDB);
      expect(safe.createdBy).to.equal(safeCreatorAddress);
      expect(safe.claimsCount).to.equal(1);
      expect(safe.funds).to.equal(0);
    });

    it('Should get the claim by its Claim Id', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);

      const claim = await sc.safientMain.getClaimByClaimId(3);

      expect(claim.id).to.equal(3);
      expect(claim.claimedBy).to.equal(beneficiaryAddress);
      expect(claim.claimType).to.equal(0);
    });

    it('Should get the total number of safes on the contract', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(3);
    });

    it('Should get the total number of claims on the contract', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      expect(await sc.safientMain.getTotalNumberOfClaims()).to.equal(3);
    });

    it('Should get the SafientMain contract balance', async () => {
      const sc = new SafientClaims(accountXSigner, chainId);
      expect(await sc.safientMain.getContractBalance()).to.equal(0);
    });
  });
});
