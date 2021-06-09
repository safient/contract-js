require('@nomiclabs/hardhat-waffle');
const { network } = require('./constants');

const defaultNetwork = network;

module.exports = {
  defaultNetwork,
  networks: {
    localhost: {
      url: 'http://localhost:8545',
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
        version: '0.7.0',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};
