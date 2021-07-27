# Safient Claims SDK

JavaScript SDK to manage and interact with the safe claims on Safient protocol.

## Installation

```bash
  git clone https://github.com/safient/safient-claims-js.git
  cd safient-claims-js
  npm install
```

## Running Tests

Terminal 1

```bash
  npx tsc
  npm run chain
```

Terminal 2

```bash
  npm run deploy
  npm run test
```

## Getting started

```bash
  npm i @safient/claims
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
import { SafientClaims } from '@safient/claims';

const sc = new SafientClaims(signer, chainId);
```

### Arbitrator

```
sc.arbitrator.getArbitrationFee
```

### SafientMain

```
sc.safientMain.createSafe
sc.safientMain.syncSafe
sc.safientMain.createClaim
sc.safientMain.submitEvidence
sc.safientMain.depositSafeFunds
sc.safientMain.recoverSafeFunds
sc.safientMain.getTotalNumberOfSafes
sc.safientMain.getTotalNumberOfClaims
sc.safientMain.getAllClaims
sc.safientMain.getSafeBySafeId
sc.safientMain.getClaimByClaimId
sc.safientMain.getClaimsOnSafeBySafeId
sc.safientMain.getClaimStatus
sc.safientMain.getSafientMainContractBalance
sc.safientMain.guardianProof
```

## API details

### Arbitrator

#### Get Arbitration Fee

