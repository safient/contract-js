const { ethers } = require('hardhat');
const { use, expect } = require('chai');
const { solidity } = require('ethereum-waffle');

use(solidity);

describe('SafientMain', async () => {
  let autoAppealableArbitrator, claims, safientMain, safientMainAdminAndArbitrator, safeCreator, beneficiary, accountX;
  const safeId1 = '01234567890'; // ArbitrationBased claim
  const safeId2 = '01234567891'; // SignalBased claim (owner won't signal)
  const safeId3 = '01234567892'; // SignalBased claim (owner will signal)

  const ClaimType = {
    SignalBased: 0,
    ArbitrationBased: 1,
  };

  describe('SafientMain Contract Test Flow', async () => {
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
        0, // 0 seconds (6 * 0) because opting ArbitrationBased
        'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/',
        {
          value: arbitrationFee.toNumber() + ethers.utils.parseEther('0.001').toNumber(),
        }
      );

      expect(await safientMain.safesCount()).to.equal(1);
      expect(await safientMain.getSafientMainContractBalance()).to.equal(ethers.utils.parseEther('0.002')); // 0.002 eth

      const safe = await safientMain.safes(safeId1);
      expect(safe.createdBy).to.equal(safeCreator.address);
      expect(safe.beneficiary).to.equal(beneficiary.address);
      expect(safe.funds).to.equal(ethers.utils.parseEther('0.002')); // 0.002 eth
      expect(Number(safe.signalingPeriod)).to.equal(0); // 0 seconds
      expect(Number(safe.endSignalTime)).to.equal(0);
      expect(Number(safe.latestSignalTime)).to.equal(0);
      expect(Number(safe.claimType)).to.equal(1); // ArbitrationBased

      // FAILURE : beneficiary is an zero address
      await expect(
        safientMain
          .connect(safeCreator)
          .createSafe(
            '0x0000000000000000000000000000000000000000',
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
        1, // 6 seconds (6 * 1) because opting SignalBased
        '' // no metaevidence because SignalBased
      );

      expect(await safientMain.safesCount()).to.equal(2);

      const safe = await safientMain.safes(safeId2);
      expect(safe.createdBy).to.equal(safeCreator.address);
      expect(safe.beneficiary).to.equal(beneficiary.address);
      expect(Number(safe.signalingPeriod)).to.equal(1); // 6 seconds
      expect(Number(safe.endSignalTime)).to.equal(0);
      expect(Number(safe.latestSignalTime)).to.equal(0);
      expect(Number(safe.claimType)).to.equal(0); // SignalBased

      // FAILURE : beneficiary is an zero address
      await expect(
        safientMain.connect(beneficiary).syncSafe('0x0000000000000000000000000000000000000000', safeId2, ClaimType.SignalBased, 1, '')
      ).to.be.revertedWith('Should provide an creator for the safe');

      // FAILURE : safe creator and beneficiary are same
      await expect(
        safientMain.connect(beneficiary).syncSafe(beneficiary.address, safeId2, ClaimType.SignalBased, 1, '')
      ).to.be.revertedWith('Safe should be synced by the beneficiary of the safe');

      // SUCCESS : create another safe with safeId3(for claimType - SignalBased & signal - will signal)
      await safientMain.connect(safeCreator).createSafe(beneficiary.address, safeId3, ClaimType.SignalBased, 1, '');
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

      expect(await safientMain.getSafientMainContractBalance()).to.equal(ethers.utils.parseEther('0.001')); // 0.003 eth

      let safe;
      safe = await safientMain.safes(safeId1);
      expect(safe.funds).to.equal(ethers.utils.parseEther('0.001')); // 0.001 eth
      expect(safe.claimsCount).to.equal(1);

      const claim1 = await safientMain.claims(0);
      expect(claim1.disputeId).to.equal(0);
      expect(claim1.claimedBy).to.equal(beneficiary.address);

      // SUCCESS : create 2nd claim (ArbitrationBased) on the same safeId1
      await safientMain.connect(beneficiary).createClaim(
        safeId1,
        'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/' // evidence
      );

      expect(await safientMain.getSafientMainContractBalance()).to.equal(0); // 0 eth

      safe = await safientMain.safes(safeId1);
      expect(safe.funds).to.equal(0); // 0 eth
      expect(safe.claimsCount).to.equal(2);

      const claim2 = await safientMain.claims(1);
      expect(claim2.disputeId).to.equal(1);
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
      expect(claim2.disputeId).to.equal(3);
      expect(claim2.claimedBy).to.equal(beneficiary.address);

      // SUCCESS : create claim on safeId3
      await safientMain.connect(beneficiary).createClaim(safeId3, '');
      const safe3 = await safientMain.safes(safeId3);
      expect(safe3.claimsCount).to.equal(1);
      const claim3 = await safientMain.claims(4);
      expect(claim3.disputeId).to.equal(4);
      expect(claim3.claimedBy).to.equal(beneficiary.address);
    });

    it('Should allow safe creator to SIGNAL when the safe is claimed', async () => {
      // SUCCESS: Signal safeId3 - results in a failed claim
      await safientMain.connect(safeCreator).sendSignal(safeId3);

      const safe3 = await safientMain.safes(safeId3);
      expect(Number(safe3.latestSignalTime)).greaterThan(0);

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

      const claim1 = await safientMain.claims(0);

      const safeId1Claim1Result1 = await safientMain.connect(accountX).getClaimStatus(safeId1, 0);
      expect(safeId1Claim1Result1).to.equal(2); // claim is Failed (Kleros has failed the claim)

      // SUCCESS : give a ruling to claim2
      await autoAppealableArbitrator.connect(safientMainAdminAndArbitrator).giveRuling(1, 0);

      const claim2 = await safientMain.claims(1);

      const safeId1Claim2Result1 = await safientMain.connect(accountX).getClaimStatus(safeId1, 1);
      expect(safeId1Claim2Result1).to.equal(3); // claim is Refused (Kleros has refused the claim)
    });

    it('Should allow users to deposit funds in a safe', async () => {
      // FAILURE : safe does not exist
      await expect(
        safientMain.connect(accountX).depositSafeFunds('123', { value: ethers.utils.parseEther('2') }) // 2 eth
      ).to.be.revertedWith('Safe does not exist');

      // SUCCESS : deposit funds in a safe
      await safientMain.connect(accountX).depositSafeFunds(safeId1, { value: ethers.utils.parseEther('2') }); // 2 eth

      const safe = await safientMain.safes(safeId1);
      expect(safe.funds).to.equal(ethers.utils.parseEther('2')); // 2 eth
      expect(await safientMain.getSafientMainContractBalance()).to.equal(ethers.utils.parseEther('2')); // 2.002 eth
    });

    it('Should allow current owner of the to retrieve funds in the safe', async () => {
      // FAILURE : safe does not exist
      await expect(safientMain.connect(safeCreator).retrieveSafeFunds('123')).to.be.revertedWith('Safe does not exist');

      // FAILURE : only safe owner can retrieve the funds
      await expect(safientMain.connect(accountX).retrieveSafeFunds(safeId1)).to.be.revertedWith(
        'Only safe owner can retrieve the deposit balance'
      );

      // SUCCESS : retrieve funds from a safe
      await safientMain.connect(safeCreator).retrieveSafeFunds(safeId1);

      expect(await safientMain.getSafientMainContractBalance()).to.equal(0); // 0 eth

      // FAILURE : no funds remaining in the safe
      await expect(safientMain.connect(safeCreator).retrieveSafeFunds(safeId1)).to.be.revertedWith(
        'No funds remaining in the safe'
      );
    });
  });
});
