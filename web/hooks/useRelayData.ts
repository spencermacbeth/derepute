import { useReadContract } from 'wagmi'
import { CONTRACT_ABI, getContractAddress } from '@/lib/contract'

/**
 * Get chain ID from environment variable
 * NEXT_PUBLIC_CHAIN_ID should be set to the target chain
 * Examples: 1 (Ethereum), 8453 (Base), 1337 (Local Hardhat)
 */
function getChainId() {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
  if (!chainId) {
    throw new Error('NEXT_PUBLIC_CHAIN_ID environment variable is not set')
  }
  return parseInt(chainId)
}

export function useRelayCount() {
  const address = getContractAddress()
  const chainId = getChainId()

  return useReadContract({
    address,
    abi: CONTRACT_ABI,
    functionName: 'getRelayCount',
    chainId,
  })
}

export function useRelaysPaginated(offset: number, limit: number) {
  const address = getContractAddress()
  const chainId = getChainId()

  return useReadContract({
    address,
    abi: CONTRACT_ABI,
    functionName: 'getRelaysPaginated',
    args: [BigInt(offset), BigInt(limit)],
    chainId,
  })
}

export function useRelay(fingerprint?: string) {
  const address = getContractAddress()
  const chainId = getChainId()

  return useReadContract({
    address,
    abi: CONTRACT_ABI,
    functionName: 'getRelay',
    args: fingerprint ? [fingerprint] : undefined,
    chainId,
    query: {
      enabled: !!fingerprint && !!address,
    },
  })
}
