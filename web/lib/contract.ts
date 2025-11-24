import contractABI from './TorReputationStore-abi.json'
import type { Abi } from 'viem'

export const CONTRACT_ABI = contractABI as Abi

/**
 * Get the contract address for the current chain
 * Uses NEXT_PUBLIC_CONTRACT_ADDRESS environment variable
 */
export function getContractAddress(): `0x${string}` | undefined {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  if (!address) {
    console.warn('NEXT_PUBLIC_CONTRACT_ADDRESS not set in environment variables')
    return undefined
  }
  return address as `0x${string}`
}
