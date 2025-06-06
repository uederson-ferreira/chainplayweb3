// Arquivo: hooks/use-wallet-connection.ts

"use client"

import { useState, useEffect } from "react"
import { useAccount, useConnect } from "wagmi"

export function useWalletConnection() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { isPending: isConnectPending } = useConnect() // ← CORRIGIDO: isPending em vez de isLoading
  
  const [showConnectingState, setShowConnectingState] = useState(false)
  const [connectionStartTime, setConnectionStartTime] = useState<number>(0)

  // Detectar quando uma conexão foi iniciada
  useEffect(() => {
    if (isConnecting || isConnectPending || isReconnecting) {
      console.log('🔄 Iniciando processo de conexão...')
      setShowConnectingState(true)
      setConnectionStartTime(Date.now())
    }
  }, [isConnecting, isConnectPending, isReconnecting])

  // Controlar quando parar de mostrar o estado "conectando"
  useEffect(() => {
    if (isConnected) {
      // Sucesso - esconder após pequeno delay para transição suave
      console.log('✅ Carteira conectada com sucesso!')
      setTimeout(() => {
        setShowConnectingState(false)
      }, 1000)
      return
    }

    if (showConnectingState && !isConnecting && !isConnectPending && !isReconnecting && connectionStartTime > 0) {
      // Conexão terminou (rejeitada ou erro)
      const timeSinceConnection = Date.now() - connectionStartTime
      
      if (timeSinceConnection > 3000) { // Mínimo 3 segundos
        console.log('❌ Conexão cancelada ou falhou')
        setShowConnectingState(false)
      }
    }
  }, [isConnected, isConnecting, isConnectPending, isReconnecting, showConnectingState, connectionStartTime])

  // Timeout de segurança para casos extremos
  useEffect(() => {
    if (showConnectingState) {
      const safetyTimer = setTimeout(() => {
        console.log('⏰ Timeout de segurança - parando estado connecting')
        setShowConnectingState(false)
      }, 15000) // 15 segundos máximo
      
      return () => clearTimeout(safetyTimer)
    }
  }, [showConnectingState])

  const resetConnection = () => {
    console.log('🔄 Resetando estado de conexão...')
    setShowConnectingState(false)
  }

  return {
    // Estados da carteira
    address,
    isConnected,
    
    // Estados de processo
    isConnecting: isConnecting || isConnectPending || isReconnecting,
    showConnectingState,
    
    // Ações
    resetConnection,
    
    // Estados combinados para UI
    shouldShowConnectingUI: showConnectingState || isConnecting || isConnectPending || isReconnecting,
    shouldShowGame: isConnected && !showConnectingState,
    shouldShowInitialState: !isConnected && !showConnectingState && !isConnecting && !isConnectPending && !isReconnecting,
  }
}