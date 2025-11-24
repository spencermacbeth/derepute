'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="cyber-card p-8 text-center">
          <h2 className="text-3xl font-bold purple-neon-text mb-4 font-mono">
            [SYSTEM ERROR]
          </h2>
          <p className="text-neon-green/70 mb-6 font-mono text-sm">
            {error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={reset}
            className="cyber-button px-6 py-3 rounded font-mono"
          >
            RETRY
          </button>
        </div>
      </div>
    </div>
  )
}
