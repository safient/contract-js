const { ethers } = require('hardhat');
const { use, expect } = require('chai');
const { solidity } = require('ethereum-waffle');

use(solidity);

describe('SafientMain', async () => {
  let autoAppealableArbitrator, safientMain, safientMainAdminAndArbitrator, safeCreator, beneficiary, accountX;
  const safeId1 = '01234567890'; // ArbitrationBased claim
  const safeId2 = '01234567891'; // SignalBased claim (owner won't signal)
  const safeId3 = '01234567892'; // SignalBased claim (owner will signal)
  const safeId4 = '01234567893'; // DDayBased claim
  const safeId5 = '01234567894'; // DDayBased claim
  const safeId6 = '01234567895'; // Expirion claim
  const safeId7 = '01234567896'; // Expirion claim (expired)
  const safeId8 = '01234567897'; // create safe and update all possible in the safe
  const safeId9 = '01234567898'; // create safe with signal and update to dday in the safe and do a claim 
  const safeId10 = '01234567899'; // create safe with dday and update to eday in the safe and do a claim 

  const ClaimType = {
    SignalBased: 0,
    ArbitrationBased: 1,
    DDayBased: 2,
    EExpirion: 3
  };

  describe('SafientMain Test Flow', async () => {

    it('Should deploy SafientMain', async () => {
      [safientMainAdminAndArbitrator, safeCreator, beneficiary, accountX] = await ethers.getSigners();

      const AutoAppealableArbitrator = await ethers.getContractFactory('AutoAppealableArbitrator');
      autoAppealableArbitrator = await AutoAppealableArbitrator.deploy(ethers.utils.parseEther('0.001'));
      await autoAppealableArbitrator.deployed();

      const SafientMain = await ethers.getContractFactory('SafientMain');
      safientMain = await SafientMain.deploy(autoAppealableArbitrator.address);
      await safientMain.deployed();

      expect(await safientMain.arbitrator()).to.equal(autoAppealableArbitrator.address);
      expect(await autoAppealableArbitrator.arbitrationCost(123)).to.equal(ethers.utils.parseEther('0.001'));
    });

    it('Should allow safe creators to create a safe', async () => {
      const arbitrationFee = await autoAppealableArbitrator.arbitrationCost(123); // 0.001 eth

      // SUCCESS : create a safe
      await safientMain.connect(safeCreator).createSafe(
        beneficiary.address,
        safeId1,
        ClaimType.ArbitrationBased,
        0,
        'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/',
        {
          value: arbitrationFee.toNumber() + ethers.utils.parseEther('0.001').toNumber(),
        }
      );

      expect(await safientMain.safesCount()).to.equal(1);
      expect(await safientMain.getBalance()).to.equal(ethers.utils.parseEther('0.002')); // 0.002 eth

      const safe = await safientMain.safes(safeId1);
      expect(safe.createdBy).to.equal(safeCreator.address);
      expect(safe.beneficiary).to.equal(beneficiary.address);
      expect(safe.funds).to.equal(ethers.utils.parseEther('0.002')); // 0.002 eth
      expect(Number(safe.claimPeriod)).to.equal(0); // 0 seconds
      expect(Number(safe.claimType)).to.equal(1); // ArbitrationBased

      // FAILURE : beneficiary is an zero address
      await expect(safientMain.connect(safeCreator).createSafe('0x0000000000000000000000000000000000000000',
        safeId1,
        ClaimType.ArbitrationBased,
        0,
        'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/',
        {
          value: arbitrationFee.toNumber(),
        }
      )
      ).to.be.revertedWith('Should provide an beneficiary for the safe');

      // FAILURE : safe creator and beneficiary are same
      await expect(
        safientMain
          .connect(safeCreator)
          .createSafe(
            safeCreator.address,
            safeId1,
            ClaimType.ArbitrationBased,
            0,
            'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/',
            {
              value: arbitrationFee.toNumber(),
            }
          )
      ).to.be.revertedWith('Safe creator should not be the beneficiary of the safe');
    });

    it('Should allow safe beneficiaries to create a safe (syncSafe)', async () => {
      // SUCCESS : create a safe(for claimType - SignalBased & signal - won't signal)
      await safientMain.connect(beneficiary).syncSafe(
        safeCreator.address,
        safeId2,
        ClaimType.SignalBased,
        6, // 6 seconds because opting SignalBased
        '' // no metaevidence because SignalBased
      );

      expect(await safientMain.safesCount()).to.equal(2);

      const safe = await safientMain.safes(safeId2);
      expect(safe.createdBy).to.equal(safeCreator.address);
      expect(safe.beneficiary).to.equal(beneficiary.address);
      expect(Number(safe.claimPeriod)).to.equal(6); // 6 seconds
      expect(Number(safe.claimType)).to.equal(0); // SignalBased

      // FAILURE : beneficiary is an zero address
      await expect(
        safientMain
          .connect(beneficiary)
          .syncSafe('0x0000000000000000000000000000000000000000', safeId2, ClaimType.SignalBased, 1, '')
      ).to.be.revertedWith('Should provide an creator for the safe');

      // FAILURE : safe creator and beneficiary are same
      await expect(
        safientMain.connect(beneficiary).syncSafe(beneficiary.address, safeId2, ClaimType.SignalBased, 1, '')
      ).to.be.revertedWith('Safe should be synced by the beneficiary of the safe');

      // SUCCESS : create another safe with safeId3(for claimType - SignalBased & signal - will signal)
      await safientMain.connect(safeCreator).createSafe(beneficiary.address, safeId3, ClaimType.SignalBased, 6, '');
    });

    it('Should allow beneficiaries to create a claim (ArbitrationBased)', async () => {
      // FAILURE : safe does not exist
      await expect(
        safientMain
          .connect(beneficiary)
          .createClaim(
            '123',
            'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/'
          )
      ).to.be.revertedWith('Safe does not exist');

      // FAILURE : only beneficiary of the safe can create the claim
      await expect(
        safientMain
          .connect(accountX)
          .createClaim(
            safeId1,
            'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/'
          )
      ).to.be.revertedWith('Only beneficiary of the safe can create the claim');

      // SUCCESS : create a claim (ArbitrationBased) on safeId1
      await safientMain.connect(beneficiary).createClaim(
        safeId1,
        'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/' // evidence
      );

      expect(await safientMain.getBalance()).to.equal(ethers.utils.parseEther('0.001')); // 0.003 eth

      let safe;
      safe = await safientMain.safes(safeId1);
      expect(safe.funds).to.equal(ethers.utils.parseEther('0.001')); // 0.001 eth
      expect(safe.claimsCount).to.equal(1);

      const claim1 = await safientMain.claims(0);
      expect(claim1.id).to.equal(0);
      expect(claim1.claimedBy).to.equal(beneficiary.address);

      // SUCCESS : create 2nd claim (ArbitrationBased) on the same safeId1
      await safientMain.connect(beneficiary).createClaim(
        safeId1,
        'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/' // evidence
      );

      expect(await safientMain.getBalance()).to.equal(0); // 0 eth

      safe = await safientMain.safes(safeId1);
      expect(safe.funds).to.equal(0); // 0 eth
      expect(safe.claimsCount).to.equal(2);

      const claim2 = await safientMain.claims(1);
      expect(claim2.id).to.equal(1);
      expect(claim2.claimedBy).to.equal(beneficiary.address);

      // FAILURE : insufficient funds in the safe to pay the arbitration fee
      await expect(
        safientMain
          .connect(beneficiary)
          .createClaim(
            safeId1,
            'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/'
          )
      ).to.be.reverted;
    });

    it('Should allow beneficiaries to create a claim (SignalBased)', async () => {
      // SUCCESS : create claim on safeId2
      await safientMain.connect(beneficiary).createClaim(safeId2, '');
      const safe2 = await safientMain.safes(safeId2);
      expect(safe2.claimsCount).to.equal(1);
      const claim2 = await safientMain.claims(3);
      expect(claim2.id).to.equal(3);
      expect(claim2.claimedBy).to.equal(beneficiary.address);
      // SUCCESS : create claim on safeId3
      await safientMain.connect(beneficiary).createClaim(safeId3, '');
      const safe3 = await safientMain.safes(safeId3);
      expect(safe3.claimsCount).to.equal(1);
      const claim3 = await safientMain.claims(4);
      expect(claim3.id).to.equal(4);
      expect(claim3.claimedBy).to.equal(beneficiary.address);
    });

    it('Should allow safe creator to SIGNAL when the safe is claimed', async () => {
      // SUCCESS: Signal safeId3 - results in a failed claim
      await safientMain.connect(safeCreator).updateSafe(safeId3, ClaimType.SignalBased, 0, 1, false);

      // mine a new block after 6 seconds
      const mineNewBlock = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(ethers.provider.send('evm_mine'));
        }, 7000);
      });
      const result = await mineNewBlock;

      // check claim status (ArbitrationBased & SignalBased)
      const safeId1ClaimResult = await safientMain.connect(accountX).getClaimStatus(safeId1, 0);
      expect(safeId1ClaimResult).to.equal(0); // claim is Active (Kleros has not given a ruling yet)

      const safeId2ClaimResult = await safientMain.connect(accountX).getClaimStatus(safeId2, 3);
      expect(safeId2ClaimResult).to.equal(1); // claim is Passed (safe creator didn't signal)

      const safeId3ClaimResult = await safientMain.connect(accountX).getClaimStatus(safeId3, 4);
      expect(safeId3ClaimResult).to.equal(2); // claim is Failed (safe creator gave a signal)

      // create another claim (SignalBased) on safeId3
      await safientMain.connect(beneficiary).createClaim(safeId3, '');
      // creator won't signal safeId3 this time...
      // mine a new block after 6 seconds
      const mineNewBlock2 = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(ethers.provider.send('evm_mine'));
        }, 7000);
      });
      const result2 = await mineNewBlock2;
      // check claim status of safeId3
      const safeId3ClaimResult2 = await safientMain.connect(accountX).getClaimStatus(safeId3, 4);
      expect(safeId3ClaimResult2).to.equal(1); // claim is Passed (safe creator gave a signal)
    });

    it('Should allow arbitrator to give ruling on a claim', async () => {
      // FAILURE : invalid ruling (only 2 options are available, but giving 3rd option as a ruling is invalid) - as per autoAppealableArbitrator
      await expect(autoAppealableArbitrator.connect(safientMainAdminAndArbitrator).giveRuling(0, 3)).to.be.revertedWith(
        'Invalid ruling'
      );

      // FAILURE : can only be called by the owner - as per autoAppealableArbitrator
      await expect(autoAppealableArbitrator.connect(accountX).giveRuling(0, 2)).to.be.revertedWith(
        'Can only be called by the owner'
      );

      // SUCCESS : give a ruling to claim1
      await autoAppealableArbitrator.connect(safientMainAdminAndArbitrator).giveRuling(0, 2);


      const safeId1Claim1Result1 = await safientMain.connect(accountX).getClaimStatus(safeId1, 0);
      expect(safeId1Claim1Result1).to.equal(2); // claim is Failed (Kleros has failed the claim)

      // SUCCESS : give a ruling to claim2
      await autoAppealableArbitrator.connect(safientMainAdminAndArbitrator).giveRuling(1, 0);

      const safeId1Claim2Result1 = await safientMain.connect(accountX).getClaimStatus(safeId1, 1);
      expect(safeId1Claim2Result1).to.equal(3); // claim is Refused (Kleros has refused the claim)
    });

    it('Should allow users to deposit funds in a safe', async () => {
      // FAILURE : safe does not exist
      await expect(
        safientMain.connect(accountX).depositFunds('123', { value: ethers.utils.parseEther('2') }) // 2 eth
      ).to.be.revertedWith('Safe does not exist');

      // SUCCESS : deposit funds in a safe
      await safientMain.connect(accountX).depositFunds(safeId1, { value: ethers.utils.parseEther('2') }); // 2 eth

      const safe = await safientMain.safes(safeId1);
      expect(safe.funds).to.equal(ethers.utils.parseEther('2')); // 2 eth
      expect(await safientMain.getBalance()).to.equal(ethers.utils.parseEther('2')); // 2.002 eth
    });

    it('Should allow current owner to withdraw funds in the safe', async () => {
      // FAILURE : safe does not exist
      await expect(safientMain.connect(safeCreator).withdrawFunds('123')).to.be.revertedWith('Safe does not exist');

      // FAILURE : only safe owner can withdraw the funds
      await expect(safientMain.connect(accountX).withdrawFunds(safeId1)).to.be.revertedWith(
        'Only safe owner can withdraw the deposit balance'
      );

      // SUCCESS : withdraw funds from a safe
      await safientMain.connect(safeCreator).withdrawFunds(safeId1);

      expect(await safientMain.getBalance()).to.equal(0); // 0 eth

      // FAILURE : no funds remaining in the safe
      await expect(safientMain.connect(safeCreator).withdrawFunds(safeId1)).to.be.revertedWith(
        'No funds remaining in the safe'
      );
    });

    it('Should allow beneficiaries to create a claim (D-Day based)', async () => {
      const latestBlockNumber = await ethers.provider.getBlockNumber();
      const latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      const now = latestBlock.timestamp;

      // create a safe(for claimType - DDayBased)
      await safientMain.connect(safeCreator).createSafe(
        beneficiary.address,
        safeId4,
        ClaimType.DDayBased,
        now + 6, // D day - 6 seconds
        ''
      );

      // create a claim - before D-Day (claim should fail)
      await expect(safientMain.connect(beneficiary).createClaim(safeId4, '')).to.be.revertedWith('Cannot create claim before DDay');

      // mine a new block after 6 seconds
      const mineNewBlock = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(ethers.provider.send('evm_mine'));
        }, 7000);
      });
      const result = await mineNewBlock;

      // create a claim - before D-Day (claim should pass)
      const tx2 = await safientMain.connect(beneficiary).createClaim(safeId4, '');
      const txReceipt2 = await tx2.wait();
      const claimId2 = txReceipt2.events[0].args[1];
      const claimID2 = parseInt(claimId2._hex);

      // check claim status (DDayBased)
      const safeId4ClaimResult2 = await safientMain.connect(accountX).getClaimStatus(safeId4, claimID2);
      expect(safeId4ClaimResult2).to.equal(1); // claim got Passed (after D-Day)

      // FAILURE : safe does not exist
      await expect(safientMain.connect(beneficiary).createClaim('1234', '')).to.be.revertedWith('Safe does not exist');

      // FAILURE : only beneficiary of the safe can create the claim
      await expect(safientMain.connect(accountX).createClaim(safeId4, '')).to.be.revertedWith(
        'Only beneficiary of the safe can create the claim'
      );
    });

    it('Should allow safe current owner to update the D-Day', async () => {
      let latestBlockNumber, latestBlock, now;

      latestBlockNumber = await ethers.provider.getBlockNumber();
      latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      now = latestBlock.timestamp;

      // create a safe(for claimType - DDayBased)
      await safientMain.connect(safeCreator).createSafe(
        beneficiary.address,
        safeId5,
        ClaimType.DDayBased,
        now + 6, // D day - 6 seconds
        ''
      );

      // create a claim - before D-Day (6 seconds) (claim should fail)
      await expect(safientMain.connect(beneficiary).createClaim(safeId5, '')).to.be.revertedWith('Cannot create claim before DDay');

      latestBlockNumber = await ethers.provider.getBlockNumber();
      latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      now = latestBlock.timestamp;

      // Update the D-Day - 12 seconds
      await safientMain.connect(safeCreator).updateSafe(safeId5, ClaimType.DDayBased, now + 12, 0, false); // update the D-Day to 12 seconds from the time of updating

      // mine a new block after 8 seconds
      const mineNewBlock1 = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(ethers.provider.send('evm_mine'));
        }, 8000);
      });
      const result1 = await mineNewBlock1;

      // create a claim - before D-Day (12 seconds) (claim should fail)
      await expect(safientMain.connect(beneficiary).createClaim(safeId5, '')).to.be.revertedWith('Cannot create claim before DDay');

      // mine a new block after 4 seconds
      const mineNewBlock2 = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(ethers.provider.send('evm_mine'));
        }, 4000);
      });
      const result2 = await mineNewBlock2;

      // create a claim - after D-Day (10 + 2 = 12 seconds) (claim should pass)
      const tx3 = await safientMain.connect(beneficiary).createClaim(safeId5, '');
      const txReceipt3 = await tx3.wait();
      const claimId3 = txReceipt3.events[0].args[1];
      const claimID3 = parseInt(claimId3._hex);

      // check claim status (DDayBased)
      const safeId5ClaimResult3 = await safientMain.connect(accountX).getClaimStatus(safeId5, claimID3);
      expect(safeId5ClaimResult3).to.equal(1); // claim got Passed (after D-Day)
    });

    it('Should allow beneficiaries to create a Expirion (Expiry Date based)', async () => {
      const latestBlockNumber = await ethers.provider.getBlockNumber();
      const latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      const now = latestBlock.timestamp;

      // create a safe(for claimType - DDayBased)
      await safientMain.connect(safeCreator).createSafe(
        beneficiary.address,
        safeId6,
        ClaimType.EExpirion,
        now + 10, // Expiry day - 10 seconds
        ''
      );

      // create a claim - before Expiry Date (claim should pass)
      const tx2 = await safientMain.connect(beneficiary).createClaim(safeId6, '');
      const txReceipt2 = await tx2.wait();
      const claimId2 = txReceipt2.events[0].args[1];
      const claimID2 = parseInt(claimId2._hex);

      // mine a new block after 10 seconds
      const mineNewBlock = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(ethers.provider.send('evm_mine'));
        }, 10000);
      });
      const result = await mineNewBlock;

      // create a claim - after Expiry (claim should fail)
      await expect(safientMain.connect(beneficiary).createClaim(safeId6, '')).to.be.revertedWith('Safe has been expired');

      // check claim status (ExpirionBased)
      const safeId4ClaimResult2 = await safientMain.connect(accountX).getClaimStatus(safeId6, claimID2);
      expect(safeId4ClaimResult2).to.equal(1); // claim got Passed (after D-Day)

      // FAILURE : safe does not exist
      await expect(safientMain.connect(beneficiary).createClaim('1234', '')).to.be.revertedWith('Safe does not exist');

      // FAILURE : only beneficiary of the safe can create the claim
      await expect(safientMain.connect(accountX).createClaim(safeId6, '')).to.be.revertedWith(
        'Only beneficiary of the safe can create the claim'
      );
    });

    it('Should allow safe current owner to update before Expiry Date', async () => {
      let latestBlockNumber, latestBlock, now;

      latestBlockNumber = await ethers.provider.getBlockNumber();
      latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      now = latestBlock.timestamp;

      // create a safe(for claimType - DDayBased)
      await safientMain.connect(safeCreator).createSafe(
        beneficiary.address,
        safeId7,
        ClaimType.EExpirion,
        now + 10, // Expiry day - 10 seconds
        ''
      );

      latestBlockNumber = await ethers.provider.getBlockNumber();
      latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      now = latestBlock.timestamp;

      // Update the Expiry-Day - 20 seconds
      await safientMain.connect(safeCreator).updateSafe(safeId7, ClaimType.EExpirion, now + 20, 0, false); // update the Expiry to 20 seconds from the time of updating

      // create a claim - before Expiry-Day (20 seconds) (claim should pass)
      const tx3 = await safientMain.connect(beneficiary).createClaim(safeId7, '');
      const txReceipt3 = await tx3.wait();
      const claimId3 = txReceipt3.events[0].args[1];
      const claimID3 = parseInt(claimId3._hex);

      // check claim status (ExpirionBased)
      const safeId5ClaimResult3 = await safientMain.connect(accountX).getClaimStatus(safeId7, claimID3);
      expect(safeId5ClaimResult3).to.equal(1); // claim got Passed (before Expirion-Day)
    });

    it('Should allow beneficiaries to create a safe (SignalBased) and update to all claim types', async () => {
      // create a safe(for claimType - DDayBased)
      await safientMain.connect(safeCreator).createSafe(
        beneficiary.address,
        safeId8,
        ClaimType.SignalBased,
        6, // 6 seconds
        ''
      );
      // SUCCESS : create claim on safeId8
      const _safeId1 = await safientMain.safes(safeId8);
      expect(_safeId1.claimsCount).to.equal(0);
      // SUCCESS : create claim
      await safientMain.connect(beneficiary).createClaim(
        safeId8,
        '' // no metaevidence because SignalBased
      );
      expect(await safientMain.safesCount()).to.equal(8);
      // SUCCESS : update claimType to dday on safeId8
      latestBlockNumber = await ethers.provider.getBlockNumber();
      latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      now = latestBlock.timestamp;
      await safientMain.connect(safeCreator).updateSafe(safeId8, ClaimType.DDayBased, now + 10, 0, false); // update the DDay to 10 seconds from the time of updating
      const _safeId2 = await safientMain.safes(safeId8);
      expect(_safeId2.claimType).to.equal(ClaimType.DDayBased);
      // SUCCESS : update claimType to eday on safeId8
      latestBlockNumber = await ethers.provider.getBlockNumber();
      latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      now = latestBlock.timestamp;
      await safientMain.connect(safeCreator).updateSafe(safeId8, ClaimType.EExpirion, now + 10, 0, false); // update the DDay to 10 seconds from the time of updating
      const _safeId3 = await safientMain.safes(safeId8);
      expect(_safeId3.claimType).to.equal(ClaimType.EExpirion);
    });

    it('Should allow beneficiaries to create a safe (SignalBased) and do claim and do not update claim types', async () => {
      // create a safe(for claimType - SignalBased)
      await safientMain.connect(safeCreator).createSafe(
        beneficiary.address,
        safeId9,
        ClaimType.SignalBased,
        6, // 6 seconds
        ''
      );
      // SUCCESS : create claim on safeId8
      const _safeId1 = await safientMain.safes(safeId9);
      expect(_safeId1.claimsCount).to.equal(0);
      // SUCCESS : create claim
      await safientMain.connect(beneficiary).createClaim(
        safeId9,
        '' // no metaevidence because SignalBased
      );
      expect(await safientMain.safesCount()).to.equal(9);
      // SUCCESS : send signal
      await safientMain.connect(safeCreator).updateSafe(safeId9, ClaimType.SignalBased, 0, 1, false);
      const _safeId2 = await safientMain.safes(safeId9);
      expect(_safeId2.claimType).to.equal(ClaimType.SignalBased);
      // SUCCESS : update claimType to dday on safeId8
      latestBlockNumber = await ethers.provider.getBlockNumber();
      latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      now = latestBlock.timestamp;
      await expect(safientMain.connect(safeCreator).updateSafe(safeId9, ClaimType.DDayBased, now + 10, 0, false)).to.be.revertedWith('Safe is not claimed since safes endSignalTime is zero'); // update the DDay to 10 seconds from the time of updating
      const _safeId3 = await safientMain.safes(safeId9);
      expect(_safeId3.claimType).to.equal(ClaimType.SignalBased);
    });

    it('Should allow beneficiaries to create a safe (SignalBased) and make deprecated and do not allow to claim or send signal', async () => {
      // create a safe(for claimType - SignalBased)
      await safientMain.connect(safeCreator).createSafe(
        beneficiary.address,
        safeId10,
        ClaimType.SignalBased,
        6, // 6 seconds
        ''
      );
      // SUCCESS : create claim on safeId8
      const _safeId1 = await safientMain.safes(safeId10);
      expect(_safeId1.claimsCount).to.equal(0);
      // SUCCESS : create claim
      await safientMain.connect(beneficiary).createClaim(
        safeId10,
        '' // no metaevidence because SignalBased
      );
      expect(await safientMain.safesCount()).to.equal(10);
      // SUCCESS : send signal
      await safientMain.connect(safeCreator).updateSafe(safeId10, ClaimType.SignalBased, 0, 1, true);
      const _safeId2 = await safientMain.safes(safeId10);
      expect(_safeId2.claimType).to.equal(ClaimType.SignalBased);
      // SUCCESS : update claimType to dday on safeId10
      latestBlockNumber = await ethers.provider.getBlockNumber();
      latestBlock = await ethers.provider.getBlock(latestBlockNumber);
      now = latestBlock.timestamp;
      await expect(safientMain.connect(safeCreator).updateSafe(safeId10, ClaimType.DDayBased, now + 10, 0, false)).to.be.revertedWith('Safe has been deprecated'); // update the DDay to 10 seconds from the time of updating
      const _safeId3 = await safientMain.safes(safeId10);
      expect(_safeId3.claimType).to.equal(ClaimType.SignalBased);
    });
  });
});
