// components/bingo/bingo-game-web3.tsx
"use client";

import { parseEther, formatEther } from 'viem';
import FixedBingoCard from "@/components/bingo/fixed-bingo-card";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Play, Users, Zap, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import WalletConnect from "@/components/web3/wallet-connect";
import { useCartelaContract, useUserCartelasCompletas } from "@/lib/web3/hooks/use-cartela-contract";
import { useIsOperator } from "@/lib/web3/hooks/use-bingo-contract";
import CreateCardModal from "./create-card-modal";
import GameStats from "./game-stats";
import { useToast } from "@/hooks/use-toast";
import { BINGO_ABI } from "@/lib/web3/contracts/abis";
import deployment from "@/lib/web3/contracts/deployment.json";
//import CreateRoundModal from "./CreateRoundModal";
import { useRoundCreation } from "./hooks/use-round-creation";
import { useActiveRounds } from "@/lib/web3/hooks/use-active-rounds";
import { useBingoActions } from './hooks/useBingoActions';
import { useEnhancedActiveRounds } from "@/lib/web3/hooks/use-enhanced-active-rounds";
import CreateRoundModal, { RichRoundCreationParams } from "./CreateRoundModal";

// ===== TIPOS UNIFICADOS =====
interface UnifiedRoundCreationParams {
  numeroMaximo: number;
  taxaEntrada: string; // em ETH
  timeoutHoras: number;
  padroesVitoria: {
    linha: boolean;
    coluna: boolean;
    diagonal: boolean;
    cartelaCompleta: boolean;
  };
}
interface BingoGameWeb3Props {
  user: User;
}

