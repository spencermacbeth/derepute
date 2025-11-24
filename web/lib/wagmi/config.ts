import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'

// Chain-agnostic configuration from environment variables
const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1')
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://eth.llamarpc.com'
const chainName = process.env.NEXT_PUBLIC_NETWORK_NAME || 'Ethereum'

// Define custom chain from environment variables
const customChain = defineChain({
  id: chainId,
  name: chainName,
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
  },
})

export const config = createConfig({
  chains: [customChain],
  transports: {
    [customChain.id]: http(rpcUrl),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
