"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, Users, Trophy, Zap, AlertTriangle } from "lucide-react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import WalletConnectButton from "@/components/web3/wallet-connect-button"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/auth/login-form"

export default function HomePage() {
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [web3Error, setWeb3Error] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const checkConnection = async () => {
    try {
      // First check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.log("Supabase not configured, running in demo mode")
        setError("Running in demo mode - Supabase not configured")
        setLoading(false)
        return
      }

      // Try to connect to Supabase with timeout
      const supabase = createClient()

      // Add a timeout to the request
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 5000))

      const connectionPromise = supabase.from("profiles").select("count").limit(1)

      const { data, error } = (await Promise.race([connectionPromise, timeoutPromise])) as any

      if (error) {
        console.error("Supabase connection error:", error)
        setError("Database connection failed - Running in demo mode")
      } else {
        console.log("Supabase connected successfully")
        setError(null)
      }
    } catch (err: any) {
      console.error("Connection test failed:", err)
      if (err.message?.includes("Failed to fetch")) {
        setError("Network connection failed - Running in demo mode")
      } else if (err.message?.includes("timeout")) {
        setError("Connection timeout - Running in demo mode")
      } else {
        setError("Connection test failed - Running in demo mode")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Listener para erros Web3/COOP
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes("Cross-Origin-Opener-Policy")) {
        setWeb3Error("Some wallet features may be limited due to browser security policies")
      }
    }

    window.addEventListener("error", handleError)
    checkConnection()

    return () => window.removeEventListener("error", handleError)
  }, [])

  const handleStartPlaying = () => {
    router.push("/dashboard")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="container mx-auto px-4 py-10 flex justify-center">
          <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Login */}
      <div className="container mx-auto px-4 py-10 flex justify-center">
        <LoginForm />
      </div>
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">ChainPlay</h1>
          </div>
          <div className="flex items-center gap-4">
            {web3Error && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 px-3 py-1 rounded text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Limited wallet support
              </div>
            )}
            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
            🎮 Web3 Gaming Platform
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Decentralized
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {" "}
              Bingo{" "}
            </span>
            Gaming
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience the future of gaming with blockchain-powered bingo. Transparent, fair, and rewarding gameplay on
            the decentralized web.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Demo Mode Active</span>
              </div>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2 text-blue-300">
                All Web3 features are available. Authentication will use demo mode.
              </p>
            </div>
          )}

          {web3Error && (
            <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-200">
              <div className="flex items-center gap-2 justify-center">
                <AlertTriangle className="h-4 w-4" />
                <span>{web3Error}</span>
              </div>
              <p className="text-xs mt-2">Try refreshing the page or using MetaMask for best experience</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-semibold"
              onClick={handleStartPlaying}
            >
              Start Playing
            </Button>
            <WalletConnectButton variant="outline" redirectToDashboard={true} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Instant Rewards</CardTitle>
              <CardDescription className="text-gray-300">
                Win cryptocurrency instantly with every game. No waiting, no delays.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Universal Wallet Support</CardTitle>
              <CardDescription className="text-gray-300">
                Connect with MetaMask, WalletConnect and other popular wallets.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-red-500 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Provably Fair</CardTitle>
              <CardDescription className="text-gray-300">
                Blockchain-verified randomness ensures every game is completely fair.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2024 ChainPlay. Built on the blockchain for the future of gaming.</p>
        </div>
      </footer>
    </div>
  )
}
