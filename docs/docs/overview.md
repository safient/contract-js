---
id: "overview"
title: "Safient Contracts SDK"
slug: "/"
sidebar_label: "Overview"
sidebar_position: 0
custom_edit_url: null
---

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
