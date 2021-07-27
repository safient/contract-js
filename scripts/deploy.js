const hre = require('hardhat');
const { utils } = require('ethers');
const fs = require('fs');
const R = require('ramda');
const chalk = require('chalk');
const { network, arbitratorContract, arbitrableContract, arbitrationFee, arbitratorAddress } = require('../constants');

const abiEncodeArgs = (deployed, contractArgs) => {
  if (!contractArgs || !deployed || !R.hasPath(['interface', 'deploy'], deployed)) return '';
  const encoded = utils.defaultAbiCoder.encode(deployed.interface.deploy.inputs, contractArgs);
  return encoded;
};

const deploy = async (contractName, _args = [], overrides = {}, libraries = {}) => {
  console.log(` 🛰  Deploying: ${contractName}`);

  const contractArgs = _args || [];
  const contractArtifacts = await hre.ethers.getContractFactory(contractName, { libraries: libraries });
  const deployed = await contractArtifacts.deploy(...contractArgs, overrides);
  const contractArtifact = await hre.artifacts.readArtifact(contractName);
  const encoded = abiEncodeArgs(deployed, contractArgs);

  fs.writeFileSync(`artifacts/${contractName}.address`, deployed.address);
  fs.mkdir('src/artifacts', { recursive: true }, (err) => {
    if (err) throw err;
  });
  const contractData = {
    address: deployed.address,
    abi: contractArtifact.abi,
  };
  fs.writeFileSync(`src/artifacts/${contractName}.json`, JSON.stringify(contractData));

  let extraGasInfo = '';

  if (deployed && deployed.deployTransaction) {
    const gasUsed = deployed.deployTransaction.gasLimit.mul(deployed.deployTransaction.gasPrice);

    extraGasInfo = `${utils.formatEther(gasUsed)} ETH, tx hash ${deployed.deployTransaction.hash}`;
  }

  console.log(' 📄', chalk.cyan(contractName), 'deployed to:', chalk.magenta(deployed.address));
  console.log(' ⛽', chalk.grey(extraGasInfo), '\n');

  if (hre.config.defaultNetwork !== 'localhost' && hre.config.defaultNetwork !== 'hardhat') {
    console.log(
      '\n 🚀 View contract on etherscan: ',
      chalk.green(`https://${hre.config.defaultNetwork}.etherscan.io/address/${deployed.address}`),
      '\n\n'
    );
  }

  if (!encoded || encoded.length <= 2) return deployed;

  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployed;
};

async function main() {
  console.log(' 📡 Deploying...\n');

  if (network === 'localhost') {
    const arbitrator = await deploy(arbitratorContract, [arbitrationFee]);
    await deploy(arbitrableContract, [arbitrator.address]);
  } else {
    await deploy(arbitrableContract, [arbitratorAddress]);
  }

  console.log(' 💾  Artifacts (address, abi, and args) saved to: ', chalk.blue('./artifacts'), '\n\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
