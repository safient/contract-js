

const INFURA_API_KEY = process.env.INFURA_API_KEY || process.env.REACT_APP_INFURA_API_KEY;

const networks = {
  localhost: {
    chainId: 31337,
    url: 'http://localhost:8545',
  },
  mainnet: {
    chainId: 1,
    url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
  },
  kovan: {
    chainId: 42,  
    url: `https://kovan.infura.io/v3/${INFURA_API_KEY}`,

  },
  polygontestnet: {
      chainId: 80001,
    url: 'https://matic-mumbai.chainstacklabs.com',
  },
  polygon : {
      chainId: 137,
    url: 'https://matic-mumbai.chainstacklabs.com',
   
  },
}

export const getNetworkUrl = (chainId) => {
  const network = Object.values(networks).find(network => chainId === network.chainId);
  return network.url
}