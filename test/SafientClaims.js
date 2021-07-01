const { ethers } = require('hardhat');
const { JsonRpcProvider } = require('@ethersproject/providers');
const chai = require('chai');
const { randomBytes } = require('crypto');
const { getThreadId } = require('../dist/utils/threadDb');
const { Client, PrivateKey, ThreadID, Where } = require('@textile/hub');

require('dotenv').config();

const expect = chai.expect;
chai.use(require('chai-as-promised'));

const metaevidenceOrEvidenceURI =
  'https://bafybeif52vrffdp7m2ip5f44ox552r7p477druj2w4g3r47wpuzdn7235y.ipfs.infura-ipfs.io/';

const { SafientClaims } = require('../dist/index');

describe('safientMain', async () => {
  let client, threadId;
  let provider, chainId;
  let safeIdOnThreadDB;
  let safientMainAdminSigner, safeCreatorSigner, inheritorSigner, accountXSigner, safeCreatorAddress, inheritorAddress;
  let safientMainAdminSeed, safeCreatorSeed, inheritorSeed, accountXSeed;

  describe('SafientClaims SDK Flow', async () => {
    before(async () => {
      console.log('Initializing threadDB Client...');
      // ThreadDB client (to create a safe beforehand)
      const seed = new Uint8Array(randomBytes(32));
      const identity = PrivateKey.fromRawEd25519Seed(Uint8Array.from(seed));
      client = await Client.withKeyInfo({
        key: `${process.env.USER_API_KEY}`,
        secret: `${process.env.USER_API_SECRET}`,
      });
      await client.getToken(identity);
      threadId = ThreadID.fromBytes(Uint8Array.from(await getThreadId()));

      console.log('Creating a Safe on threadDB...');
      // Create a safe on threadDB
      const data = {
        creator: 'DID:A',
        guardians: ['DID:X', 'DID:Y', 'DID:Z'],
        recipient: 'DID:B',
        encSafeKey: {},
        encSafeData: {},
        stage: 0,
        encSafeKeyShards: [],
        claims: [],
      };
      const safe = await client.create(threadId, 'Safes', [data]);
      safeIdOnThreadDB = safe[0];
      console.log('Safe created on threadDB successfully!');

      // Provider and ChainId
      provider = new JsonRpcProvider('http://localhost:8545');
      const providerNetworkData = await provider.getNetwork();
      chainId = providerNetworkData.chainId;

      // Signers, Signer addresses and seeds
      safientMainAdminSigner = await provider.getSigner(0);
      safeCreatorSigner = await provider.getSigner(1);
      inheritorSigner = await provider.getSigner(2);
      accountXSigner = await provider.getSigner(3);

      safeCreatorAddress = await safeCreatorSigner.getAddress();
      inheritorAddress = await inheritorSigner.getAddress();

      safientMainAdminSeed = new Uint8Array(randomBytes(32));
      safeCreatorSeed = new Uint8Array(randomBytes(32));
      inheritorSeed = new Uint8Array(randomBytes(32));
      accountXSeed = new Uint8Array(randomBytes(32));
    });

    after(async () => {
      console.log('Deleting Safe on threadDB...');
      // Delete the safe on threadDB
      const query = new Where('_id').eq(safeIdOnThreadDB);
      const result = await client.find(threadId, 'Safes', query);

      if (result.length < 1) return;

      const ids = await result.map((instance) => instance._id);
      await client.delete(threadId, 'Safes', ids);
      console.log('Safe deleted on threadDB successfully!');
    });

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
    });

    it('Should allow users to create a safe', async () => {
      const sc = new SafientClaims(safeCreatorSigner, chainId, safeCreatorSeed);

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

    it('Should allow users to create a claim (should update the claim on threadDB)', async () => {
      let sc, conn;
      sc = new SafientClaims(accountXSigner, chainId, accountXSeed);
      conn = await sc.safientMain.connectUser();

      // FAILURE : only inheritor of the safe can create the claim
      await expect(
        sc.safientMain.createClaim(conn, 'DID:X', safeIdOnThreadDB, metaevidenceOrEvidenceURI)
      ).to.be.rejectedWith(Error);

      sc = new SafientClaims(inheritorSigner, chainId, inheritorSeed);
      conn = await sc.safientMain.connectUser();

      // SUCCESS : create a claim
      await sc.safientMain.createClaim(conn, 'DID:B', safeIdOnThreadDB, metaevidenceOrEvidenceURI);
      const query = new Where('_id').eq(safeIdOnThreadDB);
      const threadResult = await client.find(threadId, 'Safes', query);

      // Check if the safe is updated on ThreadDB
      expect(threadResult[0].stage).to.equal(1);
      expect(threadResult[0].claims[0].claimStatus).to.equal(0);
      expect(threadResult[0].claims[0].createdBy).to.equal('DID:B');
      expect(threadResult[0].claims[0].disputeID).to.equal(0);

      expect(await sc.safientMain.getTotalNumberOfClaims()).to.equal(1);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0.01);

      const claim = await sc.safientMain.getClaimByClaimId(0);

      expect(claim.claimedBy).to.equal(inheritorAddress);
      expect(claim.result).to.equal('Active');
    });

    it('Should allow users to deposit funds in a safe', async () => {
      const sc = new SafientClaims(accountXSigner, chainId, accountXSeed);

      // SUCCESS : deposit funds in a safe
      await sc.safientMain.depositSafeFunds(safeIdOnThreadDB, String(ethers.utils.parseEther('2')));

      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(2.01);
    });

    it('Should allow the safe owner to recover funds in the safe', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId, accountXSeed);

      // FAILURE : only safe owner can recover the funds
      await expect(sc.safientMain.recoverSafeFunds(safeIdOnThreadDB)).to.be.rejectedWith(Error);

      sc = new SafientClaims(safeCreatorSigner, chainId, safeCreatorSeed);

      // SUCCESS : recover funds from a safe
      await sc.safientMain.recoverSafeFunds(safeIdOnThreadDB);

      // FAILURE : no funds remaining in the safe
      await expect(sc.safientMain.recoverSafeFunds(safeIdOnThreadDB)).to.be.rejectedWith(Error);
    });

    it('Should allow admin to set the total number of claims allowed on a safe', async () => {
      let sc;
      sc = new SafientClaims(accountXSigner, chainId, accountXSeed);

      // FAILURE : only SafexMain contract's admin can execute this
      await expect(sc.safientMain.setTotalClaimsAllowed(3)).to.be.rejectedWith(Error);

      sc = new SafientClaims(safientMainAdminSigner, chainId, safientMainAdminSeed);

      // SUCCESS : set new total number of claims allowed
      await sc.safientMain.setTotalClaimsAllowed(3);

      expect(await sc.safientMain.getTotalClaimsAllowed()).to.equal(3);
    });

    it('Should get the safe on contract by its Safe Id', async () => {
      const sc = new SafientClaims(accountXSigner, chainId, accountXSeed);

      const safe = await sc.safientMain.getSafeBySafeId(safeIdOnThreadDB);

      expect(safe.safeId).to.equal(safeIdOnThreadDB);
      expect(safe.safeCreatedBy).to.equal(safeCreatorAddress);
      expect(safe.claimsCount).to.equal(1);
      expect(safe.safeFunds).to.equal(0);
    });

    it('Should get the claim by its Claim Id', async () => {
      const sc = new SafientClaims(accountXSigner, chainId, accountXSeed);

      const claim = await sc.safientMain.getClaimByClaimId(0);

      expect(claim.safeId).to.equal(safeIdOnThreadDB);
      expect(claim.disputeId).to.equal(0);
      expect(claim.claimedBy).to.equal(inheritorAddress);
    });

    it('Should get all the claims on a safe by Safe Id', async () => {
      const sc = new SafientClaims(accountXSigner, chainId, accountXSeed);

      const claims = await sc.safientMain.getClaimsOnSafeBySafeId(safeIdOnThreadDB);

      expect(claims.length).to.equal(1);
      expect(claims[0].safeId).to.equal(safeIdOnThreadDB);
      expect(claims[0].disputeId).to.equal(0);
      expect(claims[0].claimedBy).to.equal(inheritorAddress);
    });

    it('Should get the total number of safes on the contract', async () => {
      const sc = new SafientClaims(accountXSigner, chainId, accountXSeed);
      expect(await sc.safientMain.getTotalNumberOfSafes()).to.equal(1);
    });

    it('Should get the total number of claims on the contract', async () => {
      const sc = new SafientClaims(accountXSigner, chainId, accountXSeed);
      expect(await sc.safientMain.getTotalNumberOfClaims()).to.equal(1);
    });

    it('Should get the SafientMain contract balance', async () => {
      const sc = new SafientClaims(accountXSigner, chainId, accountXSeed);
      expect(await sc.safientMain.getSafientMainContractBalance()).to.equal(0);
    });

    it('Should get the total number of claims allowed on a safe', async () => {
      const sc = new SafientClaims(accountXSigner, chainId, accountXSeed);
      expect(await sc.safientMain.getTotalClaimsAllowed()).to.equal(3);
    });

    it('Should get the status of the claim on a safe', async () => {
      const sc = new SafientClaims(accountXSigner, chainId, accountXSeed);
      expect(await sc.safientMain.getClaimStatus(0)).to.equal('Active');
    });
  });
});