```javascript
const getArbitrationFee = async () => {
  try {
    const fee = await sc.arbitrator.getArbitrationFee();
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
const createSafe = async (inheritorAddress, safeIdOnThreadDB, metaevidenceURI, value) => {
  try {
    const tx = await sc.safientMain.createSafe(inheritorAddress, safeIdOnThreadDB, metaevidenceURI, value);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                                                                        |
| :----------------- | :------- | :--------------------------------------------------------------------------------- |
| `inheritorAddress` | `string` | **Required**. Address of the beneficiary who can claim to inherit this safe        |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB                                                  |
| `metaevidenceURI`  | `string` | **Required**. IPFS URI pointing to the metaevidence related to arbitration details |
| `value`            | `string` | **Required**. Safe maintanence fee in **Gwei**, minimum arbitration fee required   |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Sync Safe

```javascript
const syncSafe = async (creatorAddress, safeIdOnThreadDB, metaevidenceURI, value) => {
  try {
    const tx = await sc.safientMain.syncSafe(creatorAddress, safeIdOnThreadDB, metaevidenceURI, value);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                                                                        |
| :----------------- | :------- | :--------------------------------------------------------------------------------- |
| `creatorAddress`   | `string` | **Required**. Address of the creator who created the safe offchain                 |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB                                                  |
| `metaevidenceURI`  | `string` | **Required**. IPFS URI pointing to the metaevidence related to arbitration details |
| `value`            | `string` | **Required**. Safe maintanence fee in **Gwei**, minimum arbitration fee required   |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Create Claim

```javascript
const createClaim = async (safeIdOnThreadDB, evidenceURI) => {
  try {
    const tx = await sc.safientMain.createClaim(safeIdOnThreadDB, evidenceURI);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                                                                    |
| :----------------- | :------- | :----------------------------------------------------------------------------- |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB                                              |
| `evidenceURI`      | `string` | **Required**. IPFS URI pointing to the evidence submitted by the claim creator |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Submit Evidence

```javascript
const submitEvidence = async (disputeId, evidenceURI) => {
  try {
    const tx = await sc.safientMain.submitEvidence(disputeId, evidenceURI);
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
const depositSafeFunds = async (safeIdOnThreadDB, value) => {
  try {
    const tx = await sc.safientMain.depositSafeFunds(safeIdOnThreadDB, value);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                       |
| :----------------- | :------- | :-------------------------------- |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB |
| `value`            | `string` | **Required**. Funds in **Gwei**   |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Recover Safe Funds

> Only **safe's current owner** can execute this

```javascript
const recoverSafeFunds = async (safeIdOnThreadDB) => {
  try {
    const tx = await sc.safientMain.recoverSafeFunds(safeIdOnThreadDB);
    console.log(tx);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                       |
| :----------------- | :------- | :-------------------------------- |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB |

<br />

| Returns                | Type     | Description                              |
| :--------------------- | :------- | :--------------------------------------- |
| `Transaction Response` | `object` | Includes all properties of a transaction |

#### Get Total Number Of Safes

```javascript
const getTotalNumberOfSafes = async () => {
  try {
    const numOfSafes = await sc.safientMain.getTotalNumberOfSafes();
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
    const numOfClaims = await sc.safientMain.getTotalNumberOfClaims();
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
const getSafeBySafeId = async (safeIdOnThreadDB) => {
  try {
    const safe = await sc.safientMain.getSafeBySafeId(safeIdOnThreadDB);
    console.log(safe);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                       |
| :----------------- | :------- | :-------------------------------- |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB |

<br />

| Returns | Type   | Description               |
| :------ | :----- | :------------------------ |
| `Safe`  | `Safe` | Safe containing safe data |

<br />

> Type **Safe**

| Property           | Type       | Description                                           |
| :----------------- | :--------- | :---------------------------------------------------- |
| `safeId`           | `string`   | Safe Id on threadDB                                   |
| `safeCreatedBy`    | `string`   | Address of the safe creator                           |
| `safeCurrentOwner` | `string`   | Address of the current safe owner                     |
| `safeInheritor`    | `string`   | Address of the safe inheritor (beneficiary)           |
| `metaEvidenceId`   | `Bigumber` | Id used to uniquely identify a piece of meta-evidence |
| `claimsCount`      | `Bigumber` | Number of claims made on this safe                    |
| `safeFunds`        | `Bigumber` | Total safe funds in **Gwei**                          |

#### Get Claim By Claim Id

```javascript
const getClaimByClaimId = async (claimId) => {
  try {
    const claim = await sc.safientMain.getClaimByClaimId(claimId);
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

| Property          | Type        | Description                                                                    |
| :---------------- | :---------- | :----------------------------------------------------------------------------- |
| `safeId`          | `string`    | Safe Id on threadDB                                                            |
| `disputeId`       | `BigNumber` | Id of the dispute representing the claim                                       |
| `claimedBy`       | `string`    | Address of the claim creator                                                   |
| `metaEvidenceId`  | `BigNumber` | Id used to uniquely identify a piece of meta-evidence                          |
| `evidenceGroupId` | `Bigumber`  | Id used to identify a group of evidence related to a dispute                   |
| `status`          | `number`    | Claim status represented by **0**, **1**, **2** or **3**                       |
| `result`          | `string`    | Claim result represented by **Passed**, **Failed** or **Refused To Arbitrate** |

#### Get All Claims

```javascript
const getAllClaims = async () => {
  try {
    const claims = await sc.safientMain.getAllClaims();
    console.log(claims);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Returns           | Type      | Description                                    |
| :---------------- | :-------- | :--------------------------------------------- |
| `Array of claims` | `Claim[]` | Array of all the claims created on SafientMain |

#### Get All Claims On A Safe By Safe Id

```javascript
const getClaimsOnSafeBySafeId = async (safeIdOnThreadDB) => {
  try {
    const claims = await sc.safientMain.getClaimsOnSafeBySafeId(safeIdOnThreadDB);
    console.log(claims);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter          | Type     | Description                       |
| :----------------- | :------- | :-------------------------------- |
| `safeIdOnThreadDB` | `string` | **Required**. Safe Id on threadDB |

<br />

| Returns           | Type      | Description                       |
| :---------------- | :-------- | :-------------------------------- |
| `Array of claims` | `Claim[]` | Array of all the claims on a safe |

#### Get Claim Status

```javascript
const getClaimStatus = async (claimId) => {
  try {
    const claimStatus = await sc.safientMain.getClaimStatus(claimId);
    console.log(claimStatus);
  } catch (e) {
    console.log(e.message);
  }
};
```

| Parameter | Type     | Description                   |
| :-------- | :------- | :---------------------------- |
| `claimId` | `number` | **Required**. Id of the claim |

<br />

| Returns        | Type     | Description                                                                                                |
| :------------- | :------- | :--------------------------------------------------------------------------------------------------------- |
| `claim status` | `number` | Claim status represented by **0 - Active**, **1 - Passed**, **2 - Failed** or **3 - Refused To Arbitrate** |

#### Get SafientMain Contract Total Balance

```javascript
const getSafientMainContractBalance = async () => {
  try {
    const balance = await sc.safientMain.getSafientMainContractBalance();
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
const guardianProof = async (message, signature, guardianProof, secrets, safeIdOnThreadDB) => {
  try {
    const result = await sc.safientMain.guardianProof(message, signature, guardianProof, secrets, safeIdOnThreadDB);
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

| Parameter          | Type            | Description                                                                           |
| :----------------- | :-------------- | :------------------------------------------------------------------------------------ |
| `message`          | `string`        | **Required**. Message generated during safe creation, also signed by the safe creator |
| `signature`        | `bytes`         | **Required**. Signature of the message signed by the creator                          |
| `guardianProof`    | `RecoveryProof` | **Required**. Object containing guardian address and his secret                       |
| `secrets`          | `string[]`      | **Required**. Array of all the secrets of all the guardians, for cross verification   |
| `safeIdOnThreadDB` | `string`        | **Required**. Id of the safe on threadDB                                              |

<br />

| Returns                 | Type      | Description                     |
| :---------------------- | :-------- | :------------------------------ |
| `Guardian proof result` | `boolean` | Guardian proof is true or false |
