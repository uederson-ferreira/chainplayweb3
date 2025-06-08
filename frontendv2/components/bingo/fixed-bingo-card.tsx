"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Hash, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { useAccount } from "wagmi"
import { useCartelaContract } from "@/lib/web3/hooks/use-cartela-contract"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

// Tipos flexíveis para diferentes fontes de dados
type BingoCardSupabase = {
  id: string
  user_id: string | null
  card_data: any
  rows: number
  columns: number
  created_at: string
}

type BingoCardBlockchain = {
  id: string
  cartela?: [bigint, number, number, string, boolean, boolean, bigint]
  numeros?: number[]
  card_data: { 
    numbers: number[]
  }
  rows: number
  columns: number
  hasNumbers?: boolean
  emUso?: boolean
  preco?: bigint
}

type BingoCardUnified = BingoCardSupabase | BingoCardBlockchain

interface BingoCardProps {
  card: BingoCardUnified
  drawnNumbers: number[]
  onJoinRound: (cardId: string) => void
  onRegisterNumbers?: (cardId: string) => void
  isParticipating: boolean
  canJoin: boolean
  isRegisteringNumbers?: boolean
  // NOVO: Informações sobre rodadas ativas
  hasActiveRounds?: boolean
  activeRoundsCount?: number
}

function isBlockchainCard(card: BingoCardUnified): card is BingoCardBlockchain {
  return 'cartela' in card || 'emUso' in card || 'preco' in card
}

