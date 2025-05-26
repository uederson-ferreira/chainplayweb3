"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Play, Users, Zap, AlertCircle, Network } from "lucide-react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import WalletConnect from "@/components/web3/wallet-connect"
import { useCartelaContract, useProximoCartelaId } from "@/lib/web3/hooks/use-cartela-contract"
import { useBingoContract, useRodadaData } from "@/lib/web3/hooks/use-bingo-contract"
import CreateCardModal from "./create-card-modal"
import GameStats from "./game-stats"
import { useToast } from "@/hooks/use-toast"

interface BingoGameWeb3Props {
  user: User
}

export default function BingoGameWeb3({ user }: BingoGameWeb3Props) {
  const { address, isConnected, chainId } = useAccount()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentRoundId, setCurrentRoundId] = useState<bigint>(BigInt(1))
  const [userCards, setUserCards] = useState<any[]>([])
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const { toast } = useToast()

  // Hooks dos contratos
  const { criarCartela, registrarNumeros, isPending: isCreatingCard, isConfirmed } = useCartelaContract()
  const { iniciarRodada, participar, sortearNumero, isPending: isBingoLoading } = useBingoContract()
  const { rodada } = useRodadaData(currentRoundId)
  const proximoId = useProximoCartelaId()

  // Verificar se está na rede correta
  const isCorrectNetwork = chainId === 31337 // Local network

  // Efeito para atualizar cartelas quando uma nova for criada
  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: "Cartela criada!",
        description: "Sua nova cartela foi criada com sucesso na blockchain.",
      })
      setShowCreateModal(false)
      // Aqui você pode recarregar as cartelas do usuário
    }
  }, [isConfirmed, toast])

  const handleCreateCard = async (rows: number, columns: number) => {
    if (!isConnected) {
      toast({
        title: "Carteira não conectada",
        description: "Conecte sua carteira para criar uma cartela.",
        variant: "destructive",
      })
      return
    }

    if (!isCorrectNetwork) {
      toast({
        title: "Rede incorreta",
        description: "Conecte-se à rede local (localhost:8545) para jogar.",
        variant: "destructive",
      })
      return
    }

    try {
      // Criar cartela no contrato
      await criarCartela(rows, columns)

      // Gerar números aleatórios
      const numbers = Array.from({ length: rows * columns }, () => BigInt(Math.floor(Math.random() * 75) + 1))

      // Registrar números (será feito após a confirmação da criação)
      if (proximoId) {
        await registrarNumeros(proximoId, numbers)
      }
    } catch (error) {
      console.error("Erro ao criar cartela:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar cartela. Verifique se você tem ETH suficiente para gas.",
        variant: "destructive",
      })
    }
  }

  const handleJoinRound = async (cardId: string) => {
    if (!isConnected || !rodada) {
      toast({
        title: "Erro",
        description: "Conecte sua carteira e aguarde uma rodada ativa.",
        variant: "destructive",
      })
      return
    }

    if (!isCorrectNetwork) {
      toast({
        title: "Rede incorreta",
        description: "Conecte-se à rede local para participar.",
        variant: "destructive",
      })
      return
    }

    try {
      await participar(currentRoundId, BigInt(cardId))
      setSelectedCard(cardId)
      toast({
        title: "Participação confirmada!",
        description: "Você está participando da rodada.",
      })
    } catch (error) {
      console.error("Erro ao participar:", error)
      toast({
        title: "Erro",
        description: "Erro ao participar da rodada.",
        variant: "destructive",
      })
    }
  }

  const handleDrawNumber = async () => {
    if (!isConnected || !rodada) return

    if (!isCorrectNetwork) {
      toast({
        title: "Rede incorreta",
        description: "Conecte-se à rede local para sortear números.",
        variant: "destructive",
      })
      return
    }

    try {
      await sortearNumero(currentRoundId)
      toast({
        title: "Número sorteado!",
        description: "Um novo número foi sorteado via Chainlink VRF.",
      })
    } catch (error) {
      console.error("Erro ao sortear número:", error)
      toast({
        title: "Erro",
        description: "Erro ao sortear número.",
        variant: "destructive",
      })
    }
  }

  const handleStartRound = async () => {
    if (!isConnected) return

    if (!isCorrectNetwork) {
      toast({
        title: "Rede incorreta",
        description: "Conecte-se à rede local para iniciar rodadas.",
        variant: "destructive",
      })
      return
    }

    try {
      await iniciarRodada(75) // Números de 1 a 75
      toast({
        title: "Rodada iniciada!",
        description: "Uma nova rodada foi iniciada na blockchain.",
      })
    } catch (error) {
      console.error("Erro ao iniciar rodada:", error)
      toast({
        title: "Erro",
        description: "Erro ao iniciar rodada.",
        variant: "destructive",
      })
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Bingo Web3
              </h1>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Chainlink VRF</Badge>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Carteira Necessária</h2>
              <p className="text-slate-400">Conecte sua carteira para jogar Bingo Web3</p>
            </div>
            <WalletConnect />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Bingo Web3
            </h1>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Chainlink VRF</Badge>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-slate-300">
              <Users className="h-3 w-3 mr-1" />
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Badge>
            {!isCorrectNetwork && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <Network className="h-3 w-3 mr-1" />
                Rede Incorreta
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isCorrectNetwork && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Rede Incorreta</span>
            </div>
            <p className="text-sm">
              Você precisa estar conectado à rede local (localhost:8545) para jogar. Use sua carteira para trocar de
              rede.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Área Principal do Jogo */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rodada Ativa */}
            {rodada ? (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Rodada #{rodada.id.toString()}</CardTitle>
                    <Badge
                      className={
                        rodada.estado === 1
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : rodada.estado === 0
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {rodada.estado === 1 ? "Ativa" : rodada.estado === 0 ? "Aguardando" : "Finalizada"}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-400">
                    Números de 1 a {rodada.numeroMaximo} • VRF Pendente: {rodada.pedidoVrfPendente ? "Sim" : "Não"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Controles */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleDrawNumber}
                      disabled={rodada.estado !== 1 || isBingoLoading || !isCorrectNetwork}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {isBingoLoading ? "Sorteando..." : "Sortear Número"}
                    </Button>

                    {selectedCard && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-2">
                        <Play className="h-3 w-3 mr-1" />
                        Participando
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="py-8 text-center">
                  <p className="text-slate-400 mb-4">Nenhuma rodada ativa no momento</p>
                  <Button
                    onClick={handleStartRound}
                    disabled={isBingoLoading || !isCorrectNetwork}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    {isBingoLoading ? "Iniciando..." : "Iniciar Nova Rodada"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Cartelas do Usuário */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Suas Cartelas</CardTitle>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    size="sm"
                    disabled={isCreatingCard || !isCorrectNetwork}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isCreatingCard ? "Criando..." : "Nova Cartela"}
                  </Button>
                </div>
                <CardDescription className="text-slate-400">Gerencie suas cartelas de bingo on-chain</CardDescription>
              </CardHeader>
              <CardContent>
                {userCards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Aqui renderizaria as cartelas do usuário */}
                    <div className="text-center py-8">
                      <p className="text-slate-400">Cartelas carregadas do blockchain...</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">Você ainda não tem cartelas on-chain</p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      disabled={isCreatingCard || !isCorrectNetwork}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isCreatingCard ? "Criando..." : "Criar Primeira Cartela"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WalletConnect />

            <GameStats userCards={userCards} activeRound={null} />

            {/* Informações do Contrato */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Contratos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div>
                  <p className="text-slate-400">Cartela:</p>
                  <p className="text-slate-300 font-mono break-all">
                    {process.env.NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Bingo:</p>
                  <p className="text-slate-300 font-mono break-all">{process.env.NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS}</p>
                </div>
                <div>
                  <p className="text-slate-400">Rede:</p>
                  <p className="text-slate-300">Local Network (Chain ID: 31337)</p>
                </div>
              </CardContent>
            </Card>

            {/* Como Jogar */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Como Jogar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-400">
                <p>1. Conecte sua carteira à rede local</p>
                <p>2. Crie uma cartela on-chain</p>
                <p>3. Participe de uma rodada</p>
                <p>4. Aguarde sorteios via Chainlink VRF</p>
                <p>5. Complete padrões para ganhar!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Criar Cartela */}
      {showCreateModal && <CreateCardModal onClose={() => setShowCreateModal(false)} onCreateCard={handleCreateCard} />}
    </div>
  )
}
