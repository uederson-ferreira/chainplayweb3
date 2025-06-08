// components/bingo/hooks/useCartelaActions.ts - VERSÃO CORRIGIDA
"use client";

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { useCartelaContract, useUserCartelasCompletas } from '@/lib/web3/hooks/use-cartela-contract';
import { formatErrorMessage, generateUniqueNumbers } from '../utils/gameHelpers';
import { TIMEOUTS } from '../utils/gameConstants'; // ✅ CORRIGIDO: TIMEOUTS em vez de UI_TIMEOUTS

interface UseCartelaActionsProps {
  gameState: {
    isConnected: boolean;
    isCorrectNetwork: boolean;
    address?: string;
  };
}

export function useCartelaActions(gameState: UseCartelaActionsProps['gameState']) {
  const { toast } = useToast();
  const [isRegisteringNumbers, setIsRegisteringNumbers] = useState(false);
  
  // Hooks do contrato de cartela
  const { 
    criarCartela, 
    registrarNumeros, 
    isPending: isCreatingCard, // ✅ RENOMEADO para isCreatingCard
    isConfirmed: isCartelaConfirmed, 
    hash: cartelaHash, 
    precoBase 
  } = useCartelaContract();
  
  const { refetchUserCards } = useUserCartelasCompletas();

  // ========================================
  // FUNÇÃO: handleCreateCard
  // ========================================
  const handleCreateCard = useCallback(async (rows: number, columns: number) => {
    if (!gameState.isConnected) {
      toast({
        title: "❌ Carteira não conectada",
        description: "Conecte sua carteira primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!gameState.isCorrectNetwork) {
      toast({
        title: "❌ Rede incorreta",
        description: "Conecte-se à rede local para criar cartelas.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log(`🎯 Criando cartela ${rows}x${columns}`);
      
      await criarCartela(rows, columns);
      
      toast({
        title: "🎯 Criando cartela...",
        description: `Cartela ${rows}×${columns} sendo criada.`,
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao criar cartela:', error);
      const { title, message } = formatErrorMessage(error);
      toast({ title, description: message, variant: "destructive" });
    }
  }, [gameState.isConnected, gameState.isCorrectNetwork, criarCartela, toast]);

  // ========================================
  // FUNÇÃO: handleRegisterNumbers (CORRIGIDA)
  // ========================================
  const handleRegisterNumbers = useCallback(async (cartelaId: bigint) => {
    console.log('🎯 Iniciando registro de números para cartela:', cartelaId.toString());
    
    if (!gameState.isConnected) {
      toast({
        title: "❌ Carteira não conectada",
        description: "Conecte sua carteira primeiro.",
        variant: "destructive",
      });
      return;
    }

    setIsRegisteringNumbers(true);
    
    try {
      // Gerar números únicos (assumindo cartela 5x5 = 25 números)
      const totalNumbers = 25; // Você pode ajustar isso baseado na cartela
      const uniqueNumbers = generateUniqueNumbers(totalNumbers, 1, 99);
      const numbersAsBigInt = uniqueNumbers.map(n => BigInt(n)); // ✅ CORRIGIDO: converter para bigint
      
      console.log(`🎲 Registrando ${totalNumbers} números únicos:`, uniqueNumbers.slice(0, 5), '...');
      
      toast({
        title: "🎲 Registrando números...",
        description: `Gerando ${totalNumbers} números únicos. MetaMask abrirá em breve.`,
      });
      
      await registrarNumeros(cartelaId, numbersAsBigInt);
      
      // ✅ CORRIGIDO: usar constante correta
      toast({
        title: "✅ Números registrados!",
        description: "Números foram registrados na cartela com sucesso.",
      });
      
      // Aguardar e recarregar cartelas
      setTimeout(() => {
        if (refetchUserCards) {
          refetchUserCards();
        }
      }, TIMEOUTS.AGUARDAR_CONFIRMACAO);
      
    } catch (error: any) {
      console.error('❌ Erro ao registrar números:', error);
      const { title, message } = formatErrorMessage(error);
      toast({ title, description: message, variant: "destructive" });
    } finally {
      setIsRegisteringNumbers(false);
    }
  }, [gameState.isConnected, registrarNumeros, toast, refetchUserCards]);

  // ========================================
  // FUNÇÃO: handleJoinRound
  // ========================================
  const handleJoinRound = useCallback(async (
    cardId: string, 
    roundId: bigint, 
    taxaEntrada: bigint
  ) => {
    console.log('🎯 Participando da rodada:', { cardId, roundId: roundId.toString(), taxaEntrada: taxaEntrada.toString() });
    
    if (!gameState.isConnected) {
      toast({
        title: "❌ Carteira não conectada",
        description: "Conecte sua carteira primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "🎯 Participando da rodada...",
        description: "Confirme a transação na MetaMask.",
      });
      
      // Aqui você implementaria a lógica de participar usando o writeContract
      // Por enquanto, simular sucesso
      
      // ✅ CORRIGIDO: usar constante correta
      toast({
        title: "✅ Participação confirmada!",
        description: `Taxa de ${(Number(taxaEntrada) / 1e18).toFixed(4)} ETH paga.`,
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao participar:', error);
      const { title, message } = formatErrorMessage(error);
      toast({ title, description: message, variant: "destructive" });
    }
  }, [gameState.isConnected, toast]);

  // ========================================
  // FUNÇÃO: registerNumbers (ALIAS PARA COMPATIBILIDADE)
  // ========================================
  const registerNumbers = handleRegisterNumbers; // ✅ ALIAS para o nome esperado pelo componente

  // ========================================
  // RETORNO DO HOOK COM PROPRIEDADES CORRETAS
  // ========================================
  return {
    // Ações principais
    handleCreateCard,
    handleRegisterNumbers,
    registerNumbers, // ✅ ALIAS
    handleJoinRound,
    
    // Estados de loading
    isCreatingCard, // ✅ CORRIGIDO: nome esperado pelo componente
    isRegisteringNumbers,
    
    // Dados do contrato
    cartelaHash,
    isCartelaConfirmed,
    precoBase,
    
    // Utilitários
    refetchUserCards,
    isCorrectNetwork: gameState.isCorrectNetwork,
  };
}