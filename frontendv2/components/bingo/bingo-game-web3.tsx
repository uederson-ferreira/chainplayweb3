// Arquivo: components/bingo/bingo-game-web3.tsx

"use client"

import { parseEther, formatEther } from 'viem'
import BingoCard from "./bingo-card"
import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Play, Users, Zap, AlertCircle, Network, RefreshCw } from "lucide-react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import WalletConnect from "@/components/web3/wallet-connect"
import { useCartelaContract, useUserCartelasCompletas } from "@/lib/web3/hooks/use-cartela-contract"
import { useBingoContract, useRodadaData } from "@/lib/web3/hooks/use-bingo-contract"
import CreateCardModal from "./create-card-modal"
import GameStats from "./game-stats"
import { useToast } from "@/hooks/use-toast"
import { CONTRACTS } from "@/lib/web3/config"
// IMPORTAR A ABI COMPLETA:
import { CARTELA_ABI } from "@/lib/web3/contracts/abis"
// ADICIONAR ESTES IMPORTS:
import { createPublicClient, http } from 'viem'
import { localChain } from "@/lib/web3/config"

// ADICIONAR o cliente público:
const publicClient = createPublicClient({
  chain: localChain,
  transport: http("http://127.0.0.1:8545"),
})
interface BingoGameWeb3Props {
  user: User
}

