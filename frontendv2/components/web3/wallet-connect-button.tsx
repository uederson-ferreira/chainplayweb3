"use client"

import { useAccount, useConnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface WalletConnectButtonProps {
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
  redirectToDashboard?: boolean
}

export default function WalletConnectButton({
  variant = "default",
  size = "default",
  redirectToDashboard = false,
}: WalletConnectButtonProps) {
  const [mounted, setMounted] = useState(false)
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirecionar para dashboard quando conectar (se solicitado)
  useEffect(() => {
    if (mounted && isConnected && redirectToDashboard) {
      router.push("/dashboard")
    }
  }, [isConnected, mounted, redirectToDashboard, router])

  if (!mounted) {
    return (
      <Button variant={variant} size={size} disabled>
        Loading...
      </Button>
    )
  }

  const handleConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] })
    }
  }

  const handleManageWallet = () => {
    router.push("/dashboard")
  }

  return (
    <Button
      onClick={isConnected ? handleManageWallet : handleConnect}
      variant={variant}
      size={size}
      className={
        variant === "outline"
          ? "border-white/20 text-white hover:bg-white/10"
          : "bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
      }
    >
      <Wallet className="h-4 w-4 mr-2" />
      {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect Wallet"}
    </Button>
  )
}
