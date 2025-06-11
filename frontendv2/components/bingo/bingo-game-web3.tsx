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
// ❌ REMOVIDO: import deployment from "@/lib/web3/contracts/deployment.json";
// ✅ ADICIONADO: Import do config que usa .env
import { CONTRACTS } from "@/lib/web3/config";
import { useRoundCreation } from "./hooks/use-round-creation";
import { useActiveRounds } from "@/lib/web3/hooks/use-active-rounds";
import { useBingoActions } from './hooks/useBingoActions';
import { useEnhancedActiveRounds } from "@/lib/web3/hooks/use-enhanced-active-rounds";
import CreateRoundModal, { RichRoundCreationParams } from "./CreateRoundModal";

// ===== VALIDAÇÃO CRÍTICA: .env OBRIGATÓRIO =====
if (!CONTRACTS.BINGO || !CONTRACTS.CARTELA) {
  console.error('❌ CONTRATOS NÃO CONFIGURADOS NO .env:');
  console.error('   BINGO:', CONTRACTS.BINGO);
  console.error('   CARTELA:', CONTRACTS.CARTELA);
  throw new Error('Configure NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS e NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS no .env.local');
}

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
  
  // ✅ HOOKS CORRIGIDOS (agora usam dados reais)
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
  
  // ✅ LOGS DEBUG MELHORADOS (mostram origem dos dados)
  console.log('🎯 ESTADO ATUAL DO JOGO (DADOS REAIS):', {
    isConnected,
    isCorrectNetwork,
    hasActiveRounds, // ← Agora é REAL da blockchain
    activeRoundsCount: activeRounds.length, // ← REAL
    currentRoundId: currentRoundId?.toString(), // ← REAL
    canJoinRounds, // ← REAL
    userCardsCount: userCards.length,
    roundsError, // ← Mostra erros reais
    contractAddresses: {
      bingo: CONTRACTS.BINGO, // ← Do .env
      cartela: CONTRACTS.CARTELA // ← Do .env
    }
  });

  // ✅ EFEITOS (mantidos)
  useEffect(() => {
    if (isConfirmed) {
      toast({ 
        title: "✅ Transação Confirmada!", 
        description: "Recarregando dados da blockchain..." 
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

  // ✅ VALIDAÇÃO ADICIONAL: Verificar se .env está configurado
  useEffect(() => {
    if (isConnected && (!CONTRACTS.BINGO || !CONTRACTS.CARTELA)) {
      toast({
        title: "❌ Configuração Incompleta",
        description: "Configure os endereços dos contratos no .env.local",
        variant: "destructive"
      });
    }
  }, [isConnected]);

  // ✅ FUNÇÕES DE MANIPULAÇÃO (handlers) CORRIGIDAS
  const handleCreateCard = async (rows: number, columns: number) => {
    if (!isConnected || !isCorrectNetwork) {
      toast({
        title: "Erro de conexão",
        description: "Conecte-se à rede local para criar cartelas",
        variant: "destructive"
      });
      return;
    }

    // ✅ VALIDAÇÃO: Verificar se contrato está configurado
    if (!CONTRACTS.CARTELA) {
      toast({
        title: "Erro de configuração",
        description: "Endereço do contrato de cartela não configurado no .env",
        variant: "destructive"
      });
      return;
    }

    try {
      await criarCartela(rows, columns);
      toast({
        title: "Criando cartela...",
        description: `Cartela ${rows}×${columns} sendo criada na blockchain.`,
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
        description: "Aguarde uma rodada ser criada na blockchain",
        variant: "destructive"
      });
      return;
    }

    // ✅ VALIDAÇÃO: Verificar se contrato está configurado
    if (!CONTRACTS.BINGO) {
      toast({
        title: "Erro de configuração",
        description: "Endereço do contrato de bingo não configurado no .env",
        variant: "destructive"
      });
      return;
    }

    try {
      const taxaEntrada = currentRound.taxaEntrada;
      
      // ✅ CORRIGIDO: Usar CONTRACTS.BINGO do .env
      writeContract({
        address: CONTRACTS.BINGO, // ← USAR .ENV em vez de deployment
        abi: BINGO_ABI,
        functionName: 'participar',
        args: [currentRound.id, BigInt(cardId)],
        value: taxaEntrada,
      });

      setSelectedCard(cardId);
      toast({
        title: "Participando da rodada...",
        description: `Taxa: ${formatEther(taxaEntrada)} ETH | Contrato: ${CONTRACTS.BINGO.slice(0, 8)}...`,
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
    if (!currentRound) {
      toast({
        title: "Nenhuma rodada ativa",
        description: "Não há rodadas ativas na blockchain para sortear números",
        variant: "destructive"
      });
      return;
    }

    // ✅ VALIDAÇÃO: Verificar se contrato está configurado
    if (!CONTRACTS.BINGO) {
      toast({
        title: "Erro de configuração",
        description: "Endereço do contrato de bingo não configurado no .env",
        variant: "destructive"
      });
      return;
    }

    try {
      // ✅ CORRIGIDO: Usar CONTRACTS.BINGO do .env
      writeContract({
        address: CONTRACTS.BINGO, // ← USAR .ENV em vez de deployment
        abi: BINGO_ABI,
        functionName: 'sortearNumero',
        args: [currentRound.id],
      });

      toast({
        title: "Sorteando número...",
        description: `Solicitação VRF enviada para rodada ${currentRound.id.toString()}`,
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
      
      const paramsForHook: UnifiedRoundCreationParams = {
        numeroMaximo: params.numeroMaximo,
        taxaEntrada: params.taxaEntrada,
        timeoutHoras: params.duracaoHoras,
        padroesVitoria: params.padroesVitoria
      };
      
      console.log('🔄 Convertendo para o formato do hook:', paramsForHook);
      console.log('📍 Usando contrato do .env:', CONTRACTS.BINGO);
      
      await createRound(paramsForHook);
      
      toast({ 
        title: "Sucesso!", 
        description: `Rodada sendo criada no contrato ${CONTRACTS.BINGO.slice(0, 8)}...` 
      });
      setShowCreateRoundModal(false);
      
      setTimeout(() => refetchRounds(), 3000);
      
    } catch (error: any) {
      console.error('❌ Erro na criação da rodada:', error);
      toast({ 
        title: "Erro ao criar rodada", 
        description: error.message || "Verifique se você é operador e .env está configurado",
        variant: "destructive"
      });
    }
  };

  const handleStartRound = () => {
    if (!isOperator) {
      toast({
        title: "Sem permissão",
        description: "Apenas operadores podem criar rodadas",
        variant: "destructive"
      });
      return;
    }

    // ✅ VALIDAÇÃO: Verificar se contrato está configurado
    if (!CONTRACTS.BINGO) {
      toast({
        title: "Erro de configuração",
        description: "Configure NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS no .env.local",
        variant: "destructive"
      });
      return;
    }

    console.log('🎯 Abrindo modal de criação de rodada...');
    console.log('📍 Contrato alvo (.env):', CONTRACTS.BINGO);
    setShowCreateRoundModal(true);
  };

  // ✅ RENDERIZAÇÃO COM VALIDAÇÃO DE .env
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
            
            {/* ✅ NOVO: Info de configuração */}
            <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Contratos configurados:</p>
              <p className="text-xs text-slate-300 font-mono break-all">
                Bingo: {CONTRACTS.BINGO || '❌ Não configurado'}
              </p>
              <p className="text-xs text-slate-300 font-mono break-all">
                Cartela: {CONTRACTS.CARTELA || '❌ Não configurado'}
              </p>
            </div>
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
        {/* ✅ NOVO: Aviso de configuração incompleta */}
        {(!CONTRACTS.BINGO || !CONTRACTS.CARTELA) && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Configuração Incompleta</span>
            </div>
            <p className="text-sm mb-2">Configure os endereços dos contratos no .env.local:</p>
            <div className="text-xs font-mono bg-black/20 p-2 rounded">
              NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS={CONTRACTS.BINGO || 'NÃO_CONFIGURADO'}<br/>
              NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS={CONTRACTS.CARTELA || 'NÃO_CONFIGURADO'}
            </div>
          </div>
        )}

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
            {/* Status das Rodadas - DADOS REAIS */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    Status das Rodadas (BLOCKCHAIN REAL)
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
                    {isOperator && CONTRACTS.BINGO && (
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
                {isLoadingRounds ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                    <p className="text-slate-400 text-sm">Buscando rodadas reais da blockchain...</p>
                  </div>
                ) : roundsError ? (
                  <div className="text-center py-4">
                    <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 text-sm">Erro: {roundsError}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Contrato: {CONTRACTS.BINGO?.slice(0, 8)}...
                    </p>
                  </div>
                ) : hasActiveRounds ? (
                  <div className="space-y-3">
                    <p className="text-green-400 text-sm">
                      ✅ {activeRounds.length} rodada(s) REAL(is) encontrada(s) na blockchain
                    </p>
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
                    <p className="text-slate-400 mb-4">
                      Nenhuma rodada REAL encontrada na blockchain
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      Contrato verificado: {CONTRACTS.BINGO?.slice(0, 8)}...
                    </p>
                    {isOperator && CONTRACTS.BINGO ? (
                      <Button 
                        className="bg-gradient-to-r from-cyan-500 to-purple-500"
                        onClick={handleStartRound}
                        disabled={isPending || isCreating}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {(isPending || isCreating) ? "Criando..." : "Criar Primeira Rodada REAL"}
                      </Button>
                    ) : !CONTRACTS.BINGO ? (
                      <p className="text-slate-500 text-sm">Configure .env para criar rodadas</p>
                    ) : (
                      <p className="text-slate-500 text-sm">Aguarde um operador criar uma rodada</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cartelas do Usuário - resto igual... */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    Suas Cartelas ({userCards.length})
                  </CardTitle>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    size="sm"
                    disabled={isCreatingCard || !isCorrectNetwork || !CONTRACTS.CARTELA}
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
                      disabled={isCreatingCard || !isCorrectNetwork || !CONTRACTS.CARTELA}
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
            
            {/* ✅ DEBUG INFO MELHORADO */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Debug Info (DADOS REAIS)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fonte dos Dados:</span>
                  <span className="text-green-400">Blockchain (.env)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bingo Contract:</span>
                  <span className="text-white font-mono">{CONTRACTS.BINGO?.slice(0, 10)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cartela Contract:</span>
                  <span className="text-white font-mono">{CONTRACTS.CARTELA?.slice(0, 10)}...</span>
                </div>
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
                  <span className="text-slate-400">Error State:</span>
                  <span className={roundsError ? "text-red-400" : "text-green-400"}>
                    {roundsError ? "Sim" : "Limpo"}
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

      {/* Modal Criar Rodada */}
      {showCreateRoundModal && (
        <CreateRoundModal
          onClose={() => setShowCreateRoundModal(false)}
          onCreateRound={handleCreateRound}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}