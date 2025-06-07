// Arquivo: components/bingo/bingo-game-web3.tsx
// VERSÃO CORRIGIDA - SEM LOOPS INFINITOS

"use client"

import { parseEther, formatEther } from 'viem'
import BingoCard from "./bingo-card"
import { useState, useEffect, useCallback, useRef } from "react"
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
import { CARTELA_ABI } from "@/lib/web3/contracts/abis"
import { BINGO_ABI } from "@/lib/web3/contracts/abis"  // ← ADICIONAR
import { createPublicClient, http } from 'viem'
import { localChain } from "@/lib/web3/config"

import { useWriteContract } from "wagmi"; 
import { useIsOperator } from "@/lib/web3/hooks/use-bingo-contract";
import deployment from "@/lib/web3/contracts/deployment.json";
// import { AdminRoundManager } from "@/components/dashboard/AdminRoundManager";

const publicClient = createPublicClient({
  chain: localChain,
  transport: http("http://127.0.0.1:8545"),
})

interface BingoGameWeb3Props {
  user: User
}

export default function BingoGameWeb3({ user }: BingoGameWeb3Props) {


    // 2. Chame o novo hook e o hook de escrita do wagmi
  const { isOperator, isLoading: isLoadingOperator } = useIsOperator();
  const { writeContract, isPending } = useWriteContract();

  // 3. Substitua COMPLETAMENTE sua função handleStartRound existente por esta:
  const handleStartRound = () => {
    // A lógica para criar os argumentos da rodada vai aqui
    const numeroMaximo = 75;
    const taxaEntrada = parseEther("0.01");
    const timeoutRodada = BigInt(3600);
    const padroesVitoria = [true, true, true, false];

    // Chamada usando o hook do wagmi
    writeContract({
        address: deployment.bingoContract as `0x${string}`, // Importe 'deployment' se necessário
        abi: BINGO_ABI, // Importe 'BINGO_ABI' se necessário
        functionName: 'iniciarRodada',
        args: [numeroMaximo, taxaEntrada, timeoutRodada, padroesVitoria],
    }, {
        onSuccess: (hash) => toast({ title: "🚀 Rodada Criada!", description: `Hash: ${hash}` }),
        onError: (err) => toast({ title: "❌ Erro ao criar rodada", description: err.message, variant: "destructive" })
    });
  };


  const { address, isConnected, chainId, isConnecting, isReconnecting } = useAccount()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentRoundId, setCurrentRoundId] = useState<bigint>(BigInt(0))
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [isRegisteringNumbers, setIsRegisteringNumbers] = useState(false)
  const { toast } = useToast()
  
  // Estados para controle de conexão - SIMPLIFICADOS
  const [showConnectingState, setShowConnectingState] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { userCards, isLoading: isLoadingCards, totalCards, refetchUserCards } = useUserCartelasCompletas()
  const { criarCartela, registrarNumeros, isPending: isCreatingCard, isConfirmed: isCartelaConfirmed, hash: txHash, precoBase } = useCartelaContract()
  const { iniciarRodada, participar, sortearNumero, hash, isPending: isBingoLoading, isConfirming, isConfirmed } = useBingoContract()


  const { rodada } = useRodadaData(currentRoundId)
  
  const isCorrectNetwork = chainId === 1
  const canJoin = !!rodada && rodada.estado === 1
  const canDraw = !!rodada && (rodada.estado === 1 || rodada.estado === 2)

  // Função para limpar timeout existente
  const clearExistingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    console.log('🔍 DEBUG COMPLETO:', {
      CONTRACTS,
      address,
      chainId,
      isCorrectNetwork,
      currentRoundId: currentRoundId.toString(),
      rodada
    })
  }, [address, chainId, currentRoundId, rodada])

  // Detectar início de conexão - SIMPLIFICADO
  useEffect(() => {
    if (isConnecting || isReconnecting) {
      console.log('🔄 Detectado início de conexão...')
      setShowConnectingState(true)
      
      // Timeout de segurança
      clearExistingTimeout()
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ Timeout de conexão - resetando estado')
        setShowConnectingState(false)
      }, 15000)
    }
  }, [isConnecting, isReconnecting, clearExistingTimeout])

  // Detectar sucesso de conexão - SIMPLIFICADO
  useEffect(() => {
    if (isConnected && showConnectingState) {
      console.log('✅ Carteira conectada com sucesso!')
      clearExistingTimeout()
      
      // Delay para transição suave
      timeoutRef.current = setTimeout(() => {
        setShowConnectingState(false)
      }, 1000)
    }
  }, [isConnected, showConnectingState, clearExistingTimeout])

  // Cleanup na desmontagem do componente
  useEffect(() => {
    return () => {
      clearExistingTimeout()
    }
  }, [clearExistingTimeout])

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

  useEffect(() => {
    if (txHash && isConfirmed) {
      console.log('✅ Transação confirmada! Hash:', txHash)
    }
  }, [txHash, isConfirmed])

  useEffect(() => {
    if (isConfirmed && txHash) {
      console.log('🎉 CARTELA CRIADA COM SUCESSO! Hash:', txHash)
      
      toast({
        title: "Cartela criada!",
        description: "Agora clique em 'Registrar Números' para preencher sua cartela.",
      })
      setShowCreateModal(false)
      
      setTimeout(() => {
        console.log('🔄 Recarregando cartelas após criação...')
        if (refetchUserCards) {
          refetchUserCards()
        }
      }, 3000)
    }
  }, [isConfirmed, txHash, toast, refetchUserCards])

  const registerNumbers = async (cartelaId: bigint) => {
      console.log('🎯 Iniciando registro de números para a cartela:', cartelaId.toString());
      
      setIsRegisteringNumbers(true);
      try {
          if (!isConnected || !address) throw new Error('Carteira não conectada');
          if (!isCorrectNetwork) throw new Error('Rede incorreta');

          console.log('🔍 Buscando informações da cartela via getCartelaInfo...');
          
          // Usando a nossa função view segura!
          const cartelaInfo = await publicClient.readContract({
              address: CONTRACTS.CARTELA,
              abi: CARTELA_ABI,
              functionName: 'getCartelaInfo',
              args: [cartelaId],
          }) as readonly [bigint, `0x${string}`, boolean, boolean, boolean];

          const [id, dono, numerosRegistrados, emUso, foiGasta] = cartelaInfo;

          if (dono.toLowerCase() !== address.toLowerCase()) {
              throw new Error(`Você não é o dono desta cartela`);
          }
          if (numerosRegistrados) {
              throw new Error('Esta cartela já tem números registrados');
          }
          if (emUso) {
              throw new Error('Não pode registrar números enquanto a cartela está em uso');
          }
          if (foiGasta) {
              throw new Error('Esta cartela já foi usada e não pode ser modificada');
          }
          
          // A lógica para pegar linhas/colunas precisa de outra chamada, pois getCartelaInfo não as retorna.
          // Vamos buscar do getter `cartelas` sabendo que ele pode falhar mas nos dá os dados que precisamos.
          const cartelaDetails = await publicClient.readContract({
              address: CONTRACTS.CARTELA,
              abi: CARTELA_ABI,
              functionName: 'cartelas',
              args: [cartelaId],
          }) as readonly [bigint, number, number, `0x${string}`, boolean, boolean, boolean, bigint];

          const linhas = cartelaDetails[1];
          const colunas = cartelaDetails[2];
          const totalNumeros = linhas * colunas;

          console.log(`🎲 Gerando ${totalNumeros} números únicos...`);
          const numbersSet = new Set<number>();
          while (numbersSet.size < totalNumeros) {
              numbersSet.add(Math.floor(Math.random() * 99) + 1);
          }
          const uniqueNumbers = Array.from(numbersSet).map(n => BigInt(n));
          
          // Chamar a função de escrita do seu hook useCartelaContract
          await registrarNumeros(cartelaId, uniqueNumbers);
        
          toast({ title: "Números registrados com sucesso!" });

          // Atualizar a UI após um tempo
          setTimeout(() => {
              if (refetchUserCards) {
                  refetchUserCards();
              }
          }, 8000);

      } catch (error: any) {
          console.error('❌ Erro ao registrar números:', error);
          toast({
              title: "Erro ao registrar números",
              description: error.message,
              variant: "destructive",
          });
      } finally {
          setIsRegisteringNumbers(false);
      }
  }

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
      const result = await criarCartela(rows, columns)
      
      toast({
        title: "Criando cartela...",
        description: `Cartela ${rows}×${columns} sendo criada.`,
      })
      
    } catch (error: any) {
      console.error('❌ Erro ao criar cartela:', error)
      
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
      console.log('🎲 SORTEANDO NÚMERO...')
      console.log('📊 Estado:', { isConnected, rodada })
      
      if (!isConnected || !rodada) {
        toast({
          title: "Erro",
          description: "Conecte sua carteira e certifique-se que há uma rodada ativa.",
          variant: "destructive",
        })
        return
      }

      if (!isCorrectNetwork) {
        toast({
          title: "Rede incorreta",
          description: "Conecte-se à rede local para sortear números.",
          variant: "destructive",
        })
        return
      }

      console.log('🎯 Rodada atual:', {
        id: rodada.id.toString(),
        estado: rodada.estado,
        numeroMaximo: rodada.numeroMaximo,
        vrfPendente: rodada.pedidoVrfPendente
      })

      try {
        console.log('📤 Enviando transação de sortear número...')
        await sortearNumero(currentRoundId)
        toast({
          title: "Número sorteado!",
          description: "Um novo número foi sorteado via Chainlink VRF.",
        })
      } catch (error: any) {
        console.error("❌ Erro ao sortear número:", error)
        console.error("❌ Stack:", error.stack)
        
        let errorMessage = "Erro desconhecido"
        if (error.message?.includes("apenas operador")) {
          errorMessage = "Você não tem permissão de operador"
        } else if (error.message?.includes("not active")) {
          errorMessage = "Rodada não está ativa"
        } else if (error.message) {
          errorMessage = error.message
        }
        
        toast({
          title: "Erro ao sortear número",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }

  // const handleStartRound = async () => {
  //   console.log('🎯 INICIANDO handleStartRound CORRIGIDO')
  //   console.log('🔍 Estado inicial:', { isConnected, isCorrectNetwork })
    
  //   if (!isConnected) {
  //     console.log('❌ Carteira não conectada')
  //     toast({
  //       title: "Carteira não conectada",
  //       description: "Conecte sua carteira primeiro.",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   if (!isCorrectNetwork) {
  //     console.log('❌ Rede incorreta, chainId:', chainId)
  //     toast({
  //       title: "Rede incorreta",
  //       description: "Conecte-se à rede local (localhost:8545) para jogar.",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   console.log('✅ Validações básicas passaram')

  //   try {
  //     // ========================================
  //     // CONFIGURAÇÕES DA RODADA - VALORES CORRETOS
  //     // ========================================
  //     const numeroMaximo = 75
  //     const taxaEntrada = parseEther("0.01")        // 0.01 ETH
  //     const timeoutRodada = BigInt(3600)            // 1 hora em segundos
  //     const padroesVitoria = [true, true, true, false] // [linha, coluna, diagonal, cartela_completa]

  //     console.log('📋 Configurações da rodada:', {
  //       numeroMaximo,
  //       taxaEntrada: taxaEntrada.toString(),
  //       taxaEntradaETH: (Number(taxaEntrada) / 1e18).toFixed(4) + ' ETH',
  //       timeoutRodada: timeoutRodada.toString(),
  //       timeoutRodadaHoras: Number(timeoutRodada) / 3600 + ' horas',
  //       padroesVitoria
  //     })

  //     console.log('📤 Chamando iniciarRodada...')

  //     // ========================================
  //     // CHAMADA CORRIGIDA - COM AWAIT E TRATAMENTO
  //     // ========================================
  //     const resultado = await iniciarRodada(
  //       numeroMaximo,
  //       taxaEntrada,
  //       timeoutRodada,
  //       padroesVitoria
  //     )

  //     console.log('🎉 iniciarRodada executada!')
  //     console.log('📋 Resultado:', resultado)
  //     console.log('📋 Hash do hook:', hash)

  //     // Feedback imediato
  //     toast({
  //       title: "Transação enviada!",
  //       description: "Iniciando rodada de Bingo...",
  //     })

  //   } catch (error: any) {
  //     console.error("❌ ERRO COMPLETO no handleStartRound:", error)
      
  //     // Tratamento de erros melhorado
  //     let errorTitle = "Erro ao iniciar rodada"
  //     let errorMessage = "Erro desconhecido"

  //     if (error?.message?.includes("cancelada pelo usuário")) {
  //       errorTitle = "Transação cancelada"
  //       errorMessage = "Você cancelou a transação na MetaMask"
  //     } else if (error?.message?.includes("ETH insuficiente")) {
  //       errorTitle = "Saldo insuficiente"
  //       errorMessage = "Você não tem ETH suficiente para pagar o gas"
  //     } else if (error?.message?.includes("operador")) {
  //       errorTitle = "Sem permissão"
  //       errorMessage = "Você precisa ser operador para iniciar rodadas"
  //     } else if (error?.message) {
  //       errorMessage = error.message
  //     }

  //     toast({
  //       title: errorTitle,
  //       description: errorMessage,
  //       variant: "destructive",
  //     })
  //   }
  // }

  // ========================================
  // ADICIONE TAMBÉM ESTE useEffect PARA MONITORAR O HASH
  // ========================================

  // Adicione este useEffect no componente para monitorar quando o hash aparecer:
  useEffect(() => {
    if (hash && !isConfirming && !isConfirmed) {
      console.log('🔍 Novo hash detectado:', hash)
      console.log('🔍 Status da transação:', { isConfirming, isConfirmed })
      
      toast({
        title: "Transação enviada!",
        description: `Hash: ${hash.slice(0, 10)}...${hash.slice(-6)}`,
      })
    }
    
    if (isConfirming) {
      console.log('⏳ Transação confirmando...')
      toast({
        title: "Confirmando transação...",
        description: "Aguarde a confirmação na blockchain.",
      })
    }
    
    if (isConfirmed) {
      console.log('✅ Transação confirmada!')
      toast({
        title: "Rodada iniciada com sucesso!",
        description: "A nova rodada está ativa.",
      })
    }
  }, [hash, isConfirming, isConfirmed])

  // ========================================
  // TESTE DE CONECTIVIDADE COM O CONTRATO
  // ========================================

  // Adicione também este useEffect para testar o contrato:
  useEffect(() => {
    const testContract = async () => {
      if (!isConnected || !isCorrectNetwork) return
      
      try {
        console.log('🧪 Testando contrato Bingo...')
        console.log('📍 Endereço:', CONTRACTS.BINGO)
        
        // IMPORTANTE: Usar o publicClient do arquivo para testar
        const publicClient = createPublicClient({
          chain: localChain,
          transport: http("http://127.0.0.1:8545"),
        })
        
        // Testar se o endereço tem código
        const code = await publicClient.getBytecode({
          address: CONTRACTS.BINGO
        })
        
        console.log('📋 Contrato tem código?', code ? 'SIM' : 'NÃO')
        console.log('📋 Tamanho do código:', code?.length || 0)
        
        if (!code) {
          console.error('❌ PROBLEMA: Contrato não foi deployado neste endereço!')
          toast({
            title: "Erro no contrato",
            description: "Contrato Bingo não encontrado no endereço configurado",
            variant: "destructive",
          })
          return
        }
        
        // Testar uma função view do contrato
        const admin = await publicClient.readContract({
          address: CONTRACTS.BINGO,
          abi: BINGO_ABI,
          functionName: 'admin',
        })
        
        console.log('👑 Admin do contrato:', admin)
        console.log('👤 Seu endereço:', address)
        console.log('🔑 Você é admin?', admin?.toLowerCase() === address?.toLowerCase())
        
        // Verificar se é operador
        const isOperator = await publicClient.readContract({
          address: CONTRACTS.BINGO,
          abi: BINGO_ABI,
          functionName: 'operadores',
          args: [address as `0x${string}`],
        })
        
        console.log('🔑 Você é operador?', isOperator)
        
        if (!isOperator) {
          console.warn('⚠️ AVISO: Você não é operador - não pode iniciar rodadas')
          toast({
            title: "Aviso",
            description: "Você não é operador. Apenas operadores podem iniciar rodadas.",
            variant: "destructive",
          })
        }
        
      } catch (error) {
        console.error('❌ Erro ao testar contrato:', error)
      }
    }
    
    testContract()
  }, [isConnected, isCorrectNetwork, address])
  // Estados de exibição - SIMPLIFICADOS
  const shouldShowGame = isConnected && !showConnectingState
  const shouldShowConnecting = showConnectingState || isConnecting || isReconnecting
  const shouldShowInitialState = !isConnected && !shouldShowConnecting

  // Quando não está conectado OU está conectando
  if (!shouldShowGame) {
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
            {shouldShowConnecting ? (
              // Estado "Conectando..."
              <div className="text-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-white mb-2">Conectando Carteira...</h2>
                <p className="text-slate-400 mb-4">Complete a conexão na MetaMask</p>
                <div className="bg-blue-900/50 text-blue-400 border border-blue-700 p-3 rounded-md text-sm">
                  <p className="font-medium mb-2">Aguardando confirmação:</p>
                  <ul className="text-xs space-y-1 text-left">
                    <li>• ✅ Aprove a conexão na MetaMask</li>
                    <li>• ✅ Selecione a conta desejada</li>
                    <li>• ⏳ Aguarde redirecionamento automático...</li>
                  </ul>
                </div>
              </div>
            ) : shouldShowInitialState ? (
              // Estado inicial - não conectado
              <div className="text-center mb-6">
                <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Carteira Necessária</h2>
                <p className="text-slate-400">Conecte sua carteira para jogar Bingo Web3</p>
              </div>
            ) : null}
            
            {/* Componente de conexão */}
            <WalletConnect />
            
            {/* Botão de reset se necessário */}
            {shouldShowConnecting && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    clearExistingTimeout()
                    setShowConnectingState(false)
                    console.log('🔄 Reset manual do estado de conexão')
                  }}
                  className="text-xs"
                >
                  Cancelar Conexão
                </Button>
              </div>
            )}
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
              Você precisa estar conectado à rede local (localhost:8545) para jogar. Use sua carteira para trocar de rede.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Área Principal do Jogo */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rodada Ativa */}
            {rodada && rodada.id > 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Rodada #{rodada.id.toString()}</CardTitle>
                    <Badge className={getEstadoCor(rodada.estado)}>
                      {getEstadoTexto(rodada.estado)}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-400">
                    Números de 1 a {rodada.numeroMaximo} • VRF Pendente: {rodada.pedidoVrfPendente ? "Sim" : "Não"}
                    {rodada.taxaEntrada && rodada.taxaEntrada > 0 && (
                      <> • Taxa: {formatEther(rodada.taxaEntrada)} ETH</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
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
              <main>
                {/* ... */}
                {isLoadingOperator ? (
                  <p> Verificando permissões...</p>
                ) : isOperator && (
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
                      {/* <AdminRoundManager /> */}
                    </CardContent>
                  </Card>
                )}
              </main>
            )}
            {/* Cartelas do Usuário */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    Suas Cartelas {totalCards > 0 && `(${totalCards})`}
                  </CardTitle>
                  <div className="flex gap-2">
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
                    {userCards.map((card) => (
                      <BingoCard
                        key={card.id}
                        card={card}
                        drawnNumbers={[]}
                        onJoinRound={handleJoinRound}
                        onRegisterNumbers={(cardId) => registerNumbers(BigInt(cardId))}
                        canJoin={canJoin}
                        isRegisteringNumbers={isRegisteringNumbers} isParticipating={false}                      />
                    ))}
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