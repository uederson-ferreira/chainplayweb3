"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { config } from "@/lib/web3/config"
import { useState, useEffect } from "react"

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              if (error?.message?.includes("Cross-Origin-Opener-Policy")) {
                return false
              }
              return failureCount < 3
            },
          },
        },
      }),
  )
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes("Cross-Origin-Opener-Policy")) {
        console.warn("COOP error detected, but continuing with limited wallet functionality")
        setError("Some wallet features may be limited due to browser security policies")
      }
    }
    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  // Sempre renderize os provedores, mas controle o conteúdo de children
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {error && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 p-2 text-xs text-center">
            {error}
          </div>
        )}
        {mounted ? children : <div>Carregando...</div>}
      </QueryClientProvider>
    </WagmiProvider>
  )
}