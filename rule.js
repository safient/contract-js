const { Contract } = require('@ethersproject/contracts');
const { JsonRpcProvider } = require('@ethersproject/providers');
const { arbitratorABI } = require('./test/abis/arbitratorABI');
const { SafientClaims } = require('./dist/index');

(async () => {
  // Provider and ChainId
  provider = new JsonRpcProvider('http://localhost:8545');
  const providerNetworkData = await provider.getNetwork();
  chainId = providerNetworkData.chainId;

  // Signers and Signer addresses
  arbitratorSigner = await provider.getSigner(0);
  accountXSigner = await provider.getSigner(19);

  let sc;
  sc = new SafientClaims(accountXSigner, chainId);

  console.log('claim status : ' + (await sc.safientMain.getClaimStatus(0)));

  const arbitratorContractAddress = '0x367761085BF3C12e5DA2Df99AC6E1a824612b8fb';
  const arbitratorContract = new Contract(arbitratorContractAddress, arbitratorABI, arbitratorSigner);

  await arbitratorContract.giveRuling(process.argv[2], process.argv[3]);

  console.log('claim status : ' + (await sc.safientMain.getClaimStatus(0)));
})();
