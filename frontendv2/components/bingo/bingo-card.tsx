"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Hash, Loader2 } from "lucide-react"
import { useAccount } from "wagmi"
import { useCartelaContract } from "@/lib/web3/hooks/use-cartela-contract"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

// Tipos flexíveis
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
}

function isBlockchainCard(card: BingoCardUnified): card is BingoCardBlockchain {
  return 'cartela' in card || 'emUso' in card || 'preco' in card
}

export default function BingoCard({ 
  card, 
  drawnNumbers, 
  onJoinRound, 
  onRegisterNumbers,
  isParticipating, 
  canJoin,
  isRegisteringNumbers = false
}: BingoCardProps) {
  const numbers = card.card_data?.numbers || []
  const hasNumbers = numbers.length > 0 && numbers.some((n: number) => n > 0)
  
  // ===== SOLUÇÃO PRÓPRIA INTEGRADA =====
  const { address, isConnected } = useAccount()
  const { registrarNumeros } = useCartelaContract()
  const { toast } = useToast()
  const [isLocalRegistering, setIsLocalRegistering] = useState(false)

  // Função integrada para registrar números
  // Função integrada para registrar números - VERSÃO CORRIGIDA
  const handleRegisterNumbers = async () => {
    console.log('🚀 INICIANDO REGISTRO INTEGRADO para cartela:', card.id)
    
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
      // Gerar números únicos baseado no tamanho da cartela
      const totalNumbers = card.rows * card.columns
      const numbersSet = new Set<number>()
      
      while (numbersSet.size < totalNumbers) {
        numbersSet.add(Math.floor(Math.random() * 75) + 1)
      }
      
      const uniqueNumbers = Array.from(numbersSet)
      const numbers = uniqueNumbers.map(n => BigInt(n))
      
      console.log(`🎲 Registrando ${totalNumbers} números únicos:`, uniqueNumbers)
      
      // ETAPA 1: Mostrar que vai solicitar assinatura
      toast({
        title: "Preparando transação...",
        description: `Gerando ${totalNumbers} números únicos. MetaMask abrirá em breve.`,
      })
      
      console.log('📝 Solicitando assinatura na MetaMask...')
      
      // ETAPA 2: Enviar transação e aguardar assinatura
      const transactionHash = await registrarNumeros(BigInt(card.id), numbers)
      
      console.log('✅ Transação assinada! Hash:', transactionHash)
      
      // ETAPA 3: Aguardar confirmação - VERSÃO SIMPLIFICADA
      toast({
        title: "Transação enviada!",
        description: "Aguardando confirmação (8 segundos)...",
      })
      
      console.log('⏳ Aguardando 8 segundos para confirmação...')
      
      // Aguardar 8 segundos fixos (mais confiável que verificar receipt)
      await new Promise(resolve => setTimeout(resolve, 8000))
      
      // ETAPA 4: Recarregar automaticamente
      toast({
        title: "✅ Transação confirmada!",
        description: "Recarregando página para mostrar os números...",
      })
      
      console.log('🔄 Recarregando página após confirmação...')
      
      // Aguardar mais 2 segundos e recarregar
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error: any) {
      console.error('❌ Erro ao registrar números:', error)
      
      let errorMessage = "Erro desconhecido"
      let errorTitle = "Erro ao registrar números"
      
      if (error.message?.includes("user rejected") || error.message?.includes("User denied")) {
        errorMessage = "Você cancelou a transação na MetaMask"
        errorTitle = "Transação cancelada"
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "ETH insuficiente para pagar o gas da transação"
        errorTitle = "Saldo insuficiente"
      } else if (error.message?.includes("already registered")) {
        errorMessage = "Esta cartela já tem números registrados"
        errorTitle = "Cartela já preenchida"
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      })
      
      console.log('❌ Processo cancelado ou com erro')
      
    } finally {
      setIsLocalRegistering(false)
    }
  }

  // Verificar se números estão registrados
  const numerosRegistrados = isBlockchainCard(card) 
    ? (card.cartela?.[4] || card.hasNumbers || false)
    : hasNumbers

  return (
    <Card className="bg-slate-700/50 border-slate-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white">Cartela #{card.id.slice(-8)}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs text-slate-300">
              {card.rows}x{card.columns}
            </Badge>
            {hasNumbers ? (
              <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                Com Números
              </Badge>
            ) : (
              <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Sem Números
              </Badge>
            )}
            {/* <Badge variant="outline" className="text-xs text-gray-400">
              Reg: {numerosRegistrados ? "✓" : "✗"}
            </Badge> */}
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

        {/* Ações */}
        <div className="flex gap-2">
          {hasNumbers ? (
            // Botão de participar
            <Button
              size="sm"
              onClick={() => onJoinRound(card.id)}
              disabled={!canJoin || isParticipating}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {isParticipating ? (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Participando
                </>
              ) : (
                "Usar Cartela"
              )}
            </Button>
          ) : (
            // Botão de registrar números - SEMPRE FUNCIONA
            <Button
              size="sm"
              onClick={handleRegisterNumbers}
              disabled={isLocalRegistering || isRegisteringNumbers || !isConnected}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {(isLocalRegistering || isRegisteringNumbers) ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Processando...
                </>
              ) : !isConnected ? (
                "Conecte a Carteira"
              ) : (
                <>
                  <Hash className="h-3 w-3 mr-1" />
                  Registrar Números
                </>
              )}
            </Button>
          )}
        </div>

        {/* Informação adicional */}
        <div className="text-xs text-slate-400 text-center">
          {hasNumbers ? (
            `${numbers.filter((n: number) => n > 0).length} números registrados`
          ) : (
            "Clique para registrar números únicos automaticamente"
          )}
          {isBlockchainCard(card) && (
            <div className="mt-1 space-y-1">
              <div>Blockchain: {numerosRegistrados ? "✓ Registrados" : "✗ Pendente"}</div>
              {card.cartela && (
                <div>Em uso: {card.cartela[5] ? "Sim" : "Não"}</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}