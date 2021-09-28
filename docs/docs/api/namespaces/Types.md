---
id: "Types"
title: "Namespace: Types"
sidebar_label: "Types"
sidebar_position: 0
custom_edit_url: null
---

## Enumerations

- [ClaimStatus](../enums/Types.ClaimStatus)
- [ClaimType](../enums/Types.ClaimType)

## Type aliases

### Claim

Ƭ **Claim**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `claimType` | [`ClaimType`](../enums/Types.ClaimType) |
| `claimedBy` | `string` |
| `evidenceGroupId` | `BigNumber` |
| `id` | `BigNumber` |
| `metaEvidenceId` | `BigNumber` |
| `status` | [`ClaimStatus`](../enums/Types.ClaimStatus) |

#### Defined in

[types/Types.ts:19](https://github.com/safient/safient-claims-js/blob/3387f49/src/types/Types.ts#L19)

___

### ContractABI

Ƭ **ContractABI**: `ContractInterface` \| `object`[]

#### Defined in

[types/Types.ts:29](https://github.com/safient/safient-claims-js/blob/3387f49/src/types/Types.ts#L29)

___

### ContractAddress

Ƭ **ContractAddress**: `string`

#### Defined in

[types/Types.ts:28](https://github.com/safient/safient-claims-js/blob/3387f49/src/types/Types.ts#L28)

___

### RecoveryProof

Ƭ **RecoveryProof**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `guardianAddress` | `string` |
| `secretHash` | `string` |

#### Defined in

[types/Types.ts:32](https://github.com/safient/safient-claims-js/blob/3387f49/src/types/Types.ts#L32)

___

### Safe

Ƭ **Safe**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `beneficiary` | `string` |
| `claimType` | [`ClaimType`](../enums/Types.ClaimType) |
| `claimsCount` | `BigNumber` |
| `createdBy` | `string` |
| `currentOwner` | `string` |
| `endSignalTime` | `BigNumber` |
| `funds` | `BigNumber` |
| `id` | `string` |
| `latestSignalTime` | `BigNumber` |
| `metaEvidenceId` | `BigNumber` |
| `signalingPeriod` | `BigNumber` |

#### Defined in

[types/Types.ts:5](https://github.com/safient/safient-claims-js/blob/3387f49/src/types/Types.ts#L5)

___

### Signer

Ƭ **Signer**: `JsonRpcSigner`

#### Defined in

[types/Types.ts:30](https://github.com/safient/safient-claims-js/blob/3387f49/src/types/Types.ts#L30)
