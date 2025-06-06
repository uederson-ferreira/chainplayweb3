"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, LogOut, AlertTriangle, Network } from "lucide-react"
import { useState, useEffect } from "react"

export default function WalletConnect() {
  const [mounted, setMounted] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="py-8 text-center">
          <div className="text-white">Loading wallet...</div>
        </CardContent>
      </Card>
    )
  }

  const handleConnect = async (connector: any) => {
    try {
      setConnectionError(null)
      connect({ connector })
    } catch (err: any) {
      console.error("Connection error:", err)
      setConnectionError("Failed to connect wallet. Please try again.")
    }
  }

  const getNetworkName = (chainId?: number) => {
    switch (chainId) {
      case 31337:
        return "Local Network (Anvil)"
      case 1:
        return "Local Anvil Fork" // ← MUDANÇA: reconhecer como rede local
      case 11155111:
        return "Sepolia"
      case 137:
        return "Polygon"
      case 42161:
        return "Arbitrum"
      default:
        return "Unknown Network"
    }
  }

  if (isConnected && address) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Wallet className="h-4 w-4 mr-2" />
              Carteira Conectada
            </CardTitle>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Conectado</Badge>
          </div>
          <CardDescription className="text-slate-400">
            {address.slice(0, 6)}...{address.slice(-4)}
          </CardDescription>
          {chainId && (
            <div className="flex items-center gap-2">
              <Network className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-blue-400">{getNetworkName(chainId)}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => disconnect()}
            variant="outline"
            className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Desconectar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Conectar Carteira</CardTitle>
        <CardDescription className="text-slate-400">
          Conecte sua carteira para jogar. Suporte para múltiplas carteiras.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {connectors.map((connector) => (
          <Button
            key={connector.uid}
            onClick={() => handleConnect(connector)}
            disabled={isPending}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            size="lg"
          >
            <Wallet className="h-4 w-4 mr-2" />
            {isPending ? "Conectando..." : `Conectar ${connector.name}`}
          </Button>
        ))}

        {connectionError && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-md text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Erro de Conexão</span>
            </div>
            <p className="text-xs mt-1">{connectionError}</p>
          </div>
        )}

        <div className="bg-blue-900/50 text-blue-400 border border-blue-700 p-3 rounded-md text-sm">
          <h4 className="font-medium mb-1">Carteiras suportadas:</h4>
          <ul className="text-xs space-y-1">
            <li>• MetaMask, Coinbase, WalletConnect</li>
            <li>• Rainbow, Trust Wallet, Phantom</li>
            <li>• Injected wallets e extensões</li>
          </ul>
        </div>

        <div className="text-xs text-slate-500 text-center">Powered by Wagmi - Conexão segura com carteiras Web3</div>
      </CardContent>
    </Card>
  )
}
