import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, hardhat, baseGoerli } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Vault Toy',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'temp-project-id',
  chains: [baseGoerli, mainnet, sepolia, hardhat],
  ssr: true,
});

// Export chains for backwards compatibility if needed elsewhere
export const chains = [baseGoerli, mainnet, sepolia, hardhat];