export default function BingoGameWeb3({ user }: BingoGameWeb3Props) {
  const { address, isConnected, chainId } = useAccount()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentRoundId, setCurrentRoundId] = useState<bigint>(BigInt(1))
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [isRegisteringNumbers, setIsRegisteringNumbers] = useState(false) // ← NOVO ESTADO
  const { toast } = useToast()
  
  // Hooks dos contratos - ATUALIZADO: incluindo refetchUserCards
  const { userCards, isLoading: isLoadingCards, totalCards, refetchUserCards } = useUserCartelasCompletas()
  const { criarCartela, registrarNumeros, isPending: isCreatingCard, isConfirmed, hash: txHash, precoBase } = useCartelaContract()
  const { iniciarRodada, participar, sortearNumero, isPending: isBingoLoading } = useBingoContract()
  const { rodada } = useRodadaData(currentRoundId)
  
  // Verificar se está na rede correta
  const isCorrectNetwork = chainId === 1

  // ← ADICIONAR ESTAS CONSTANTES AQUI
  const canJoin = !!rodada && rodada.estado === 1 // Apenas "Aberta"
  const canDraw = !!rodada && (rodada.estado === 1 || rodada.estado === 2) // "Aberta" ou "Sorteando"

  // ← ADICIONAR ESTAS FUNÇÕES HELPER AQUI
  const getEstadoTexto = (estado: number) => {
    switch (estado) {
      case 0: return "Inativa"
      case 1: return "Aberta"
      case 2: return "Sorteando"
      case 3: return "Finalizada"
      case 4: return "Cancelada"
      default: return "Desconhecido"
    }
  }

  const getEstadoCor = (estado: number) => {
    switch (estado) {
      case 0: return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case 1: return "bg-green-500/20 text-green-400 border-green-500/30"
      case 2: return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case 3: return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case 4: return "bg-red-500/20 text-red-400 border-red-500/30"
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

    // Debug do hash da transação (apenas quando há mudanças importantes)
  useEffect(() => {
    if (txHash && isConfirmed) {
      console.log('✅ Transação confirmada! Hash:', txHash)
    }
  }, [txHash, isConfirmed])

  // ATUALIZADO: Quando transação for confirmada + recarregar cartelas
  // ATUALIZADO: Quando transação for confirmada - SEM REGISTRO AUTOMÁTICO
  useEffect(() => {
    if (isConfirmed && txHash) {
      console.log('🎉 CARTELA CRIADA COM SUCESSO! Hash:', txHash)
      
      toast({
        title: "Cartela criada!",
        description: "Agora clique em 'Registrar Números' para preencher sua cartela.",
      })
      setShowCreateModal(false)
      
      // Recarregar cartelas após alguns segundos
      setTimeout(() => {
        console.log('🔄 Recarregando cartelas após criação...')
        if (refetchUserCards) {
          refetchUserCards()
        }
      }, 3000)
    }
  }, [isConfirmed, txHash, toast, refetchUserCards])

  // ATUALIZADA: Função para registrar números manualmente com tamanho correto
  const registerNumbers = async (cartelaId: bigint) => {
    console.log('🎯🎯🎯 FUNÇÃO registerNumbers CHAMADA!')
    console.log('📝 Parâmetros recebidos:', {
      cartelaId: cartelaId.toString(),
      isRegisteringNumbers,
      address,
      isConnected,
      isCorrectNetwork
    })
    
    setIsRegisteringNumbers(true)
    try {
      console.log('🎯 INICIANDO REGISTRO MANUAL DE NÚMEROS')
      console.log('📝 Cartela ID:', cartelaId)
      
      // Verificações básicas primeiro
      if (!isConnected) {
        throw new Error('Carteira não conectada')
      }
      
      if (!isCorrectNetwork) {
        throw new Error('Rede incorreta')
      }
      
      // Buscar dados da cartela para determinar o tamanho
      console.log('🔍 Buscando dados da cartela...')
      const cartela = await publicClient.readContract({
        address: CONTRACTS.CARTELA,
        abi: CARTELA_ABI,
        functionName: 'cartelas',
        args: [cartelaId],
      }) as [bigint, number, number, string, boolean, boolean, bigint]
      
      const linhas = cartela[1]
      const colunas = cartela[2]
      const totalNumeros = linhas * colunas
      
      console.log('📏 Dimensões da cartela:', {
        linhas,
        colunas,
        totalNumeros
      })
      
      // Verificações de segurança
      if (cartela[3].toLowerCase() !== address?.toLowerCase()) {
        throw new Error(`Você não é o dono desta cartela. Dono: ${cartela[3]}, Você: ${address}`)
      }
      
      if (cartela[4]) {
        throw new Error('Esta cartela já tem números registrados')
      }
      
      if (cartela[5]) {
        throw new Error('Esta cartela está em uso em uma rodada')
      }
      
      console.log(`🎲 Gerando ${totalNumeros} números únicos para cartela ${linhas}x${colunas}...`)
      
      // Gerar números únicos baseado no tamanho da cartela
      const numbersSet = new Set<number>()
      while (numbersSet.size < totalNumeros) {
        numbersSet.add(Math.floor(Math.random() * 75) + 1)
      }
      const uniqueNumbers = Array.from(numbersSet)
      const numbers = uniqueNumbers.map(n => BigInt(n))
      
      console.log('🎲 Números únicos gerados:', uniqueNumbers)
      console.log('🎲 Total de números:', numbers.length)
      
      console.log('📝 Enviando transação registrarNumeros...')
      
      // Registrar os números
      const hash = await registrarNumeros(cartelaId, numbers)
      console.log('✅ Hash da transação:', hash)
      
      toast({
        title: "Transação enviada!",
        description: `Registrando ${totalNumeros} números na cartela ${linhas}x${colunas}...`,
      })
      
      // Aguardar confirmação
      console.log('⏳ Aguardando confirmação da transação...')
      await new Promise(resolve => setTimeout(resolve, 8000)) // 8 segundos
      
      // Verificar se os números foram salvos
      console.log('🔍 Verificando se números foram salvos...')
      const numerosCartela = await publicClient.readContract({
        address: CONTRACTS.CARTELA,
        abi: CARTELA_ABI,
        functionName: 'getNumerosCartela',
        args: [cartelaId],
      }) as bigint[]
      
      console.log('📊 Números salvos na blockchain:', numerosCartela.map(n => Number(n)))
      
      const cartelaAtualizada = await publicClient.readContract({
        address: CONTRACTS.CARTELA,
        abi: CARTELA_ABI,
        functionName: 'cartelas',
        args: [cartelaId],
      }) as [bigint, number, number, string, boolean, boolean, bigint]
      
      if (cartelaAtualizada[4] && numerosCartela.length === totalNumeros) {
        toast({
          title: "Números registrados com sucesso!",
          description: `Cartela ${linhas}x${colunas} preenchida com ${numerosCartela.length} números.`,
        })
      } else {
        throw new Error('Números não foram salvos corretamente')
      }
      
      // Recarregar cartelas
      setTimeout(() => {
        console.log('🔄 Recarregando cartelas após registro...')
        if (refetchUserCards) {
          refetchUserCards()
        }
      }, 3000)
      
    } catch (error: any) {
      console.error('❌ ERRO COMPLETO ao registrar números:', error)
      console.error('❌ Stack trace:', error.stack)
      console.error('❌ Message:', error.message)
      
      let errorMessage = "Erro desconhecido"
      if (error.message?.includes("não é o dono")) {
        errorMessage = "Você não é o dono desta cartela"
      } else if (error.message?.includes("já tem números")) {
        errorMessage = "Esta cartela já tem números registrados"
      } else if (error.message?.includes("em uso")) {
        errorMessage = "Esta cartela está sendo usada em uma rodada"
      } else if (error.message?.includes("user rejected")) {
        errorMessage = "Transação cancelada pelo usuário"
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "ETH insuficiente para pagar o gas"
      } else if (error.message?.includes("Carteira não conectada")) {
        errorMessage = "Conecte sua carteira primeiro"
      } else if (error.message?.includes("Rede incorreta")) {
        errorMessage = "Conecte-se à rede local (localhost:8545)"
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Erro ao registrar números",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsRegisteringNumbers(false)
    }
  }

  // Controle do modal com timeout
  useEffect(() => {
    if (showCreateModal && txHash) {
      console.log('⏰ Modal aberto com transação, fechando em 10s...')
      
      const timeout = setTimeout(() => {
        console.log('🔒 Forçando fechamento do modal por timeout')
        setShowCreateModal(false)
      }, 10000)
      
      return () => clearTimeout(timeout)
    }
  }, [showCreateModal, txHash])

  // Função para criar cartela
  // ATUALIZADO: Função para criar cartela - CORRIGIR VALOR DO PAGAMENTO
   // Função para criar cartela - SEM REGISTRO AUTOMÁTICO
  const handleCreateCard = async (rows: number, columns: number) => {
    console.log('🚀 CRIANDO CARTELA:', { rows, columns, totalNumbers: rows * columns })
    console.log('🔧 Estado atual:', { isConnected, isCorrectNetwork, chainId })
    
    if (!isConnected) {
      console.log('❌ Carteira não conectada')
      toast({
        title: "Carteira não conectada",
        description: "Conecte sua carteira para criar uma cartela.",
        variant: "destructive",
      })
      return
    }

    if (!isCorrectNetwork) {
      console.log('❌ Rede incorreta, chainId:', chainId)
      toast({
        title: "Rede incorreta", 
        description: "Conecte-se à rede local (localhost:8545) para jogar.",
        variant: "destructive",
      })
      return
    }

    console.log('✅ Validações OK, criando cartela...')
    console.log('💰 Preço base atual:', precoBase ? `${Number(precoBase) / 1e18} ETH` : 'Carregando...')
    
    try {
      console.log('📝 Enviando transação de criação...')
      
      const result = await criarCartela(rows, columns)
      
      console.log('✅ Transação de criação enviada:', result)
      
      toast({
        title: "Criando cartela...",
        description: `Cartela ${rows}×${columns} sendo criada. Aguarde a confirmação para registrar números.`,
      })
      
    } catch (error: any) {
      console.error('❌ Erro ao criar cartela:', error)
      console.error('❌ Stack trace:', error.stack)
      
      let errorMessage = "Erro desconhecido"
      if (error.message?.includes("insufficient funds")) {
        errorMessage = "ETH insuficiente para a transação"
      } else if (error.message?.includes("user rejected")) {
        errorMessage = "Transação cancelada pelo usuário"
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Erro ao criar cartela",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // ← FUNÇÃO ATUALIZADA
  const handleJoinRound = async (cardId: string) => {
    if (!isConnected || !rodada) return

    try {
      const taxaEntrada = rodada.taxaEntrada || parseEther("0.01")
      await participar(currentRoundId, BigInt(cardId), taxaEntrada)
      
      setSelectedCard(cardId)
      toast({
        title: "Participação confirmada!",
        description: `Taxa de ${formatEther(taxaEntrada)} ETH paga.`,
      })
    } catch (error) {
      console.error("Erro ao participar:", error)
      toast({
        title: "Erro",
        description: "Erro ao participar. Verifique se tem ETH suficiente.",
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

  // ← FUNÇÃO ATUALIZADA
  const handleStartRound = async () => {
    if (!isConnected || !isCorrectNetwork) return

    try {
      // Configurações da rodada
      const numeroMaximo = 75
      const taxaEntrada = parseEther("0.01")        // 0.01 ETH
      const timeoutRodada = BigInt(3600)            // 1 hora
      const padroesVitoria = [true, true, true, false] // [linha, coluna, diagonal, cartela_completa]

      await iniciarRodada(numeroMaximo, taxaEntrada, timeoutRodada, padroesVitoria)
      
      toast({
        title: "Rodada iniciada!",
        description: "Nova rodada criada com taxa de 0.01 ETH.",
      })
    } catch (error) {
      console.error("Erro ao iniciar rodada:", error)
      toast({
        title: "Erro",
        description: "Erro ao iniciar rodada. Verifique se você é operador.",
        variant: "destructive",
      })
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen">
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
                    {/* ← BADGE ATUALIZADO */}
                    <Badge className={getEstadoCor(rodada.estado)}>
                      {getEstadoTexto(rodada.estado)}
                    </Badge>
                  </div>
                  {/* ← DESCRIÇÃO ATUALIZADA */}
                  <CardDescription className="text-slate-400">
                    Números de 1 a {rodada.numeroMaximo} • VRF Pendente: {rodada.pedidoVrfPendente ? "Sim" : "Não"}
                    {rodada.taxaEntrada && rodada.taxaEntrada > 0 && (
                      <> • Taxa: {formatEther(rodada.taxaEntrada)} ETH</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    {/* ← BOTÃO ATUALIZADO */}
                    <Button
                      onClick={handleDrawNumber}
                      disabled={!canDraw || isBingoLoading || !isCorrectNetwork}
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

                  {/* Informações adicionais da rodada */}
                  {rodada.premioTotal && rodada.premioTotal > 0 && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        💰 Prêmio Total: {formatEther(rodada.premioTotal)} ETH
                      </p>
                    </div>
                  )}
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
                  <CardTitle className="text-white">
                    Suas Cartelas {totalCards > 0 && `(${totalCards})`}
                  </CardTitle>
                  <div className="flex gap-2">
                    {/* Botão de atualizar cartelas */}
                    <Button
                      onClick={() => refetchUserCards && refetchUserCards()}
                      size="sm"
                      variant="outline"
                      disabled={isLoadingCards || !isCorrectNetwork}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCards ? 'animate-spin' : ''}`} />
                      {isLoadingCards ? "Carregando..." : "Atualizar"}
                    </Button>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      size="sm"
                      disabled={isCreatingCard || !isCorrectNetwork}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isCreatingCard ? "Criando..." : 
                        precoBase ? `Nova Cartela (${(Number(precoBase) / 1e18).toFixed(3)} ETH)` : "Nova Cartela"
                      }
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-slate-400">
                  Gerencie suas cartelas de bingo on-chain
                </CardDescription>
              </CardHeader>
            <CardContent>
                {isLoadingCards ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">Carregando suas cartelas da blockchain...</p>
                  </div>
                ) : userCards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userCards.map((card) => {
                      console.log(`🎮 RENDERIZANDO CARTELA ${card.id}:`, {
                        hasNumbers: card.card_data?.numbers?.some((n: number) => n > 0),
                        numerosRegistrados: card.cartela?.[4],
                        passandoOnRegisterNumbers: true,
                        isRegisteringNumbers
                      })
                      
                      return (
                        <BingoCard
                          key={card.id}
                          card={card}
                          drawnNumbers={[]}
                          onJoinRound={handleJoinRound}
                          onRegisterNumbers={(cardId) => {
                            console.log(`🚀 onRegisterNumbers chamado para cartela ${cardId}`)
                            registerNumbers(BigInt(cardId))
                          }}
                          isParticipating={selectedCard === card.id}
                          canJoin={canJoin}
                          isRegisteringNumbers={isRegisteringNumbers}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">
                      {isConnected 
                        ? "Você ainda não tem cartelas on-chain" 
                        : "Conecte sua carteira para ver suas cartelas"
                      }
                    </p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      disabled={isCreatingCard || !isCorrectNetwork || !isConnected}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isCreatingCard ? "Criando..." : 
                        precoBase ? `Criar Primeira Cartela (${(Number(precoBase) / 1e18).toFixed(3)} ETH)` : "Criar Primeira Cartela"
                      }
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

{/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Connect Card */}
            <WalletConnect />
            
            {/* Game Stats */}
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
                    {CONTRACTS.CARTELA}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Bingo:</p>
                  <p className="text-slate-300 font-mono break-all">{CONTRACTS.BINGO}</p>
                </div>
                <div>
                  <p className="text-slate-400">Rede:</p>
                  <p className="text-slate-300">Local Network (Chain ID: 1)</p>
                </div>
                {precoBase && (
                  <div>
                    <p className="text-slate-400">Preço da Cartela:</p>
                    <p className="text-slate-300">{(Number(precoBase) / 1e18).toFixed(4)} ETH</p>
                  </div>
                )}
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
                <p>3. <strong>Clique "Registrar Números"</strong> na cartela</p>
                <p>4. Participe de uma rodada ativa</p>
                <p>5. Aguarde sorteios via Chainlink VRF</p>
                <p>6. Complete padrões para ganhar!</p>
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