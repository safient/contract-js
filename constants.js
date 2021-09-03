const { utils } = require('ethers');

const network = 'localhost';

// local
const arbitratorContract = 'AutoAppealableArbitrator';
const arbitrationFee = utils.parseEther('0.001').toNumber();

// testnet
const arbitratorAddress = '0x269C347C6F15d18C8292CB1B8Fc91df9ddAE9883';

// local && testnet
const arbitrableContract = 'SafientMain';

module.exports = { network, arbitratorContract, arbitrableContract, arbitrationFee, arbitratorAddress };
