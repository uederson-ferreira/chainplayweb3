// components/bingo/bingo-game-web3.tsx - CORREÇÃO DOS LOOPS DE RENDER
"use client";

import { useEffect, useMemo } from "react";
import type { User } from "@supabase/supabase-js";

// Hooks personalizados
import { useBingoState } from "./hooks/useBingoState";
import { useBingoActions } from "./hooks/useBingoActions";
import { useCartelaActions } from "./hooks/useCartelaActions";
import { useTransactionMonitor } from "./hooks/useTransactionMonitor";

// Hooks do wagmi para dados (LAZY LOADING)
import { useRodadaData, useNumerosSorteados, useVencedores } from "@/lib/web3/hooks/use-bingo-contract";
import { useUserCartelasCompletas } from "@/lib/web3/hooks/use-cartela-contract";

// Componentes básicos do UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Play, Users, Zap, AlertCircle, Network, RefreshCw } from "lucide-react";
import Link from "next/link";

// Componentes específicos do Bingo
import BingoCard from "./bingo-card";
import CreateCardModal from "./create-card-modal";
import GameStats from "./game-stats";
import WalletConnect from "@/components/web3/wallet-connect";

// Utilitários
import { getEstadoTexto, getEstadoCor, formatEther } from "./utils/gameHelpers";
import { CONTRACTS } from "@/lib/web3/config";

interface BingoGameWeb3Props {
  user: User;
}

