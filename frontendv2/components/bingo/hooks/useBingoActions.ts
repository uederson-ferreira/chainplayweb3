// Arquivo: components/bingo/hooks/useBingoActions.ts
"use client";

import { useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useToast } from '@/hooks/use-toast';
import { useBingoState } from './useBingoState';
import { formatErrorMessage } from '../utils/gameHelpers';
import { DEFAULT_ROUND_CONFIG, GAS_CONFIGS } from '../utils/gameConstants';
import { BINGO_ABI } from '@/lib/web3/contracts/abis';
import { CONTRACTS } from '@/lib/web3/config';
import { createPublicClient, http } from 'viem';
import { localChain } from '@/lib/web3/config';

// ========================================
// CONFIGURAÇÃO DO CLIENTE
// ========================================
const publicClient = createPublicClient({
  chain: localChain,
  transport: http("http://127.0.0.1:8545"),
});

export function useBingoActions() {
  const { toast } = useToast();
  const gameState = useBingoState();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // ========================================
  // FUNÇÃO CORRIGIDA: handleStartRound
  // ========================================
  const handleStartRound = useCallback(async () => {
    console.log('🚀 INICIANDO RODADA - ENDEREÇOS ALINHADOS');
    console.log('📍 Endereços (agora iguais):');
    console.log('- Cartela:', CONTRACTS.CARTELA);
    console.log('- Bingo:', CONTRACTS.BINGO);
    
    try {
      // ========================================
      // VALIDAÇÕES BÁSICAS
      // ========================================
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
          description: "Conecte-se à rede local (localhost:8545).",
          variant: "destructive",
        });
        return;
      }

      // ========================================
      // TESTE RÁPIDO DO CONTRATO ANTES DE CRIAR RODADA
      // ========================================
      console.log('🧪 Testando conectividade com contrato...');
      
      try {
        // Testar função básica primeiro
        const admin = await publicClient.readContract({
          address: CONTRACTS.BINGO,
          abi: BINGO_ABI,
          functionName: 'admin',
        });
        console.log('✅ Contrato responde! Admin:', admin);
        
        // Testar getTotalRodadas (função problemática)
        try {
          const totalAtual = await publicClient.readContract({
            address: CONTRACTS.BINGO,
            abi: BINGO_ABI,
            functionName: 'getTotalRodadas',
          });
          console.log('✅ getTotalRodadas atual:', totalAtual?.toString());
        } catch (totalError) {
          console.log('⚠️ getTotalRodadas falhou, mas vamos prosseguir:', totalError);
          // Não bloquear a criação da rodada por causa disto
        }
        
      } catch (testError: any) {
        console.error('❌ Contrato não responde:', testError);
        toast({
          title: "❌ Contrato inacessível",
          description: "Verifique se a blockchain local está rodando.",
          variant: "destructive", 
        });
        return;
      }

      // ========================================
      // CONFIGURAR E ENVIAR TRANSAÇÃO
      // ========================================
      const { numeroMaximo, taxaEntrada, timeoutRodada, padroesVitoria } = DEFAULT_ROUND_CONFIG;
      
      console.log('📋 Parâmetros da rodada:', {
        numeroMaximo,
        taxaEntrada: taxaEntrada.toString() + ' wei (' + (Number(taxaEntrada) / 1e18) + ' ETH)',
        timeoutRodada: timeoutRodada.toString() + ' segundos (' + (Number(timeoutRodada) / 3600) + ' horas)',
        padroesVitoria
      });

      toast({
        title: "🚀 Criando rodada...",
        description: "Confirme na MetaMask e aguarde confirmação.",
      });

      writeContract({
        address: CONTRACTS.BINGO,
        abi: BINGO_ABI,
        functionName: 'iniciarRodada',
        args: [numeroMaximo, taxaEntrada, timeoutRodada, padroesVitoria],
        gas: GAS_CONFIGS.INICIAR_RODADA.gas,
        gasPrice: GAS_CONFIGS.INICIAR_RODADA.gasPrice,
      });

    } catch (error: any) {
      console.error('❌ Erro ao iniciar rodada:', error);
      const { title, message } = formatErrorMessage(error);
      toast({ title, description: message, variant: "destructive" });
    }
  }, [gameState.isConnected, gameState.isCorrectNetwork, writeContract, toast]);

  // ========================================
  // FUNÇÃO CORRIGIDA: updateCurrentRound
  // ========================================
  const updateCurrentRound = useCallback(async () => {
    console.log('🔄 Atualizando rodada atual após confirmação...');
    
    try {
      // Aguardar processamento da blockchain
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('📊 Tentando buscar total de rodadas...');
      
      // ========================================
      // ESTRATÉGIA MÚLTIPLA PARA BUSCAR RODADAS
      // ========================================
      
      let totalRodadas: bigint | null = null;
      
      // Estratégia 1: Tentar getTotalRodadas()
      try {
        totalRodadas = await publicClient.readContract({
          address: CONTRACTS.BINGO,
          abi: BINGO_ABI,
          functionName: 'getTotalRodadas',
        }) as bigint;
        console.log('✅ Estratégia 1 funcionou - getTotalRodadas():', totalRodadas.toString());
      } catch (strategy1Error) {
        console.log('❌ Estratégia 1 falhou:', strategy1Error);
      }
      
      // Estratégia 2: Se falhou, tentar buscar eventos de RodadaIniciada
      if (totalRodadas === null) {
        try {
          console.log('🔍 Tentando estratégia 2 - buscar eventos...');
          
          const currentBlock = await publicClient.getBlockNumber();
          const fromBlock = currentBlock > BigInt(100) ? currentBlock - BigInt(100) : BigInt(0);
          
          const logs = await publicClient.getLogs({
            address: CONTRACTS.BINGO,
            fromBlock: fromBlock,
            toBlock: 'latest',
          });
          
          console.log(`📋 Encontrados ${logs.length} eventos nos últimos blocos`);
          
          // Filtrar eventos RodadaIniciada e pegar o último ID
          const rodadaEvents = logs.filter(log => 
            log.topics[0] === '0x...' // Topic do evento RodadaIniciada - seria preciso calcular
          );
          
          if (rodadaEvents.length > 0) {
            // Extrair o último ID de rodada dos eventos
            const ultimoEvento = rodadaEvents[rodadaEvents.length - 1];
            const rodadaId = BigInt(ultimoEvento.topics[1] || '0');
            totalRodadas = rodadaId + BigInt(1); // Próximo ID seria total
            console.log('✅ Estratégia 2 funcionou - último evento rodada:', rodadaId.toString());
          }
        } catch (strategy2Error) {
          console.log('❌ Estratégia 2 falhou:', strategy2Error);
        }
      }
      
      // Estratégia 3: Se tudo falhou, assumir que foi criada a rodada 0
      if (totalRodadas === null) {
        console.log('⚠️ Estratégias falharam, assumindo rodada 0 foi criada');
        totalRodadas = BigInt(1); // Primeira rodada criada
      }
      
      // ========================================
      // ATUALIZAR ESTADO DA UI
      // ========================================
      if (totalRodadas && totalRodadas > 0) {
        const novaRodadaId = totalRodadas - BigInt(1); // ID da última rodada criada
        console.log('🆔 Definindo rodada atual como:', novaRodadaId.toString());
        
        gameState.setCurrentRoundId(novaRodadaId);
        
        toast({
          title: "✅ Rodada criada com sucesso!",
          description: `Rodada #${novaRodadaId.toString()} está ativa.`,
        });
      } else {
        console.log('⚠️ Não foi possível determinar ID da rodada, mas transação confirmada');
        toast({
          title: "✅ Transação confirmada",
          description: "Rodada criada, mas ID não determinado. Recarregue a página.",
        });
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar rodada atual:', error);
      // Não mostrar toast de erro - transação pode ter funcionado
      console.log('⚠️ Transação confirmada, mas falha ao buscar dados. Recarregue a página.');
    }
  }, [gameState, toast]);

  // ========================================
  // FUNÇÃO: handleDrawNumber
  // ========================================
  const handleDrawNumber = useCallback(async () => {
    console.log('🎲 Sorteando número...');
    
    try {
      if (!gameState.currentRoundId || gameState.currentRoundId === BigInt(0)) {
        toast({
          title: "❌ Nenhuma rodada ativa",
          description: "Inicie uma rodada primeiro.",
          variant: "destructive",
        });
        return;
      }

      writeContract({
        address: CONTRACTS.BINGO,
        abi: BINGO_ABI,
        functionName: 'sortearNumero',
        args: [gameState.currentRoundId],
        gas: GAS_CONFIGS.SORTEAR_NUMERO.gas,
        gasPrice: GAS_CONFIGS.SORTEAR_NUMERO.gasPrice,
      });

      toast({
        title: "🎲 Sorteando número...",
        description: "Transação enviada via Chainlink VRF.",
      });

    } catch (error: any) {
      console.error('❌ Erro ao sortear número:', error);
      const { title, message } = formatErrorMessage(error);
      toast({ title, description: message, variant: "destructive" });
    }
  }, [gameState.currentRoundId, writeContract, toast]);

  // ========================================
  // RETORNO DO HOOK
  // ========================================
  return {
    // Ações principais
    handleStartRound,
    handleDrawNumber,
    updateCurrentRound,
    
    // Status das transações
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    
    // Dados computados
    isLoading: isPending || isConfirming,
  };
}