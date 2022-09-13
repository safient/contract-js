require('@nomiclabs/hardhat-waffle');
const fs = require('fs');
const { network } = require('./constants');

const defaultNetwork = network;

module.exports = {
  defaultNetwork,
  networks: {
    localhost: {
      url: 'http://localhost:8545',
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      blockExplorer: 'https://etherscan.io',
      accounts: {
        mnemonic: mnemonic(),
      },
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      blockExplorer: 'https://rinkeby.etherscan.io',
      accounts: {
        mnemonic: mnemonic(),
      },
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
      blockExplorer: 'https://kovan.etherscan.io',
      accounts: {
        mnemonic: mnemonic(),
      },
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      blockExplorer: 'https://ropsten.etherscan.io',
      accounts: {
        mnemonic: mnemonic(),
      },
    },
    polygontestnet: {
      url: 'https://matic-mumbai.chainstacklabs.com',
      blockExplorer: 'https://mumbai.polygonscan.com',
      accounts: {
        mnemonic: mnemonic(),
      },
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.4.26',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            details: {
              yul: false,
            },
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 100000,
  },
};

function mnemonic() {
  try {
    return fs.readFileSync('./mnemonic.txt').toString().trim();
  } catch (e) {
    if (defaultNetwork !== 'localhost') {
      console.log(
        '☢️ WARNING: No mnemonic file created for a deploy account. Try `npm run generate` and then `npm run account`.'
      );
    }
  }
  return '';
}

const DEBUG = false;

function debug(text) {
  if (DEBUG) {
    console.log(text);
  }
}

task('generate', 'Create a mnemonic for builder deploys', async (_, { ethers }) => {
  const bip39 = require('bip39');
  const hdkey = require('ethereumjs-wallet/hdkey');
  const mnemonic = bip39.generateMnemonic();

  if (DEBUG) console.log('mnemonic', mnemonic);

  const seed = await bip39.mnemonicToSeed(mnemonic);

  if (DEBUG) console.log('seed', seed);

  const hdwallet = hdkey.fromMasterSeed(seed);
  const wallet_hdpath = "m/44'/60'/0'/0/";
  const account_index = 0;

  let fullPath = wallet_hdpath + account_index;

  if (DEBUG) console.log('fullPath', fullPath);

  const wallet = hdwallet.derivePath(fullPath).getWallet();
  const privateKey = '0x' + wallet._privKey.toString('hex');

  if (DEBUG) console.log('privateKey', privateKey);

  var EthUtil = require('ethereumjs-util');

  const address = '0x' + EthUtil.privateToAddress(wallet._privKey).toString('hex');

  console.log('🔐 Account Generated as ' + address + ' and set as mnemonic in root directory');
  console.log("💬 Use 'npm run account' to get more information about the deployment account.");

  fs.writeFileSync('./mnemonic.txt', mnemonic.toString());
});

task('account', 'Get balance informations for the deployment account.', async (_, { ethers }) => {
  const hdkey = require('ethereumjs-wallet/hdkey');
  const bip39 = require('bip39');

  let mnemonic = fs.readFileSync('./mnemonic.txt').toString().trim();

  if (DEBUG) console.log('mnemonic', mnemonic);

  const seed = await bip39.mnemonicToSeed(mnemonic);

  if (DEBUG) console.log('seed', seed);

  const hdwallet = hdkey.fromMasterSeed(seed);
  const wallet_hdpath = "m/44'/60'/0'/0/";
  const account_index = 0;

  let fullPath = wallet_hdpath + account_index;

  if (DEBUG) console.log('fullPath', fullPath);

  const wallet = hdwallet.derivePath(fullPath).getWallet();
  const privateKey = '0x' + wallet._privKey.toString('hex');

  if (DEBUG) console.log('privateKey', privateKey);

  var EthUtil = require('ethereumjs-util');

  const address = '0x' + EthUtil.privateToAddress(wallet._privKey).toString('hex');

  var qrcode = require('qrcode-terminal');

  qrcode.generate(address, { small: true });

  console.log('‍📬 Deployer Account is ' + address);

  for (let n in config.networks) {
    try {
      let provider = new ethers.providers.JsonRpcProvider(config.networks[n].url);
      let balance = await provider.getBalance(address);

      console.log(' -- ' + n + ' --  -- -- 📡 ');
      console.log('   balance: ' + ethers.utils.formatEther(balance));
      console.log('   nonce: ' + (await provider.getTransactionCount(address)));
    } catch (e) {
      if (DEBUG) {
        console.log(e);
      }
    }
  }
});
