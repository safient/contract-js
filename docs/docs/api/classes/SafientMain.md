---
id: "SafientMain"
title: "Class: SafientMain"
sidebar_label: "SafientMain"
sidebar_position: 0
custom_edit_url: null
---

This class implements an interface for the safient protocol's contract interaction allowing
users to create and interact with the safes and the claims

## Constructors

### constructor

• **new SafientMain**(`signer`, `chainId`)

Arbitrator Constructor

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signer` | `JsonRpcSigner` | Signer object |
| `chainId` | `number` | Provider chainId |

#### Defined in

[contracts/SafientMain.ts:36](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L36)

## Methods

### createClaim

▸ **createClaim**(`safeId`, `evidenceURI`): `Promise`<`TransactionResponse`\>

This function creates a claim on a safe

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `safeId` | `string` | Id of the safe |
| `evidenceURI` | `string` | IPFS URI pointing to the evidence submitted by the claim creator |

#### Returns

`Promise`<`TransactionResponse`\>

A transaction response

#### Defined in

[contracts/SafientMain.ts:126](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L126)

___

### createSafe

▸ **createSafe**(`beneficiaryAddress`, `safeId`, `claimType`, `signalingPeriod`, `metaevidenceURI`, `value`): `Promise`<`TransactionResponse`\>

This function creates a new safe by the safe creator

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `beneficiaryAddress` | `string` | Address of the beneficiary who can claim to inherit this safe |
| `safeId` | `string` | Id of the safe |
| `claimType` | [`ClaimType`](../enums/Types.ClaimType) | Type of claim the inheritor has go through |
| `signalingPeriod` | `number` | Number of days within which the safe creator is willing to send a signal |
| `metaevidenceURI` | `string` | IPFS URI pointing to the metaevidence related to general agreement, arbitration details, actors involved etc |
| `value` | `string` | Safe maintanence fee in Gwei, minimum arbitration fee required |

#### Returns

`Promise`<`TransactionResponse`\>

A transaction response

#### Defined in

[contracts/SafientMain.ts:72](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L72)

___

### depositFunds

▸ **depositFunds**(`safeId`, `value`): `Promise`<`TransactionResponse`\>

This function deposits funds into a safe

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `safeId` | `string` | Id of the safe |
| `value` | `string` | Funds in Gwei |

#### Returns

`Promise`<`TransactionResponse`\>

A transaction response

#### Defined in

[contracts/SafientMain.ts:142](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L142)

___

### getClaimByClaimId

▸ **getClaimByClaimId**(`claimId`): `Promise`<[`Claim`](../namespaces/Types#claim)\>

This function returns a claim by it's id

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `claimId` | `number` | Id of the claim |

#### Returns

`Promise`<[`Claim`](../namespaces/Types#claim)\>

The Claim object containing claim data

#### Defined in

[contracts/SafientMain.ts:234](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L234)

___

### getClaimStatus

▸ **getClaimStatus**(`safeId`, `claimId`): `Promise`<`number`\>

This function returns the status (0 - Active, 1 - Passed, 2 - Failed or 3 - Refused To Arbitrate) of a claim by it's id

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `safeId` | `string` | Id of the safe |
| `claimId` | `number` | Id of the claim |

#### Returns

`Promise`<`number`\>

The status of the claim

#### Defined in

[contracts/SafientMain.ts:204](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L204)

___

### getContractBalance

▸ **getContractBalance**(): `Promise`<`number`\>

This function returns the balance of the SafientMain contract

#### Returns

`Promise`<`number`\>

The balance of SafientMain contract in ETH

#### Defined in

[contracts/SafientMain.ts:276](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L276)

___

### getSafeBySafeId

▸ **getSafeBySafeId**(`safeId`): `Promise`<[`Safe`](../namespaces/Types#safe)\>

This function returns a safe by it's id

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `safeId` | `string` | Id of the safe |

#### Returns

`Promise`<[`Safe`](../namespaces/Types#safe)\>

The Safe object containing safe data

#### Defined in

[contracts/SafientMain.ts:219](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L219)

___

### getTotalNumberOfClaims

▸ **getTotalNumberOfClaims**(): `Promise`<`number`\>

This function returns the total number of claims created on the SafientMain contract

#### Returns

`Promise`<`number`\>

The total number of claims created on the SafientMain contract

#### Defined in

[contracts/SafientMain.ts:262](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L262)

___

### getTotalNumberOfSafes

▸ **getTotalNumberOfSafes**(): `Promise`<`number`\>

This function returns the total number of safes created on the SafientMain contract

#### Returns

`Promise`<`number`\>

The total number of safes created on the SafientMain contract

#### Defined in

[contracts/SafientMain.ts:248](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L248)

___

### guardianProof

▸ **guardianProof**(`message`, `signature`, `guardianProof`, `secrets`, `safeId`): `Promise`<`boolean`\>

This function submits the guardian proof

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | Message generated during safe creation, also signed by the safe creator |
| `signature` | `Bytes` | Signature of the message signed by the creator |
| `guardianProof` | [`RecoveryProof`](../namespaces/Types#recoveryproof)[] | Object containing guardian address and his secret |
| `secrets` | `string`[] | Array of all the secrets of all the guardians, for cross verification |
| `safeId` | `string` | Id of the safe |

#### Returns

`Promise`<`boolean`\>

If the guardian proof was true or false

#### Defined in

[contracts/SafientMain.ts:295](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L295)

___

### sendSignal

▸ **sendSignal**(`safeId`): `Promise`<`TransactionResponse`\>

This function signals a safe in response to the claim made on that safe

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `safeId` | `string` | Id of the safe |

#### Returns

`Promise`<`TransactionResponse`\>

A transaction response

#### Defined in

[contracts/SafientMain.ts:188](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L188)

___

### submitEvidence

▸ **submitEvidence**(`disputeId`, `evidenceURI`): `Promise`<`TransactionResponse`\>

This function submits the evidence supporting a claim, only claim creator can execute this

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `disputeId` | `number` | Id of the dispute representing the claim |
| `evidenceURI` | `string` | IPFS URI pointing to the evidence submitted by the claim creator |

#### Returns

`Promise`<`TransactionResponse`\>

A transaction response

#### Defined in

[contracts/SafientMain.ts:173](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L173)

___

### syncSafe

▸ **syncSafe**(`creatorAddress`, `safeId`, `claimType`, `signalingPeriod`, `metaevidenceURI`, `value`): `Promise`<`TransactionResponse`\>

This function creates a new safe by the safe beneficiary

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `creatorAddress` | `string` | Address of the creator who created the safe offchain |
| `safeId` | `string` | Id of the safe |
| `claimType` | [`ClaimType`](../enums/Types.ClaimType) | Type of claim the inheritor has go through |
| `signalingPeriod` | `number` | Number of days within which the safe creator is willing to send a signal |
| `metaevidenceURI` | `string` | IPFS URI pointing to the metaevidence related to general agreement, arbitration details, actors involved etc |
| `value` | `string` | Safe maintanence fee in Gwei, minimum arbitration fee required |

#### Returns

`Promise`<`TransactionResponse`\>

A transaction response

#### Defined in

[contracts/SafientMain.ts:101](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L101)

___

### withdrawFunds

▸ **withdrawFunds**(`safeId`): `Promise`<`TransactionResponse`\>

This function withdraws funds from a safe, only safe's current owner can execute this

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `safeId` | `string` | Id of the safe |

#### Returns

`Promise`<`TransactionResponse`\>

A transaction response

#### Defined in

[contracts/SafientMain.ts:157](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/SafientMain.ts#L157)
