# Safient Contracts SDK

JavaScript SDK to manage and interact with the safe claims on Safient protocol.

## Local installation

```bash
  git clone https://github.com/safient/safient-contract-js.git
  cd safient-contract-js
  npm install
```

## Running Tests

Create a .env file in the root directory with `INFURA_API_KEY` for mainnet or testnet deployment.

#### Testing the contracts

```bash
  npm run test-contract
```

#### Testing the JS SDK

Run a local blockchain

```bash
  npm run chain
```

Deploy the contract, run the test on a different terminal

```bash
  npm run deploy-sdk
  npm run test-sdk
```

#### Testing the contract & SDK

```bash
  npm run deploy-sdk
  npm run tests
```

## Getting started

```bash
  npm i @safient/contracts
```

## Usage

```javascript
// If not injected web3 provider, create a jsonRpcProvider
const { JsonRpcProvider } = require('@ethersproject/providers');
const provider = new JsonRpcProvider('http://localhost:8545');

// Get signer and chainId from provider
(async () => {
  const signer = await provider.getSigner();
  const providerNetwork = await provider.getNetwork();
  const chainId = providerNetwork.chainId;
})();
```

## Initialization

```javascript
import { SafientMain, Arbitrator, Types } from '@safient/contracts';

const safientMain = new SafientMain(signer, chainId);
const arbitrator = new Arbitrator(signer, chainId);
```

### Arbitrator

```
arbitrator.getArbitrationFee
```

### SafientMain

```
safientMain.createSafe
safientMain.syncSafe
safientMain.createClaim
safientMain.submitEvidence
safientMain.depositFunds
safientMain.withdrawFunds
safientMain.getTotalNumberOfSafes
safientMain.getTotalNumberOfClaims
safientMain.getSafeBySafeId
safientMain.getClaimByClaimId
safientMain.getClaimStatus
safientMain.getContractBalance
safientMain.guardianProof
```

## API details

### Arbitrator

#### Get Arbitration Fee

