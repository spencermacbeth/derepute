'use client'

import { useRelayCount, useRelaysPaginated } from '@/hooks/useRelayData'
import { useState, useEffect } from 'react'

// Constants
const PAGE_SIZE = 10 // Number of relays to show per page
const FETCH_BATCH_SIZE = 50 // Number of relays to fetch per batch during search
const BATCH_DELAY_MS = 500 // Delay between batch fetches to avoid rate limiting
const MAX_RETRY_ATTEMPTS = 5 // Maximum retry attempts for failed batches
const CACHE_TTL_MS = 5 * 60 * 1000 // Cache time-to-live: 5 minutes

interface CacheData {
  relays: any[]
  timestamp: number
}

export default function Home() {
  const [page, setPage] = useState(0)
  const [copiedFp, setCopiedFp] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cacheData, setCacheData] = useState<CacheData | null>(null)
  const [isLoadingAll, setIsLoadingAll] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  const { data: totalCount } = useRelayCount()
  const { data: relays, isLoading: isLoadingPage } = useRelaysPaginated(page * PAGE_SIZE, PAGE_SIZE)

  const relayArray = Array.isArray(relays) ? relays : []

  // Function to fetch all relays in batches progressively with retry logic
  const fetchAllRelaysProgressively = async () => {
    if (!totalCount) return

    setIsLoadingAll(true)
    setLoadingProgress(0)
    const allRelays: any[] = []

    try {
      const { createPublicClient, http } = await import('viem')
      const { CONTRACT_ABI, getContractAddress } = await import('@/lib/contract')

      const client = createPublicClient({
        transport: http(process.env.NEXT_PUBLIC_RPC_URL)
      })

      const contractAddress = getContractAddress()
      const total = Number(totalCount)
      const batchSize = 50  // Reduced batch size to avoid rate limits
      const batches = Math.ceil(total / batchSize)

      for (let i = 0; i < batches; i++) {
        const offset = i * batchSize
        const limit = Math.min(batchSize, total - offset)

        // Retry logic with exponential backoff
        let retries = 0
        let success = false
        let batchData: any[] = []

        while (!success && retries < 5) {
          try {
            batchData = await client.readContract({
              address: contractAddress as `0x${string}`,
              abi: CONTRACT_ABI,
              functionName: 'getRelaysPaginated',
              args: [BigInt(offset), BigInt(limit)],
            }) as any[]
            success = true
          } catch (error: any) {
            retries++
            if (error.message?.includes('rate limit') || error.message?.includes('429')) {
              // Exponential backoff: 1s, 2s, 4s, 8s, 16s
              const delay = Math.pow(2, retries) * 1000
              console.log(`Rate limited, waiting ${delay}ms before retry ${retries}/5...`)
              await new Promise(resolve => setTimeout(resolve, delay))
            } else {
              throw error
            }
          }
        }

        if (!success) {
          console.error(`Failed to fetch batch after ${retries} retries`)
          break
        }

        allRelays.push(...batchData)

        // Update cache with timestamp after each batch
        setCacheData({
          relays: [...allRelays],
          timestamp: Date.now()
        })
        setLoadingProgress(Math.round(((i + 1) / batches) * 100))

        // Longer delay to prevent rate limiting (500ms between requests)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('Error fetching all relays:', error)
    } finally {
      setIsLoadingAll(false)
      setLoadingProgress(100)
    }
  }

  // Trigger progressive fetch when search is initiated
  useEffect(() => {
    if (searchQuery && (!cacheData || cacheData.relays.length === 0) && !isLoadingAll) {
      fetchAllRelaysProgressively()
    }
  }, [searchQuery])

  // Use cached data when searching, otherwise use current page
  const dataSource = searchQuery && cacheData && cacheData.relays.length > 0 ? cacheData.relays : relayArray

  // Sort relays by uptime (descending)
  const sortedRelays = [...dataSource].sort((a: any, b: any) => {
    return Number(b.uptime) - Number(a.uptime)
  })

  // Filter relays based on search query
  const filteredRelays = sortedRelays.filter((relay: any) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    const fingerprint = relay.fingerprint?.toLowerCase() || ''
    const nickname = relay.nickname?.toLowerCase() || ''
    const country = relay.country?.toLowerCase() || ''

    return fingerprint.includes(query) ||
           nickname.includes(query) ||
           country.includes(query)
  })

  // Apply client-side pagination to filtered results when searching
  const paginatedFilteredRelays = searchQuery
    ? filteredRelays.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : filteredRelays

  // Calculate total pages based on filtered results
  const totalPages = searchQuery
    ? Math.ceil(filteredRelays.length / PAGE_SIZE)
    : (totalCount ? Math.ceil(Number(totalCount) / PAGE_SIZE) : 0)

  // Reset to page 0 when search query changes
  useEffect(() => {
    setPage(0)
  }, [searchQuery])

  const isLoading = isLoadingPage

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFp(text)
      setTimeout(() => setCopiedFp(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <>
      {/* Starfield Background */}
      <div className="starfield"></div>

      {/* Scanline Effect */}
      <div className="scanline"></div>

      {/* Content */}
      <div className="content-wrapper min-h-screen">
        {/* Header */}
        <header className="cyber-gradient">
          <div className="container mx-auto px-4 py-6 md:py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="w-full md:w-auto">
                <h1 className="text-3xl md:text-5xl font-bold purple-neon-text glitch mb-2 break-words">
                  [DEREPUTE]
                </h1>
                <p className="text-sm md:text-lg text-neon-green/70 font-mono break-words">
                  &gt;_ DECENTRALIZED TOR REPUTATION ORACLE
                </p>
              </div>
              <div className="text-left md:text-right w-full md:w-auto">
                <div className="text-xs md:text-sm text-neon-green/60 font-mono mb-1">NETWORK_ID</div>
                <div className="text-base md:text-lg text-cyber-blue font-bold break-words">
                  CHAIN::{process.env.NEXT_PUBLIC_CHAIN_ID || 'UNKNOWN'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="cyber-card p-6">
              <div className="text-xs text-neon-green/60 font-mono mb-2">TOTAL_RELAYS</div>
              <div className="text-4xl font-bold neon-text">
                {totalCount ? Number(totalCount).toLocaleString() : '---'}
              </div>
            </div>
            <div className="cyber-card p-6">
              <div className="text-xs text-neon-green/60 font-mono mb-2">NETWORK_STATUS</div>
              <div className="text-2xl font-bold text-cyber-blue">
                ● ONLINE
              </div>
            </div>
            <div className="cyber-card p-6">
              <div className="text-xs text-neon-green/60 font-mono mb-2">CHAIN_SYNC</div>
              <div className="text-2xl font-bold purple-neon-text">
                ✓ VERIFIED
              </div>
            </div>
          </div>

          {/* Relay List Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold neon-text mb-2">
              &gt; TOR RELAY NODES
            </h2>
            <div className="h-0.5 bg-gradient-to-r from-neon-green via-neon-purple to-transparent"></div>
          </div>

          {/* Search Box */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH BY FINGERPRINT, NAME, OR LOCATION..."
                className="w-full px-4 py-3 bg-black/60 border-2 border-neon-green/30 rounded text-neon-green font-mono placeholder-neon-green/40 focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/20"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setCacheData(null)
                    setIsLoadingAll(false)
                    setLoadingProgress(0)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-green/60 hover:text-neon-green"
                  title="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2">
                <p className="text-xs text-neon-green/60 font-mono">
                  RESULTS: {filteredRelays.length} RELAY{filteredRelays.length !== 1 ? 'S' : ''} FOUND
                  {isLoadingAll && ` (LOADING: ${loadingProgress}%)`}
                </p>
                {isLoadingAll && (
                  <div className="mt-2 bg-black/60 border border-neon-green/30 rounded overflow-hidden">
                    <div
                      className="h-1 bg-gradient-to-r from-neon-green via-neon-purple to-neon-cyan transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="cyber-card p-12 text-center">
              <div className="text-neon-green text-xl font-mono animate-pulse">
                [LOADING DATA...]
              </div>
            </div>
          ) : paginatedFilteredRelays.length > 0 ? (
            <div className="space-y-4">
              {paginatedFilteredRelays.map((relay: any, index: number) => (
                <div key={index} className="cyber-card p-4 md:p-6 hover:scale-[1.01]">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-3">
                    <div className="flex-1 w-full overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                        <h3 className="text-xl md:text-2xl font-bold purple-neon-text font-mono break-words">
                          {relay.nickname}
                        </h3>
                        <span className={`px-2 md:px-3 py-1 rounded text-xs font-bold border-2 whitespace-nowrap ${
                          relay.running
                            ? 'border-neon-green text-neon-green bg-neon-green/10'
                            : 'border-red-500 text-red-500 bg-red-500/10'
                        }`}>
                          {relay.running ? '● ACTIVE' : '○ OFFLINE'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full">
                        <p className="text-xs md:text-sm text-neon-green/50 font-mono tracking-wider break-all flex-1 min-w-0">
                          FP: {relay.fingerprint}
                        </p>
                        <button
                          onClick={() => copyToClipboard(relay.fingerprint)}
                          className="flex-shrink-0 p-2 border border-neon-green/30 rounded hover:border-neon-green hover:bg-neon-green/10 transition-all"
                          title="Copy fingerprint"
                        >
                          {copiedFp === relay.fingerprint ? (
                            <svg className="w-4 h-4 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-neon-green/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 font-mono">
                    <div className="bg-black/40 p-2 md:p-3 rounded border border-neon-green/20">
                      <p className="text-xs text-neon-green/60 mb-1">UPTIME</p>
                      <p className="text-base md:text-xl text-cyber-blue font-bold break-words">
                        {(Number(relay.uptime) / 10).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-black/40 p-2 md:p-3 rounded border border-neon-green/20">
                      <p className="text-xs text-neon-green/60 mb-1">BANDWIDTH</p>
                      <p className="text-base md:text-xl text-cyber-blue font-bold break-words">
                        {(Number(relay.bandwidth) / 1000000).toFixed(1)} MB/s
                      </p>
                    </div>
                    <div className="bg-black/40 p-2 md:p-3 rounded border border-neon-green/20">
                      <p className="text-xs text-neon-green/60 mb-1">CONSENSUS</p>
                      <p className="text-base md:text-xl text-cyber-blue font-bold break-words">
                        {Number(relay.consensusWeight).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-black/40 p-2 md:p-3 rounded border border-neon-green/20">
                      <p className="text-xs text-neon-green/60 mb-1">LOCATION</p>
                      <p className="text-base md:text-xl text-cyber-blue font-bold uppercase break-words">
                        {relay.country}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {relay.flags.map((flag: string) => (
                      <span
                        key={flag}
                        className="px-2 py-1 bg-neon-purple/20 border border-neon-purple/50 text-neon-purple text-xs rounded font-mono"
                      >
                        [{flag}]
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : sortedRelays.length > 0 ? (
            <div className="cyber-card p-12 text-center">
              <p className="text-neon-green/70 text-lg font-mono">
                [NO MATCHES FOUND]
              </p>
              <p className="text-neon-green/50 text-sm font-mono mt-2">
                TRY A DIFFERENT SEARCH QUERY
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 cyber-button px-6 py-2 rounded"
              >
                CLEAR SEARCH
              </button>
            </div>
          ) : (
            <div className="cyber-card p-12 text-center">
              <p className="text-neon-green/70 text-lg font-mono">
                [NO RELAY DATA AVAILABLE]
              </p>
              <p className="text-neon-green/50 text-sm font-mono mt-2">
                CHECK NETWORK CONNECTION :: CHAIN_ID={process.env.NEXT_PUBLIC_CHAIN_ID || 'NOT_SET'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="cyber-button px-6 py-3 rounded disabled:opacity-30"
              >
                &lt;&lt; PREV
              </button>
              <span className="px-6 py-3 text-neon-green font-mono text-lg">
                [{page + 1}/{totalPages}]
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="cyber-button px-6 py-3 rounded disabled:opacity-30"
              >
                NEXT &gt;&gt;
              </button>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t-2 border-neon-green/30 mt-16 py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-neon-green/50 text-sm font-mono">
              [DATA FROM ONIONOO API] :: [CHAIN ID: {process.env.NEXT_PUBLIC_CHAIN_ID || 'NOT_SET'}]
            </p>
            <p className="text-neon-green/30 text-xs font-mono mt-2">
              &gt; BLOCKCHAIN ORACLE FOR TOR NETWORK REPUTATION DATA
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