export default function BingoGameWeb3({ user }: BingoGameWeb3Props) {
  // ========================================
  // HOOKS CENTRALIZADOS (COM LAZY LOADING)
  // ========================================
  const gameState = useBingoState();
  const bingoActions = useBingoActions();
  const cartelaActions = useCartelaActions(gameState);
  
  // 🔧 CORREÇÃO: Usar lazy loading para dados pesados só quando conectado
  const shouldLoadData = gameState.isConnected && gameState.isCorrectNetwork;
  
  // Dados da rodada atual (CONDICIONAL)
  const { rodada } = useRodadaData(shouldLoadData ? gameState.currentRoundId : undefined);
  const { numerosSorteados } = useNumerosSorteados(shouldLoadData ? gameState.currentRoundId : undefined);
  const { vencedores } = useVencedores(shouldLoadData ? gameState.currentRoundId : undefined);
  
  // Cartelas do usuário (CONDICIONAL)
  const { userCards, isLoading: isLoadingCards, refetchUserCards } = useUserCartelasCompletas();

  // ========================================
  // VARIÁVEIS COMPUTADAS (MEMOIZADAS)
  // ========================================
  const gameVariables = useMemo(() => ({
    isCorrectNetwork: gameState.chainId === 1,
    canJoin: !!rodada && rodada.estado === 1,
    canDraw: !!rodada && (rodada.estado === 1 || rodada.estado === 2),
    shouldShowGame: gameState.isConnected && !gameState.showConnectingState,
    shouldShowConnecting: gameState.showConnectingState || gameState.isConnecting || gameState.isReconnecting,
  }), [gameState.chainId, rodada?.estado, gameState.isConnected, gameState.showConnectingState, gameState.isConnecting, gameState.isReconnecting]);

  // ========================================
  // MONITOR DE TRANSAÇÕES (OTIMIZADO)
  // ========================================
  useTransactionMonitor({
    hash: bingoActions.hash,
    isConfirmed: bingoActions.isConfirmed,
    isConfirming: bingoActions.isConfirming,
    onConfirmed: () => {
      console.log('🔄 Transação confirmada - atualizando dados...');
      
      // 🔧 CORREÇÃO: Aguardar antes de atualizar para evitar loops
      setTimeout(() => {
        bingoActions.updateCurrentRound();
        if (refetchUserCards) {
          refetchUserCards();
        }
      }, 1000); // 🔧 NOVO: Delay para evitar setState durante render
    }
  });

  // ========================================
  // FUNÇÕES DE AÇÃO (MEMOIZADAS)
  // ========================================
  const handleJoinRound = useMemo(() => async (cardId: string) => {
    if (!gameState.isConnected || !rodada) return;

    try {
      const taxaEntrada = rodada.taxaEntrada || BigInt(0);
      await cartelaActions.handleJoinRound(cardId, gameState.currentRoundId, taxaEntrada);
      
      // 🔧 CORREÇÃO: Aguardar antes de atualizar estado
      setTimeout(() => {
        gameState.setSelectedCard(cardId);
      }, 100);
    } catch (error) {
      console.error("Erro ao participar:", error);
    }
  }, [gameState.isConnected, rodada, cartelaActions, gameState.currentRoundId, gameState.setSelectedCard]);

  // ========================================
  // EFEITO DE DEBUG (OTIMIZADO - SÓ QUANDO NECESSÁRIO)
  // ========================================
  useEffect(() => {
    // 🔧 CORREÇÃO: Só logar quando houver mudanças significativas
    if (gameState.isConnected) {
      console.log('🔍 DEBUG - Estado atual do jogo:', {
        isConnected: gameState.isConnected,
        chainId: gameState.chainId,
        isCorrectNetwork: gameVariables.isCorrectNetwork,
        currentRoundId: gameState.currentRoundId?.toString(),
        rodadaEstado: rodada?.estado,
        contratosBingo: CONTRACTS.BINGO,
        contratosCartela: CONTRACTS.CARTELA,
      });
    }
  }, [gameState.isConnected, gameState.chainId]); // 🔧 CORREÇÃO: Dependências mínimas

  // ========================================
  // RENDERIZAÇÃO CONDICIONAL - ESTADOS DE CONEXÃO
  // ========================================
  if (!gameVariables.shouldShowGame) {
    return (
      <div className="min-h-screen">
        {/* Header simplificado */}
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
            {gameVariables.shouldShowConnecting ? (
              <div className="text-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-white mb-2">Conectando Carteira...</h2>
                <p className="text-slate-400 mb-4">Complete a conexão na MetaMask</p>
              </div>
            ) : (
              <div className="text-center mb-6">
                <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Carteira Necessária</h2>
                <p className="text-slate-400">Conecte sua carteira para jogar Bingo Web3</p>
              </div>
            )}
            
            <WalletConnect />
          </div>
        </main>
      </div>
    );
  }

  // ========================================
  // INTERFACE PRINCIPAL DO JOGO
  // ========================================
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
              {gameState.address?.slice(0, 6)}...{gameState.address?.slice(-4)}
            </Badge>
            {!gameVariables.isCorrectNetwork && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <Network className="h-3 w-3 mr-1" />
                Rede Incorreta
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Aviso de rede incorreta */}
        {!gameVariables.isCorrectNetwork && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Rede Incorreta</span>
            </div>
            <p className="text-sm">
              Você precisa estar conectado à rede local (localhost:8545) para jogar.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ========================================
              ÁREA PRINCIPAL DO JOGO (2/3 da largura)
              ======================================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card da Rodada Ativa */}
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
                  {/* Números sorteados */}
                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">
                      Números Sorteados ({numerosSorteados.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {numerosSorteados.map((number, index) => (
                        <Badge
                          key={index}
                          className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-lg px-3 py-1"
                        >
                          {number}
                        </Badge>
                      ))}
                      {numerosSorteados.length === 0 && (
                        <span className="text-slate-400 text-sm">Nenhum número sorteado ainda</span>
                      )}
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="flex gap-4">
                    <Button
                      onClick={bingoActions.handleDrawNumber}
                      disabled={!gameVariables.canDraw || bingoActions.isLoading || !gameVariables.isCorrectNetwork}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {bingoActions.isLoading ? "Sorteando..." : "Sortear Número"}
                    </Button>

                    {gameState.selectedCard && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-2">
                        <Play className="h-3 w-3 mr-1" />
                        Participando
                      </Badge>
                    )}
                  </div>

                  {/* Prêmio total e vencedores (se existirem) */}
                  {rodada.premioTotal && rodada.premioTotal > 0 && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        💰 Prêmio Total: {formatEther(rodada.premioTotal)} ETH
                      </p>
                    </div>
                  )}

                  {vencedores.length > 0 && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 text-sm font-medium mb-2">🏆 Vencedores:</p>
                      {vencedores.map((vencedor, index) => (
                        <p key={index} className="text-green-300 text-xs">
                          {vencedor.slice(0, 6)}...{vencedor.slice(-4)}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="py-8 text-center">
                  <p className="text-slate-400 mb-4">Nenhuma rodada ativa no momento</p>
                  <Button
                    onClick={bingoActions.handleStartRound}
                    disabled={bingoActions.isLoading || !gameVariables.isCorrectNetwork}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    {bingoActions.isLoading ? "Iniciando..." : "Iniciar Nova Rodada"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Cartelas do Usuário */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    Suas Cartelas {userCards.length > 0 && `(${userCards.length})`}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => refetchUserCards && refetchUserCards()}
                      size="sm"
                      variant="outline"
                      disabled={isLoadingCards || !gameVariables.isCorrectNetwork}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCards ? 'animate-spin' : ''}`} />
                      {isLoadingCards ? "Carregando..." : "Atualizar"}
                    </Button>
                    <Button
                      onClick={() => gameState.setShowCreateModal(true)}
                      size="sm"
                      disabled={cartelaActions.isCreatingCard || !gameVariables.isCorrectNetwork}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {cartelaActions.isCreatingCard ? "Criando..." : "Nova Cartela"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCards ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">Carregando suas cartelas...</p>
                  </div>
                ) : userCards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userCards.map((card) => (
                      <BingoCard
                        key={card.id}
                        card={card}
                        drawnNumbers={numerosSorteados}
                        onJoinRound={handleJoinRound}
                        onRegisterNumbers={(cardId) => cartelaActions.handleRegisterNumbers(BigInt(cardId))}
                        canJoin={gameVariables.canJoin}
                        isParticipating={gameState.selectedCard === card.id}
                        isRegisteringNumbers={cartelaActions.isRegisteringNumbers}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">Você ainda não tem cartelas</p>
                    <Button
                      onClick={() => gameState.setShowCreateModal(true)}
                      disabled={cartelaActions.isCreatingCard || !gameVariables.isCorrectNetwork}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Cartela
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ========================================
              SIDEBAR (1/3 da largura)
              ======================================== */}
          <div className="space-y-6">
            {/* Wallet Connect */}
            <WalletConnect />
            
            {/* Game Stats */}
            <GameStats userCards={userCards} activeRound={null} />

            {/* Informações dos Contratos */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Contratos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div>
                  <p className="text-slate-400">Cartela:</p>
                  <p className="text-slate-300 font-mono break-all">{CONTRACTS.CARTELA}</p>
                </div>
                <div>
                  <p className="text-slate-400">Bingo:</p>
                  <p className="text-slate-300 font-mono break-all">{CONTRACTS.BINGO}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <p className="text-slate-300">Conexão Estável ✅</p>
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
                <p>3. <strong>Registre números</strong> na cartela</p>
                <p>4. Participe de uma rodada ativa</p>
                <p>5. Aguarde sorteios via Chainlink VRF</p>
                <p>6. Complete padrões para ganhar!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Criar Cartela */}
      {gameState.showCreateModal && (
        <CreateCardModal
          onClose={() => gameState.setShowCreateModal(false)}
          onCreateCard={cartelaActions.handleCreateCard}
        />
      )}
    </div>
  );
}