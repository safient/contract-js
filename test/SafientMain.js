const { ethers } = require('hardhat');
const { use, expect } = require('chai');
const { solidity } = require('ethereum-waffle');

use(solidity);

describe('SafientMain', async () => {
  let autoAppealableArbitrator, claims, safientMain, safientMainAdminAndArbitrator, safeCreator, beneficiary, accountX;
  const safeId1 = '01234567890';
  const safeId2 = '01234567891';

  describe('SafientMain Flow', async () => {
    it('Should deploy SafientMain', async () => {
      [safientMainAdminAndArbitrator, safeCreator, beneficiary, accountX] = await ethers.getSigners();

      const AutoAppealableArbitrator = await ethers.getContractFactory('AutoAppealableArbitrator');
      autoAppealableArbitrator = await AutoAppealableArbitrator.deploy(ethers.utils.parseEther('0.001'));
      await autoAppealableArbitrator.deployed();

      const Claims = await ethers.getContractFactory('Claims');
      claims = await Claims.deploy(autoAppealableArbitrator.address);
      await claims.deployed();

      const SafientMain = await ethers.getContractFactory('SafientMain');
      safientMain = await SafientMain.deploy(autoAppealableArbitrator.address, claims.address);
      await safientMain.deployed();

      expect(await safientMain.arbitratorContract()).to.equal(autoAppealableArbitrator.address);
      expect(await safientMain.claimsContract()).to.equal(claims.address);
      expect(await autoAppealableArbitrator.arbitrationCost(123)).to.equal(ethers.utils.parseEther('0.001'));
    });

    it('Should allow safe creators to create a safe', async () => {
      const arbitrationFee = await autoAppealableArbitrator.arbitrationCost(123); // 0.001 eth

      // SUCCESS : create a safe
      await safientMain
        .connect(safeCreator)
        .createSafe(
          beneficiary.address,
          safeId1,
          'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/',
          {
            value: arbitrationFee.toNumber() + ethers.utils.parseEther('0.001').toNumber(),
          }
        );

      expect(await safientMain.safesCount()).to.equal(1);
      expect(await safientMain.getSafientMainContractBalance()).to.equal(ethers.utils.parseEther('0.002')); // 0.002 eth
      const safe = await safientMain.safes(safeId1);
      expect(safe.safeCreatedBy).to.equal(safeCreator.address);
      expect(safe.safeBeneficiary).to.equal(beneficiary.address);
      expect(safe.safeFunds).to.equal(ethers.utils.parseEther('0.002')); // 0.002 eth

      // FAILURE : paying inadequate or no fee(arbitration fee) for safe creation
      await expect(
        safientMain
          .connect(safeCreator)
          .createSafe(
            beneficiary.address,
            safeId1,
            'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/',
            {
              value: arbitrationFee.toNumber() - ethers.utils.parseEther('0.001').toNumber(),
            }
          )
      ).to.be.revertedWith('Inadequate fee payment');

      // FAILURE : metaEvidence is not passed
      await expect(
        safientMain.connect(safeCreator).createSafe(beneficiary.address, safeId1, '', {
          value: arbitrationFee.toNumber(),
        })
      ).to.be.revertedWith('Should provide metaEvidence to create a safe');

      // FAILURE : beneficiary is an zero address
      await expect(
        safientMain
          .connect(safeCreator)
          .createSafe(
            '0x0000000000000000000000000000000000000000',
            safeId1,
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
            'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/',
            {
              value: arbitrationFee.toNumber(),
            }
          )
      ).to.be.revertedWith('Safe creator should not be the beneficiary of the safe');
    });

    it('Should allow safe beneficiaries to create a safe (syncSafe)', async () => {
      const arbitrationFee = await autoAppealableArbitrator.arbitrationCost(123); // 0.001 eth

      // SUCCESS : create a safe
      await safientMain
        .connect(beneficiary)
        .syncSafe(
          safeCreator.address,
          safeId2,
          'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/',
          {
            value: arbitrationFee.toNumber() + ethers.utils.parseEther('0.001').toNumber(),
          }
        );

      expect(await safientMain.safesCount()).to.equal(2);
      expect(await safientMain.getSafientMainContractBalance()).to.equal(ethers.utils.parseEther('0.004')); // 0.002 eth
      const safe = await safientMain.safes(safeId2);
      expect(safe.safeCreatedBy).to.equal(safeCreator.address);
      expect(safe.safeBeneficiary).to.equal(beneficiary.address);
      expect(safe.safeFunds).to.equal(ethers.utils.parseEther('0.002')); // 0.002 eth

      // FAILURE : paying inadequate or no fee(arbitration fee) for safe creation
      await expect(
        safientMain
          .connect(beneficiary)
          .syncSafe(
            safeCreator.address,
            safeId2,
            'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/',
            {
              value: arbitrationFee.toNumber() - ethers.utils.parseEther('0.001').toNumber(),
            }
          )
      ).to.be.revertedWith('Inadequate fee payment');

      // FAILURE : metaEvidence is not passed
      await expect(
        safientMain.connect(beneficiary).syncSafe(safeCreator.address, safeId2, '', {
          value: arbitrationFee.toNumber(),
        })
      ).to.be.revertedWith('Should provide metaEvidence to create a safe');

      // FAILURE : beneficiary is an zero address
      await expect(
        safientMain
          .connect(beneficiary)
          .syncSafe(
            '0x0000000000000000000000000000000000000000',
            safeId2,
            'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/',
            {
              value: arbitrationFee.toNumber(),
            }
          )
      ).to.be.revertedWith('Should provide an creator for the safe');

      // FAILURE : safe creator and beneficiary are same
      await expect(
        safientMain
          .connect(beneficiary)
          .syncSafe(
            beneficiary.address,
            safeId2,
            'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/',
            {
              value: arbitrationFee.toNumber(),
            }
          )
      ).to.be.revertedWith('Safe should be synced by the beneficiary of the safe');
    });

    it('Should allow beneficiaries to create a claim', async () => {
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

      // SUCCESS : create 1st claim
      await safientMain.connect(beneficiary).createClaim(
        safeId1,
        'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/' // evidence
      );

      let claimsOnSafe;
      claimsOnSafe = await safientMain.claimsOnSafe(safeId1);
      expect(claimsOnSafe.length).to.equal(1);
      expect(await safientMain.getSafientMainContractBalance()).to.equal(ethers.utils.parseEther('0.003')); // 0.003 eth
      let safe;
      safe = await safientMain.safes(safeId1);
      expect(safe.safeFunds).to.equal(ethers.utils.parseEther('0.001')); // 0.001 eth
      expect(safe.claimsCount).to.equal(1);
      const claim1 = await safientMain.claims(0);
      expect(claim1.disputeId).to.equal(0);
      expect(claim1.claimedBy).to.equal(beneficiary.address);
      expect(claim1.result).to.equal('Active');

      // SUCCESS : create 2nd claim on the same safe
      await safientMain.connect(beneficiary).createClaim(
        safeId1,
        'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/' // evidence
      );

      claimsOnSafe = await safientMain.claimsOnSafe(safeId1);
      expect(claimsOnSafe.length).to.equal(2);
      expect(await safientMain.getSafientMainContractBalance()).to.equal(ethers.utils.parseEther('0.002')); // 0.002 eth
      safe = await safientMain.safes(safeId1);
      expect(safe.safeFunds).to.equal(0); // 0 eth
      expect(safe.claimsCount).to.equal(2);
      const claim2 = await safientMain.claims(1);
      expect(claim2.disputeId).to.equal(1);
      expect(claim2.claimedBy).to.equal(beneficiary.address);
      expect(claim2.result).to.equal('Active');

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
      expect(claim1.result).to.equal('Failed'); // Failed

      // SUCCESS : give a ruling to claim2
      await autoAppealableArbitrator.connect(safientMainAdminAndArbitrator).giveRuling(1, 0);

      const claim2 = await safientMain.claims(1);
      expect(claim2.result).to.equal('RTA'); // Refused To Arbitrate (RTA)
    });

    it('Should allow users to deposit funds in a safe', async () => {
      // FAILURE : safe does not exist
      await expect(
        safientMain.connect(accountX).depositSafeFunds('123', { value: ethers.utils.parseEther('2') }) // 2 eth
      ).to.be.revertedWith('Safe does not exist');

      // SUCCESS : deposit funds in a safe
      await safientMain.connect(accountX).depositSafeFunds(safeId1, { value: ethers.utils.parseEther('2') }); // 2 eth

      const safe = await safientMain.safes(safeId1);
      expect(safe.safeFunds).to.equal(ethers.utils.parseEther('2')); // 2 eth
      expect(await safientMain.getSafientMainContractBalance()).to.equal(ethers.utils.parseEther('2.002')); // 2.002 eth
    });

    it('Should allow the safe current owner to retrieve funds in the safe', async () => {
      // FAILURE : safe does not exist
      await expect(safientMain.connect(safeCreator).retrieveSafeFunds('123')).to.be.revertedWith('Safe does not exist');

      // FAILURE : only safe owner can retrieve the funds
      await expect(safientMain.connect(accountX).retrieveSafeFunds(safeId1)).to.be.revertedWith(
        'Only safe owner can retrieve the deposit balance'
      );

      // SUCCESS : retrieve funds from a safe
      await safientMain.connect(safeCreator).retrieveSafeFunds(safeId1);

      expect(await safientMain.getSafientMainContractBalance()).to.equal(ethers.utils.parseEther('0.002')); // 0.002 eth

      // FAILURE : no funds remaining in the safe
      await expect(safientMain.connect(safeCreator).retrieveSafeFunds(safeId1)).to.be.revertedWith(
        'No funds remaining in the safe'
      );
    });
  });
});
