---
id: "Arbitrator"
title: "Class: Arbitrator"
sidebar_label: "Arbitrator"
sidebar_position: 0
custom_edit_url: null
---

This class implements an interface to interact with the arbitrator contract
to fetch the arbitration details

## Constructors

### constructor

• **new Arbitrator**(`signer`, `chainId`)

Arbitrator Constructor

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signer` | `JsonRpcSigner` | Signer object |
| `chainId` | `number` | Provider chainId |

#### Defined in

[contracts/Arbitrator.ts:31](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/Arbitrator.ts#L31)

## Methods

### getArbitrationFee

▸ **getArbitrationFee**(): `Promise`<`number`\>

This function returns the arbitration fee

#### Returns

`Promise`<`number`\>

The arbitration fee in ETH

#### Defined in

[contracts/Arbitrator.ts:61](https://github.com/safient/safient-claims-js/blob/3387f49/src/contracts/Arbitrator.ts#L61)