```javascript
const getArbitrationFee = async () => {
  try {
    const fee = await arbitrator.getArbitrationFee();
    console.log(fee);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Returns           | Type     | Description                |
| :---------------- | :------- | :------------------------- |
| `Arbitration fee` | `number` | Arbitration fee in **ETH** |

### SafientMain

#### Create Safe

```javascript
const createSafe = async (beneficiaryAddress, safeId, claimType, signalingPeriod, metaevidenceURI, value) => {
  try {
    const tx = await safientMain.createSafe(
      beneficiaryAddress,
      safeId,
      claimType,
      signalingPeriod,
      metaevidenceURI,
      value
    );
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter            | Type     | Description                                                                      |
| :------------------- | :------- | :------------------------------------------------------------------------------- |
| `beneficiaryAddress` | `string` | **Required**. Address of the beneficiary who can claim to inherit this safe      |
| `safeId`             | `string` | **Required**. Safe Id                                                            |
| `claimType`          | `string` | **Required**. Type of claim the inheritor has go through                         |
| `signalingPeriod`    | `string` | Number of days within which the safe creator is willing to send a signal         |
| `metaevidenceURI`    | `string` | IPFS URI pointing to the metaevidence related to arbitration details             |
| `value`              | `string` | **Required**. Safe maintanence fee in **Gwei**, minimum arbitration fee required |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Sync Safe

```javascript
const syncSafe = async (creatorAddress, safeId, claimType, signalingPeriod, metaevidenceURI, value) => {
  try {
    const tx = await safientMain.syncSafe(creatorAddress, safeId, claimType, signalingPeriod, metaevidenceURI, value);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter         | Type     | Description                                                                      |
| :---------------- | :------- | :------------------------------------------------------------------------------- |
| `creatorAddress`  | `string` | **Required**. Address of the creator who created the safe offchain               |
| `safeId`          | `string` | **Required**. Safe Id                                                            |
| `claimType`       | `string` | **Required**. Type of claim the inheritor has to go through                      |
| `signalingPeriod` | `string` | Number of days within which the safe creator is willing to send a signal         |
| `metaevidenceURI` | `string` | IPFS URI pointing to the metaevidence related to arbitration details             |
| `value`           | `string` | **Required**. Safe maintanence fee in **Gwei**, minimum arbitration fee required |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Create Claim

```javascript
const createClaim = async (safeId, evidenceURI) => {
  try {
    const tx = await safientMain.createClaim(safeId, evidenceURI);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter     | Type     | Description                                                      |
| :------------ | :------- | :--------------------------------------------------------------- |
| `safeId`      | `string` | **Required**. Safe Id                                            |
| `evidenceURI` | `string` | IPFS URI pointing to the evidence submitted by the claim creator |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Submit Evidence

```javascript
const submitEvidence = async (disputeId, evidenceURI) => {
  try {
    const tx = await safientMain.submitEvidence(disputeId, evidenceURI);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter     | Type     | Description                                                                    |
| :------------ | :------- | :----------------------------------------------------------------------------- |
| `disputeId`   | `number` | **Required**. Id of the dispute representing the claim                         |
| `evidenceURI` | `string` | **Required**. IPFS URI pointing to the evidence submitted by the claim creator |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Deposit Safe Funds

```javascript
const depositFunds = async (safeId, value) => {
  try {
    const tx = await safientMain.depositFunds(safeId, value);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter | Type     | Description                     |
| :-------- | :------- | :------------------------------ |
| `safeId`  | `string` | **Required**. Safe Id           |
| `value`   | `string` | **Required**. Funds in **Gwei** |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Retrieve Safe Funds

> Only **safe's current owner** can execute this

```javascript
const withdrawFunds = async (safeId) => {
  try {
    const tx = await safientMain.withdrawFunds(safeId);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter | Type     | Description           |
| :-------- | :------- | :-------------------- |
| `safeId`  | `string` | **Required**. Safe Id |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Send signal

> Only **safe's current owner** can execute this

```javascript
const sendSignal = async (safeId) => {
  try {
    const tx = await safientMain.sendSignal(safeId);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter | Type     | Description           |
| :-------- | :------- | :-------------------- |
| `safeId`  | `string` | **Required**. Safe Id |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Get Total Number Of Safes

```javascript
const getTotalNumberOfSafes = async () => {
  try {
    const numOfSafes = await safientMain.getTotalNumberOfSafes();
    console.log(numOfSafes);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Returns              | Type     | Description                                  |
| :------------------- | :------- | :------------------------------------------- |
| `Total no. of safes` | `number` | Total number of safes created on SafientMain |

#### Get Total Number Of Claims

```javascript
const getTotalNumberOfClaims = async () => {
  try {
    const numOfClaims = await safientMain.getTotalNumberOfClaims();
    console.log(numOfClaims);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Returns               | Type     | Description                                   |
| :-------------------- | :------- | :-------------------------------------------- |
| `Total no. of claims` | `number` | Total number of claims created on SafientMain |

#### Get Safe By Safe Id

```javascript
const getSafeBySafeId = async (safeId) => {
  try {
    const safe = await safientMain.getSafeBySafeId(safeId);
    console.log(safe);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter | Type     | Description           |
| :-------- | :------- | :-------------------- |
| `safeId`  | `string` | **Required**. Safe Id |

<br />

| Returns | Type   | Description               |
| :------ | :----- | :------------------------ |
| `Safe`  | `Safe` | Safe containing safe data |

<br />

> Type **Safe**

| Property           | Type        | Description                                                 |
| :----------------- | :---------- | :---------------------------------------------------------- |
| `id`               | `string`    | Safe Id                                                     |
| `createdBy`        | `string`    | Address of the safe creator                                 |
| `currentOwner`     | `string`    | Address of the current safe owner                           |
| `beneficiary`      | `string`    | Address of the safe beneficiary                             |
| `signalingPeriod`  | `Bigumber`  | Number of days before which signal should be given          |
| `endSignalTime`    | `Bigumber`  | End timestamp before which signal should be given           |
| `latestSignalTime` | `Bigumber`  | Timestamp at which signal is given                          |
| `claimType`        | `ClaimType` | Type of claim **0 - SignalBased**, **1 - ArbitrationBased** |
| `metaEvidenceId`   | `Bigumber`  | Id used to uniquely identify a piece of meta-evidence       |
| `claimsCount`      | `Bigumber`  | Number of claims made on this safe                          |
| `funds`            | `Bigumber`  | Total safe funds in **Gwei**                                |

#### Get Claim By Claim Id

```javascript
const getClaimByClaimId = async (claimId) => {
  try {
    const claim = await safientMain.getClaimByClaimId(claimId);
    console.log(claim);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter | Type     | Description                   |
| :-------- | :------- | :---------------------------- |
| `claimId` | `number` | **Required**. Id of the claim |

<br />

| Returns | Type    | Description                 |
| :------ | :------ | :-------------------------- |
| `Claim` | `Claim` | Claim containing claim data |

<br />

> Type **Claim**

| Property          | Type          | Description                                                                                   |
| :---------------- | :------------ | :-------------------------------------------------------------------------------------------- |
| `id`              | `BigNumber`   | Id of the claim                                                                               |
| `claimedBy`       | `string`      | Address of the claim creator                                                                  |
| `claimType`       | `ClaimType`   | Type of claim **0 - SignalBased**, **1 - ArbitrationBased**                                   |
| `metaEvidenceId`  | `BigNumber`   | Id used to uniquely identify a piece of meta-evidence                                         |
| `evidenceGroupId` | `Bigumber`    | Id used to identify a group of evidence related to a dispute                                  |
| `status`          | `ClaimStatus` | Claim status represented by **0 - Active**, **1 - Passed**, **2 - Failed** or **3 - Refused** |

#### Get Claim Status

```javascript
const getClaimStatus = async (safeId, claimId) => {
  try {
    const claimStatus = await safientMain.getClaimStatus(claimId);
    console.log(claimStatus);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter | Type     | Description                   |
| :-------- | :------- | :---------------------------- |
| `safeId`  | `string` | **Required**. Safe Id         |
| `claimId` | `number` | **Required**. Id of the claim |

<br />

| Returns        | Type     | Description                                                                                                |
| :------------- | :------- | :--------------------------------------------------------------------------------------------------------- |
| `claim status` | `number` | Claim status represented by **0 - Active**, **1 - Passed**, **2 - Failed** or **3 - Refused To Arbitrate** |

#### Get SafientMain Contract Total Balance

```javascript
const getContractBalance = async () => {
  try {
    const balance = await safientMain.getContractBalance();
    console.log(balance);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Returns                        | Type     | Description                                      |
| :----------------------------- | :------- | :----------------------------------------------- |
| `SafientMain contract balance` | `number` | Total balance of SafientMain contract in **ETH** |

#### Guardian proof

```javascript
const guardianProof = async (message, signature, guardianProof, secrets, safeId) => {
  try {
    const result = await safientMain.guardianProof(message, signature, guardianProof, secrets, safeId);
    console.log(result);
  } catch (e) {
    console.log(e.message);
  }
};
```

> Type **RecoveryProof**

| Property  | Type     | Description      |
| :-------- | :------- | :--------------- |
| `secret`  | `string` | Secret           |
| `address` | `string` | Guardian address |

<br />

| Parameter       | Type            | Description                                                                           |
| :-------------- | :-------------- | :------------------------------------------------------------------------------------ |
| `message`       | `string`        | **Required**. Message generated during safe creation, also signed by the safe creator |
| `signature`     | `bytes`         | **Required**. Signature of the message signed by the creator                          |
| `guardianProof` | `RecoveryProof` | **Required**. Object containing guardian address and his secret                       |
| `secrets`       | `string[]`      | **Required**. Array of all the secrets of all the guardians, for cross verification   |
| `safeId`        | `string`        | **Required**. Id of the safe                                                          |

<br />

| Returns                 | Type      | Description                     |
| :---------------------- | :-------- | :------------------------------ |
| `Guardian proof result` | `boolean` | Guardian proof is true or false |