export default function FixedBingoCard({ 
  card, 
  drawnNumbers, 
  onJoinRound, 
  onRegisterNumbers,
  isParticipating, 
  canJoin,
  isRegisteringNumbers = false,
  hasActiveRounds = false,
  activeRoundsCount = 0
}: BingoCardProps) {
  const { address, isConnected } = useAccount()
  const { registrarNumeros } = useCartelaContract()
  const { toast } = useToast()
  const [isLocalRegistering, setIsLocalRegistering] = useState(false)

  // ===== LÓGICA MELHORADA PARA DETECTAR ESTADO DA CARTELA =====
  
  // 1. Verificar se tem números
  const numbers = card.card_data?.numbers || []
  const hasValidNumbers = numbers.length > 0 && numbers.some((n: number) => n > 0)
  
  // 2. Verificar se números estão registrados na blockchain
  const numerosRegistradosBlockchain = isBlockchainCard(card) 
    ? (card.cartela?.[4] || card.hasNumbers || false)
    : false
  
  // 3. Estado final: tem números E estão registrados
  const cartelaCompleta = hasValidNumbers && numerosRegistradosBlockchain
  
  // 4. Status de uso
  const cartelaEmUso = isBlockchainCard(card) && (card.cartela?.[5] || card.emUso || false)
  const cartelaGasta = isBlockchainCard(card) && card.cartela?.[6] // foiGasta está no índice 6
  
  console.log('🔍 Debug da cartela:', {
    id: card.id,
    hasValidNumbers,
    numerosRegistradosBlockchain,
    cartelaCompleta,
    cartelaEmUso,
    cartelaGasta,
    hasActiveRounds,
    canJoin,
    isConnected
  })

  // ===== FUNÇÃO INTEGRADA PARA REGISTRAR NÚMEROS =====
  const handleRegisterNumbers = async () => {
    console.log('🚀 INICIANDO REGISTRO para cartela:', card.id)
    
    if (!isConnected) {
      toast({
        title: "Carteira não conectada",
        description: "Conecte sua carteira primeiro",
        variant: "destructive"
      })
      return
    }

    setIsLocalRegistering(true)
    
    try {
      // Gerar números únicos
      const totalNumbers = card.rows * card.columns
      const numbersSet = new Set<number>()
      
      while (numbersSet.size < totalNumbers) {
        numbersSet.add(Math.floor(Math.random() * 75) + 1)
      }
      
      const uniqueNumbers = Array.from(numbersSet).map(n => BigInt(n))
      
      console.log(`🎲 Registrando ${totalNumbers} números únicos:`, uniqueNumbers.slice(0, 5).map(n => n.toString()))
      
      toast({
        title: "Preparando transação...",
        description: `Gerando ${totalNumbers} números únicos. MetaMask abrirá em breve.`,
      })
      
      await registrarNumeros(BigInt(card.id), uniqueNumbers)
      
      toast({
        title: "Transação enviada!",
        description: "Aguardando confirmação...",
      })
      
      // Aguardar e recarregar
      setTimeout(() => {
        window.location.reload()
      }, 8000)
      
    } catch (error: any) {
      console.error('❌ Erro ao registrar números:', error)
      
      let errorMessage = "Erro desconhecido"
      if (error.message?.includes("user rejected")) {
        errorMessage = "Transação cancelada na MetaMask"
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "ETH insuficiente para gas"
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Erro ao registrar números",
        description: errorMessage,
        variant: "destructive"
      })
      
    } finally {
      setIsLocalRegistering(false)
    }
  }

  // ===== LÓGICA DO BOTÃO PRINCIPAL =====
  const getButtonContent = () => {
    if (!isConnected) {
      return {
        variant: "outline" as const,
        disabled: true,
        icon: AlertTriangle,
        text: "Conecte a Carteira",
        description: "Conecte sua carteira para usar a cartela"
      }
    }

    if (cartelaGasta) {
      return {
        variant: "outline" as const,
        disabled: true,
        icon: CheckCircle,
        text: "Cartela Usada",
        description: "Esta cartela já foi usada em uma rodada"
      }
    }

    if (!cartelaCompleta) {
      return {
        variant: "default" as const,
        disabled: isLocalRegistering || isRegisteringNumbers,
        icon: isLocalRegistering || isRegisteringNumbers ? Loader2 : Hash,
        text: isLocalRegistering || isRegisteringNumbers ? "Processando..." : "Registrar Números",
        description: "Clique para gerar números únicos automaticamente",
        action: handleRegisterNumbers
      }
    }

    if (!hasActiveRounds) {
      return {
        variant: "outline" as const,
        disabled: true,
        icon: AlertTriangle,
        text: "Sem Rodadas Ativas",
        description: `Aguardando criação de rodadas (${activeRoundsCount} ativas)`
      }
    }

    if (cartelaEmUso) {
      return {
        variant: "default" as const,
        disabled: true,
        icon: Play,
        text: "Em Uso na Rodada",
        description: "Esta cartela está participando de uma rodada ativa"
      }
    }

    if (isParticipating) {
      return {
        variant: "default" as const,
        disabled: true,
        icon: Play,
        text: "Participando",
        description: "Você já está participando com esta cartela"
      }
    }

    return {
      variant: "default" as const,
      disabled: !canJoin,
      icon: Play,
      text: "Usar Cartela",
      description: canJoin ? "Clique para participar da rodada ativa" : "Aguarde uma rodada disponível",
      action: () => onJoinRound(card.id)
    }
  }

  const buttonConfig = getButtonContent()

  return (
    <Card className="bg-slate-700/50 border-slate-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white">Cartela #{card.id.slice(-8)}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs text-slate-300">
              {card.rows}x{card.columns}
            </Badge>
            
            {/* Status da cartela */}
            {cartelaGasta ? (
              <Badge className="text-xs bg-gray-500/20 text-gray-400 border-gray-500/30">
                Usada
              </Badge>
            ) : cartelaEmUso ? (
              <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                Em Uso
              </Badge>
            ) : cartelaCompleta ? (
              <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                Pronta
              </Badge>
            ) : hasValidNumbers ? (
              <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Pendente Blockchain
              </Badge>
            ) : (
              <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                Sem Números
              </Badge>
            )}

            {/* Preço */}
            {isBlockchainCard(card) && (card.preco || card.cartela?.[6]) && (
              <Badge variant="outline" className="text-xs text-blue-400">
                {((Number(card.preco || card.cartela?.[6] || 0)) / 1e18).toFixed(3)} ETH
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Grid da Cartela */}
        <div
          className="grid gap-1 text-xs"
          style={{
            gridTemplateColumns: `repeat(${card.columns}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: card.rows * card.columns }).map((_, index) => {
            const number = numbers[index] || 0
            const isDrawn = number > 0 && drawnNumbers.includes(number)
            const hasValidNumber = number > 0
            
            return (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center rounded border text-xs font-medium
                  ${
                    isDrawn
                      ? "bg-green-500/30 border-green-500 text-green-400"
                      : hasValidNumber
                      ? "bg-slate-600/50 border-slate-500 text-slate-300"
                      : "bg-slate-800/50 border-slate-700 text-slate-500"
                  }
                `}
              >
                {hasValidNumber ? number : "?"}
              </div>
            )
          })}
        </div>

        {/* Botão Principal */}
        <div className="space-y-2">
          <Button
            size="sm"
            variant={buttonConfig.variant}
            onClick={buttonConfig.action}
            disabled={buttonConfig.disabled}
            className={`flex-1 w-full ${
              buttonConfig.variant === "default" 
                ? "bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600" 
                : ""
            }`}
          >
            <buttonConfig.icon className={`h-3 w-3 mr-1 ${
              (isLocalRegistering || isRegisteringNumbers) ? 'animate-spin' : ''
            }`} />
            {buttonConfig.text}
          </Button>
          
          {/* Descrição do estado */}
          <p className="text-xs text-slate-400 text-center">
            {buttonConfig.description}
          </p>
        </div>

        {/* Debug Info (desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-slate-500 border-t border-slate-600 pt-2 mt-2">
            <div>Números: {hasValidNumbers ? "✓" : "✗"}</div>
            <div>Blockchain: {numerosRegistradosBlockchain ? "✓" : "✗"}</div>
            <div>Rodadas: {hasActiveRounds ? `${activeRoundsCount} ativas` : "Nenhuma"}</div>
            <div>Pode entrar: {canJoin ? "✓" : "✗"}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}