const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const chai = require('chai');

require('dotenv').config();

const expect = chai.expect;
chai.use(require('chai-as-promised'));

const metaevidenceOrEvidenceURI =
  'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/';

const { SafientMain, Arbitrator, Types } = require('../dist/index');

describe('safientMain', async () => {
  let safeId = [];
  let provider, chainId;
  let safientMainAdminSigner,
    safeCreatorSigner,
    beneficiarySigner,
    accountXSigner,
    safeCreatorAddress,
    beneficiaryAddress;
  let claimIdOfSafeId0, claimIdOfSafeId1, claimIdOfSafeId2;

  describe('Safient Claims Test Flow', async () => {
    before(async () => {
      // Random safe id's
      for (let i = 0; i < 5; i++) {
        safeId.push(Math.random().toString(36).substr(2, 5));
      }

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
      const safientMain = new SafientMain(safeCreatorSigner, chainId);
      const arbitrator = new Arbitrator(safeCreatorSigner, chainId);

      const arbitrationFee = await arbitrator.getArbitrationFee(); // 0.001 ETH
      const guardianFee = 0.01; // 0.01 ETH

      const beforeTotalNumberOfSafes = await safientMain.getTotalNumberOfSafes();
      const beforeContractBalance = await safientMain.getContractBalance();

      // SUCCESS : create a safe
      await safientMain.createSafe(
        beneficiaryAddress, // 2nd account
        safeId[0],
        Types.ClaimType.ArbitrationBased,
        0, // 0 seconds because opting ArbitrationBased
        0, // D day - 0 seconds
        metaevidenceOrEvidenceURI,
        String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
      );

      const afterContractBalance = await safientMain.getContractBalance();

      expect(afterContractBalance).to.equal(beforeContractBalance + 0.011);
      expect(await safientMain.getTotalNumberOfSafes()).to.equal(beforeTotalNumberOfSafes + 1);

      const safe = await safientMain.getSafeBySafeId(safeId[0]);
      expect(safe.beneficiary).to.equal(beneficiaryAddress);
      expect(ethers.utils.formatEther(safe.funds)).to.equal('0.011');
      expect(Number(safe.signalingPeriod)).to.equal(0); // 0 seconds
      expect(Number(safe.endSignalTime)).to.equal(0);
      expect(Number(safe.latestSignalTime)).to.equal(0);
      expect(Number(safe.claimType)).to.equal(1); // ArbitrationBased

      // FAILURE : ID of the safe on threadDB is not passed
      await expect(
        safientMain.createSafe(
          beneficiaryAddress,
          '',
          Types.ClaimType.ArbitrationBased,
          0,
          0,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : beneficiary is an zero address
      await expect(
        safientMain.createSafe(
          '0x0',
          safeId[0],
          Types.ClaimType.ArbitrationBased,
          0,
          0,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);

      // FAILURE : safe creator and beneficiary are same
      await expect(
        safientMain.createSafe(
          safeCreatorAddress,
          safeId[0],
          Types.ClaimType.ArbitrationBased,
          0, // 0 seconds
          0,
          metaevidenceOrEvidenceURI,
          String(ethers.utils.parseEther(String(arbitrationFee + guardianFee)))
        )
      ).to.be.rejectedWith(Error);
    });

    it('Should allow safe beneficiaries to create a safe (syncSafe)', async () => {
      const safientMain1 = new SafientMain(beneficiarySigner, chainId);

      const beforeTotalNumberOfSafes = await safientMain1.getTotalNumberOfSafes();
      // SUCCESS : create a safe(for claimType - SignalBased & signal - won't signal)
      await safientMain1.syncSafe(
        safeCreatorAddress, // 2nd account
        safeId[1],
        Types.ClaimType.SignalBased,
        10, // 6 seconds because opting SignalBased
        0,
        '', // no metaevidence because SignalBased
        '' // no safe maintenence fee because SignalBased
      );

      expect(await safientMain1.getTotalNumberOfSafes()).to.equal(beforeTotalNumberOfSafes + 1);

      const safe = await safientMain1.getSafeBySafeId(safeId[1]);
      expect(safe.createdBy).to.equal(safeCreatorAddress);
      expect(safe.beneficiary).to.equal(beneficiaryAddress);
      expect(Number(safe.signalingPeriod)).to.equal(10); // 6 seconds
      expect(Number(safe.endSignalTime)).to.equal(0);
      expect(Number(safe.latestSignalTime)).to.equal(0);
      expect(Number(safe.claimType)).to.equal(0); // SignalBased

      // SUCCESS : create another safe with safeId3 (for claimType - SignalBased & signal - will signal)
      const safientMain2 = new SafientMain(safeCreatorSigner, chainId);
      await safientMain2.createSafe(
        beneficiaryAddress, // 2nd account
        safeId[2],
        Types.ClaimType.SignalBased,
        10,
        0,
        '',
        ''
      );
    });

    it('Should allow beneficiaries to create a claim (ArbitrationBased)', async () => {
      let safientMain;
      safientMain = new SafientMain(accountXSigner, chainId);

      // FAILURE : only beneficiary of the safe can create the claim
      await expect(safientMain.createClaim(safeId[0], metaevidenceOrEvidenceURI)).to.be.rejectedWith(Error);

      safientMain = new SafientMain(beneficiarySigner, chainId);

      // FAILURE : safe does not exist
      await expect(safientMain.createClaim('123', metaevidenceOrEvidenceURI)).to.be.rejectedWith(Error);

      const beforeTotalNumberOfClaims = await safientMain.getTotalNumberOfClaims();

      // SUCCESS : create a claim (ArbitrationBased) on safeId1
      const tx = await safientMain.createClaim(safeId[0], metaevidenceOrEvidenceURI);
      const txReceipt = await tx.wait();
      claimIdOfSafeId0 = txReceipt.events[2].args[1];

      expect(await safientMain.getTotalNumberOfClaims()).to.equal(beforeTotalNumberOfClaims + 1);

      const claimOnSafeId0 = await safientMain.getClaimByClaimId(claimIdOfSafeId0);
      expect(claimOnSafeId0.claimedBy).to.equal(beneficiaryAddress);
      expect(claimOnSafeId0.status).to.equal(0);
    });

    it('Should allow beneficiaries to create a claim (SignalBased)', async () => {
      const safientMain = new SafientMain(beneficiarySigner, chainId);

      let tx, txReceipt;

      // SUCCESS : create claim on safeId2
      tx = await safientMain.createClaim(safeId[1], '');
      txReceipt = await tx.wait();
      claimIdOfSafeId1 = parseInt(txReceipt.events[0].args[1]._hex)

      const safeWithSafeId1 = await safientMain.getSafeBySafeId(safeId[1]);
      expect(safeWithSafeId1.claimsCount).to.equal(1);

      const claimOnSafeId1 = await safientMain.getClaimByClaimId(claimIdOfSafeId1);
      expect(claimOnSafeId1.claimedBy).to.equal(beneficiaryAddress);
      expect(claimOnSafeId1.status).to.equal(0);

      // SUCCESS : create claim on safeId3
      tx = await safientMain.createClaim(safeId[2], '');
      txReceipt = await tx.wait();
      claimIdOfSafeId2 = parseInt(txReceipt.events[0].args[1]._hex)
      const safeWithSafeId2 = await safientMain.getSafeBySafeId(safeId[2]);
      expect(safeWithSafeId2.claimsCount).to.equal(1);

      const claimOnSafeId2 = await safientMain.getClaimByClaimId(claimIdOfSafeId2);
      expect(claimOnSafeId2.claimedBy).to.equal(beneficiaryAddress);
      expect(claimOnSafeId2.status).to.equal(0);
    });

    it('Should allow safe creator to SIGNAL when the safe is claimed', async () => {
      const safientMain = new SafientMain(safeCreatorSigner, chainId);

      // SUCCESS: Signal safeId3 - results in a failed claim
      await safientMain.sendSignal(safeId[2]);

      const safeWithSafeId3 = await safientMain.getSafeBySafeId(safeId[2]);
      expect(Number(safeWithSafeId3.latestSignalTime)).greaterThan(0);

      // mine a new block after 6 seconds
      const mineNewBlock = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(provider.send('evm_mine'));
        }, 11000);
      });
      const result = await mineNewBlock;

      // check claim status (ArbitrationBased & SignalBased)
      const safeId1ClaimResult = await safientMain.getClaimStatus(safeId[0], claimIdOfSafeId0);
      expect(safeId1ClaimResult).to.equal(0); // claim is Active (Kleros has not given a ruling yet)

      const safeId2ClaimResult = await safientMain.getClaimStatus(safeId[1], claimIdOfSafeId1);
      expect(safeId2ClaimResult).to.equal(1); // claim is Passed (safe creator didn't signal)

      const safeId3ClaimResult = await safientMain.getClaimStatus(safeId[2], claimIdOfSafeId2);
      expect(safeId3ClaimResult).to.equal(2); // claim is Failed (safe creator gave a signal)
    });

    it('Should give ruling on a claim', async () => {
      const safientMain = new SafientMain(safientMainAdminSigner, chainId);
      const arbitrator = new Arbitrator(safientMainAdminSigner, chainId);

      await arbitrator.giveRulingCall(claimIdOfSafeId0, 1);

      const safeId1ClaimResult = await safientMain.getClaimStatus(safeId[0], claimIdOfSafeId0);
      expect(safeId1ClaimResult).to.equal(1); // claim is Passed (Kleros has given a ruling)
    });

    it('Should allow users to deposit funds in a safe', async () => {
      const safientMain = new SafientMain(accountXSigner, chainId);

      const beforeContractBalance = await safientMain.getContractBalance();

      // SUCCESS : deposit funds in a safe
      await safientMain.depositFunds(safeId[0], String(ethers.utils.parseEther('2')));

      const afterContractBalance = await safientMain.getContractBalance();

      expect(afterContractBalance).to.equal(beforeContractBalance + 2);
    });

    it('Should allow current owner of the to withdraw funds in the safe', async () => {
      let safientMain;
      safientMain = new SafientMain(accountXSigner, chainId);

      // FAILURE : only safe owner can withdraw the funds
      await expect(safientMain.withdrawFunds(safeId[0])).to.be.rejectedWith(Error);

      safientMain = new SafientMain(safeCreatorSigner, chainId);

      const beforeContractBalance = await safientMain.getContractBalance();

      const safeWithSafeId0 = await safientMain.getSafeBySafeId(safeId[0]);
      const funds = Number(ethers.utils.formatEther(safeWithSafeId0.funds));

      // SUCCESS : withdraw funds from a safe
      await safientMain.withdrawFunds(safeId[0]);

      const afterContractBalance = await safientMain.getContractBalance();

      expect(afterContractBalance).to.equal(beforeContractBalance - funds);

      // FAILURE : no funds remaining in the safe
      await expect(safientMain.withdrawFunds(safeId[0])).to.be.rejectedWith(Error);
    });

    it('Should get the safe by its Safe Id', async () => {
      const safientMain = new SafientMain(accountXSigner, chainId);

      const safe = await safientMain.getSafeBySafeId(safeId[0]);

      expect(safe.createdBy).to.equal(safeCreatorAddress);
      expect(safe.funds).to.equal(0);
    });

    it('Should get the claim by its Claim Id', async () => {
      const safientMain = new SafientMain(accountXSigner, chainId);

      const claim = await safientMain.getClaimByClaimId(claimIdOfSafeId0);

      expect(claim.claimedBy).to.equal(beneficiaryAddress);
      expect(claim.claimType).to.equal(1);
    });

    it('Should get the total number of safes on the contract', async () => {
      const safientMain = new SafientMain(accountXSigner, chainId);
      expect(await safientMain.getTotalNumberOfSafes()).to.greaterThan(0);
    });

    it('Should get the total number of claims on the contract', async () => {
      const safientMain = new SafientMain(accountXSigner, chainId);
      expect(await safientMain.getTotalNumberOfClaims()).to.greaterThan(0);
    });

    it('Should get the SafientMain contract balance', async () => {
      const safientMain = new SafientMain(accountXSigner, chainId);
      expect(await safientMain.getContractBalance()).to.equal(0);
    });

    it('Should allow beneficiaries to create a claim (D-Day based)', async () => {
      const safientMainCreator = new SafientMain(safeCreatorSigner, chainId);
      const safientMainBeneficiary = new SafientMain(beneficiarySigner, chainId);
      const safientMainAccountX = new SafientMain(accountXSigner, chainId);


      // SUCCESS : create another safe with safeId4 (for claimType - DDayBased) with DDay set to 6 seconds
      await safientMainCreator.createSafe(beneficiaryAddress, safeId[3], Types.ClaimType.DDayBased, 0, 6, '', '');

      // create a claim - before D-Day (claim should fail)
      await expect(safientMainBeneficiary.createClaim(safeId[3], '')).to.be.rejectedWith(Error);;

      // mine a new block after 6 seconds
      const mineNewBlock = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(provider.send('evm_mine'));
        }, 7000);
      });
      const result = await mineNewBlock;

      // create a claim - before D-Day (claim should pass)
      const tx2 = await safientMainBeneficiary.createClaim(safeId[3], '');
      const txReceipt2 = await tx2.wait();
      const claimId2 = txReceipt2.events[0].args[1];
      const claimID2 = parseInt(claimId2._hex);

      // check claim status (DDayBased)
      const safeId4ClaimResult2 = await safientMainAccountX.getClaimStatus(safeId[3], claimID2);
      expect(safeId4ClaimResult2).to.equal(1); // claim got Passed (after D-Day)
    });

    it('Should allow safe current owner to update the D-Day', async () => {
      let latestBlockNumber, latestBlock, now;

      const safientMainCreator = new SafientMain(safeCreatorSigner, chainId);
      const safientMainBeneficiary = new SafientMain(beneficiarySigner, chainId);
      const safientMainAccountX = new SafientMain(accountXSigner, chainId);

      latestBlockNumber = await ethers.provider.getBlockNumber();
      latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      now = latestBlock.timestamp;

      // SUCCESS : create another safe with safeId4 (for claimType - DDayBased) with DDay set to 6 seconds
      await safientMainCreator.createSafe(beneficiaryAddress, safeId[4], Types.ClaimType.DDayBased, 0, now + 6, '', '');

      // create a claim - before D-Day (6 seconds) (claim should fail)
      await expect(safientMainBeneficiary.createClaim(safeId[4], '')).to.be.rejectedWith(Error);;

      latestBlockNumber = await ethers.provider.getBlockNumber();
      latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      now = latestBlock.timestamp;

      // Update the D-Day - 12 seconds
      await safientMainCreator.updateDDay(safeId[4], now + 12); // update the D-Day to 12 seconds from the time of updating

      // mine a new block after 10 seconds
      const mineNewBlock1 = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(ethers.provider.send('evm_mine'));
        }, 8000);
      });
      const result1 = await mineNewBlock1;

      // create a claim - before D-Day (12 seconds) (claim should fail)
      await expect(safientMainBeneficiary.createClaim(safeId[4], '')).to.be.rejectedWith(Error);

      // mine a new block after 2 seconds
      const mineNewBlock2 = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(ethers.provider.send('evm_mine'));
        }, 4000);
      });
      const result2 = await mineNewBlock2;

      // create a claim - after D-Day (10 + 2 = 12 seconds) (claim should pass)
      const tx3 = await safientMainBeneficiary.createClaim(safeId[4], '');
      const txReceipt3 = await tx3.wait();
      const claimId3 = txReceipt3.events[0].args[1];
      const claimID3 = parseInt(claimId3._hex);

      // check claim status (DDayBased)
      const safeId4ClaimResult3 = await safientMainAccountX.getClaimStatus(safeId[4], claimID3);
      expect(safeId4ClaimResult3).to.equal(1); // claim got Passed (after D-Day)
    });
  });
});