export default function FixedBingoGameWeb3({ user }: BingoGameWeb3Props) {
  const { address, isConnected, chainId } = useAccount();
  const { toast } = useToast();

  // ✅ HOOKS EXISTENTES (funcionam)
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { isOperator, isLoading: isLoadingOperator } = useIsOperator();
  const { userCards, isLoading: isLoadingCards, refetchUserCards } = useUserCartelasCompletas();
  const { criarCartela, isPending: isCreatingCard, isConfirmed: isCartelaConfirmed, precoBase } = useCartelaContract();
  
  // ✅ HOOKS CORRIGIDOS
  const {
    activeRounds, 
    enhancedRounds,
    currentRoundId,
    isLoading: isLoadingRounds,
    error: roundsError,
    refetchAll: refetchRounds,
    hasActiveRounds,
    getCurrentRound,
    canJoinRounds,
    calculateEstimatedPrize,
    hasSupabaseData,
    stats
  } = useEnhancedActiveRounds();

  // ✅ CORREÇÃO 1: Remover currentStep e progress que não existem
  const { createRound, isCreating } = useRoundCreation();

  const bingoActions = useBingoActions();
  const currentRound = getCurrentRound();

  // ✅ ESTADOS LOCAIS
  const [showCreateRoundModal, setShowCreateRoundModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isRegisteringNumbers, setIsRegisteringNumbers] = useState(false);
  
  // ✅ VARIÁVEIS COMPUTADAS
  const isCorrectNetwork = chainId === 1;
  
  // ✅ LOGS DEBUG
  console.log('🎯 Estado atual do jogo:', {
    isConnected,
    isCorrectNetwork,
    hasActiveRounds,
    activeRoundsCount: activeRounds.length,
    currentRoundId: currentRoundId?.toString(),
    canJoinRounds,
    userCardsCount: userCards.length,
    showCreateRoundModal // Debug do modal
  });

  // ✅ EFEITOS (mantidos)
  useEffect(() => {
    if (isConfirmed) {
      toast({ 
        title: "✅ Transação Confirmada!", 
        description: "Recarregando dados..." 
      });
      
      setTimeout(() => {
        refetchRounds();
        refetchUserCards();
      }, 2000);
    }
  }, [isConfirmed, refetchRounds, refetchUserCards]);

  useEffect(() => {
    if (isCartelaConfirmed) {
      toast({
        title: "Cartela criada!",
        description: "Agora registre os números da cartela.",
      });
      setShowCreateModal(false);
      setTimeout(() => refetchUserCards(), 3000);
    }
  }, [isCartelaConfirmed, refetchUserCards]);

  // ✅ FUNÇÕES DE MANIPULAÇÃO (handlers)
  const handleCreateCard = async (rows: number, columns: number) => {
    if (!isConnected || !isCorrectNetwork) {
      toast({
        title: "Erro de conexão",
        description: "Conecte-se à rede local para criar cartelas",
        variant: "destructive"
      });
      return;
    }

    try {
      await criarCartela(rows, columns);
      toast({
        title: "Criando cartela...",
        description: `Cartela ${rows}×${columns} sendo criada.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar cartela",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleJoinRound = async (cardId: string) => {
    if (!currentRound) {
      toast({
        title: "Nenhuma rodada ativa",
        description: "Aguarde uma rodada ser criada",
        variant: "destructive"
      });
      return;
    }

    try {
      const taxaEntrada = currentRound.taxaEntrada;
      
      writeContract({
        address: deployment.bingoContract as `0x${string}`,
        abi: BINGO_ABI,
        functionName: 'participar',
        args: [currentRound.id, BigInt(cardId)],
        value: taxaEntrada,
      });

      setSelectedCard(cardId);
      toast({
        title: "Participando da rodada...",
        description: `Taxa: ${formatEther(taxaEntrada)} ETH`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao participar",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleDrawNumber = async () => {
    if (!currentRound) return;

    try {
      writeContract({
        address: deployment.bingoContract as `0x${string}`,
        abi: BINGO_ABI,
        functionName: 'sortearNumero',
        args: [currentRound.id],
      });

      toast({
        title: "Sorteando número...",
        description: "Solicitação enviada via Chainlink VRF",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sortear",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
    }
  };


  const handleCreateRound = async (params: RichRoundCreationParams) => {
    try {
      console.log('🎯 Recebendo dados ricos do modal:', params);
      
      // Futuramente, você pode querer passar `params` inteiros para o hook.
      // Por agora, vamos extrair apenas o que o hook `useRoundCreation` precisa.
      const paramsForHook: UnifiedRoundCreationParams = {
        numeroMaximo: params.numeroMaximo,
        taxaEntrada: params.taxaEntrada,
        timeoutHoras: params.duracaoHoras, // Mapeando 'duracaoHoras' para 'timeoutHoras'
        padroesVitoria: params.padroesVitoria
      };
      
      console.log('🔄 Convertendo para o formato do hook:', paramsForHook);
      
      await createRound(paramsForHook);
      
      toast({ title: "Sucesso!", description: "Sua rodada está sendo criada na blockchain." });
      setShowCreateRoundModal(false);
      
      setTimeout(() => refetchRounds(), 3000);
      
    } catch (error: any) {
      console.error('❌ Erro na criação da rodada:', error);
      toast({ 
        title: "Erro ao criar rodada", 
        description: error.message || "Ocorreu um erro, tente novamente.",
        variant: "destructive"
      });
    }
  };
  // // ✅ CORREÇÃO 2: Handler que converte tipos corretamente
  // const handleCreateRound = async (modalParams: any) => {
  //   try {
  //     console.log('🎯 Criando rodada personalizada:', modalParams);
      
  //     // ✅ CONVERSÃO DE TIPOS: Modal -> Hook
  //     const unifiedParams: UnifiedRoundCreationParams = {
  //       numeroMaximo: modalParams.numeroMaximo,
  //       taxaEntrada: modalParams.taxaEntrada,
  //       timeoutHoras: modalParams.timeoutHoras || modalParams.timeout || 1, // ✅ Fallback
  //       padroesVitoria: modalParams.padroesVitoria
  //     };
      
  //     console.log('🔄 Parâmetros convertidos:', unifiedParams);
      
  //     await createRound(unifiedParams);
      
  //     // Fechar modal em caso de sucesso
  //     setShowCreateRoundModal(false);
      
  //     // Recarregar dados após 3 segundos
  //     setTimeout(() => {
  //       refetchRounds();
  //     }, 3000);
      
  //   } catch (error) {
  //     console.error('❌ Erro na criação da rodada:', error);
  //     // Modal permanece aberto para mostrar erro
  //   }
  // };

  // ✅ HANDLER PARA ABRIR MODAL
  const handleStartRound = () => {
    if (!isOperator) {
      toast({
        title: "Sem permissão",
        description: "Apenas operadores podem criar rodadas",
        variant: "destructive"
      });
      return;
    }
    console.log('🎯 Abrindo modal de criação de rodada...');
    setShowCreateRoundModal(true);
  };

  // ✅ RENDERIZAÇÃO (sem modal por enquanto)
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <header className="bg-slate-800/50 border-b border-slate-700">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Bingo Web3
            </h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Carteira Necessária</h2>
            <p className="text-slate-400 mb-4">Conecte sua carteira para jogar</p>
            <WalletConnect />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
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
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Chainlink VRF
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            {isOperator && (
              <Link href="/admin/rounds">
                <Button size="sm" variant="outline" className="border-cyan-500 text-cyan-400">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Admin Rodadas
                </Button>
              </Link>
            )}
            
            <Badge variant="outline" className="text-slate-300">
              <Users className="h-3 w-3 mr-1" />
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Badge>
            
            {!isCorrectNetwork && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                Rede Incorreta
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Aviso de rede incorreta */}
        {!isCorrectNetwork && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Rede Incorreta</span>
            </div>
            <p className="text-sm">
              Conecte-se à rede local (localhost:8545) para jogar.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Área Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status das Rodadas */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    Status das Rodadas
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={refetchRounds}
                      size="sm"
                      variant="outline"
                      disabled={isLoadingRounds}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingRounds ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                    {/* ✅ BOTÃO PREPARADO PARA MODAL */}
                    {isOperator && (
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-cyan-500 to-purple-500"
                        onClick={handleStartRound}
                        disabled={isPending || isCreating}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {(isPending || isCreating) ? "Criando..." : "Criar Rodada"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Resto do conteúdo de rodadas */}
                {isLoadingRounds ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                    <p className="text-slate-400 text-sm">Buscando rodadas...</p>
                  </div>
                ) : roundsError ? (
                  <div className="text-center py-4">
                    <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 text-sm">Erro: {roundsError}</p>
                  </div>
                ) : hasActiveRounds ? (
                  <div className="space-y-3">
                    {activeRounds.map((round: any) => (
                      <div key={round.id.toString()} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium">Rodada #{round.id.toString()}</h3>
                          <Badge className={
                            round.estado === 1 ? "bg-green-500/20 text-green-400 border-green-500/30" :
                            round.estado === 2 ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                            "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          }>
                            {round.estado === 1 ? "Aberta" : round.estado === 2 ? "Sorteando" : "Inativa"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Taxa</p>
                            <p className="text-white">{formatEther(round.taxaEntrada)} ETH</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Prêmio</p>
                            <p className="text-white">{formatEther(round.premioTotal)} ETH</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Participantes</p>
                            <p className="text-white">{round.participantes}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Números</p>
                            <p className="text-white">{round.numerosSorteados.length}/{round.numeroMaximo}</p>
                          </div>
                        </div>
                        
                        {/* Números sorteados */}
                        {round.numerosSorteados.length > 0 && (
                          <div className="mt-3">
                            <p className="text-slate-400 text-sm mb-2">Números sorteados:</p>
                            <div className="flex flex-wrap gap-1">
                              {round.numerosSorteados.slice(-10).map((num: number, i: number) => (
                                <Badge key={i} className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                  {num}
                                </Badge>
                              ))}
                              {round.numerosSorteados.length > 10 && (
                                <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                                  +{round.numerosSorteados.length - 10}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Ações */}
                        {isOperator && round.estado === 1 && (
                          <div className="mt-3">
                            <Button
                              onClick={handleDrawNumber}
                              size="sm"
                              disabled={isPending}
                              className="bg-gradient-to-r from-yellow-500 to-orange-500"
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Sortear Número
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-400 mb-4">Nenhuma rodada ativa encontrada</p>
                    {isOperator ? (
                      <Button 
                        className="bg-gradient-to-r from-cyan-500 to-purple-500"
                        onClick={handleStartRound}
                        disabled={isPending || isCreating}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {(isPending || isCreating) ? "Criando..." : "Criar Primeira Rodada"}
                      </Button>
                    ) : (
                      <p className="text-slate-500 text-sm">Aguarde um operador criar uma rodada</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cartelas do Usuário */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    Suas Cartelas ({userCards.length})
                  </CardTitle>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    size="sm"
                    disabled={isCreatingCard || !isCorrectNetwork}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isCreatingCard ? "Criando..." : 
                      precoBase ? `Nova (${(Number(precoBase) / 1e18).toFixed(3)} ETH)` : "Nova Cartela"
                    }
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCards ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">Carregando cartelas...</p>
                  </div>
                ) : userCards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userCards.map((card) => (
                      <FixedBingoCard
                        key={card.id}
                        card={card}
                        drawnNumbers={currentRound?.numerosSorteados || []}
                        onJoinRound={handleJoinRound}
                        isParticipating={selectedCard === card.id}
                        canJoin={canJoinRounds}
                        isRegisteringNumbers={isRegisteringNumbers}
                        hasActiveRounds={hasActiveRounds}
                        activeRoundsCount={activeRounds.length}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">Você ainda não tem cartelas</p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      disabled={isCreatingCard || !isCorrectNetwork}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Cartela
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WalletConnect />
            <GameStats userCards={userCards} activeRound={currentRound} />
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Debug Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Rodadas Ativas:</span>
                  <span className="text-white">{activeRounds?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pode Participar:</span>
                  <span className={canJoinRounds ? "text-green-400" : "text-red-400"}>
                    {canJoinRounds ? "Sim" : "Não"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">É Operador:</span>
                  <span className={isOperator ? "text-green-400" : "text-red-400"}>
                    {isLoadingOperator ? "Verificando..." : (isOperator ? "Sim" : "Não")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Modal State:</span>
                  <span className="text-white">{showCreateRoundModal ? "Aberto" : "Fechado"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">isCreating:</span>
                  <span className={isCreating ? "text-yellow-400" : "text-white"}>
                    {isCreating ? "Sim" : "Não"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Criar Cartela */}
      {showCreateModal && (
        <CreateCardModal 
          onClose={() => setShowCreateModal(false)} 
          onCreateCard={handleCreateCard} 
        />
      )}

      {/* ✅ RENDERIZAR O MODAL CRIAR RODADA */}
      {showCreateRoundModal && (
        <CreateRoundModal
          onClose={() => setShowCreateRoundModal(false)}
          onCreateRound={handleCreateRound}
          isCreating={isCreating}
          // Você pode passar `currentStep` e `progress` do seu hook se os tiver
          // currentStep={seuHook.currentStep} 
          // progress={seuHook.progress}
        />
      )}
    </div>
  );
}