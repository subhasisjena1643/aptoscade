import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const network = (process.env.APTOS_NETWORK as Network) || Network.DEVNET;

const aptosConfig = new AptosConfig({
  network,
  fullnode: process.env.APTOS_NODE_URL,
  faucet: process.env.APTOS_FAUCET_URL,
});

export const aptos = new Aptos(aptosConfig);

export const getAptosConfig = () => ({
  network,
  nodeUrl: process.env.APTOS_NODE_URL || 'https://fullnode.devnet.aptoslabs.com/v1',
  faucetUrl: process.env.APTOS_FAUCET_URL || 'https://faucet.devnet.aptoslabs.com',
});

export default aptos;
