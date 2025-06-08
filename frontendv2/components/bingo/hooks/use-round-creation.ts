// hooks/use-round-creation.ts - Hook para criação de rodadas
"use client";

import { useCallback, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { BINGO_ABI } from '@/lib/web3/contracts/abis';
import { CONTRACTS } from '@/lib/web3/config';
import deployment from '@/lib/web3/contracts/deployment.json';
import { 
  RoundCreationParams, 
  GameTypeConverter, 
  GAME_CONSTANTS 
} from '@/types/game-types';

export function useRoundCreation() {
  const { toast } = useToast();
  const [pendingSupabaseSave, setPendingSupabaseSave] = useState(false);
  
  // Hooks do wagmi
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Estados computados
  const isCreating = isPending || isConfirming || pendingSupabaseSave;

  // ✅ FUNÇÃO PRINCIPAL: createRound
  const createRound = useCallback(async (params: RoundCreationParams) => {
    console.log('🎯 use-round-creation: Iniciando criação de rodada...');
    console.log('📋 Parâmetros recebidos:', params);
    
    try {
      // ✅ VALIDAÇÕES
      if (params.numeroMaximo < GAME_CONSTANTS.MIN_NUMERO_MAXIMO || 
          params.numeroMaximo > GAME_CONSTANTS.MAX_NUMERO_MAXIMO) {
        throw new Error(`Número máximo deve estar entre ${GAME_CONSTANTS.MIN_NUMERO_MAXIMO} e ${GAME_CONSTANTS.MAX_NUMERO_MAXIMO}`);
      }

      const taxaFloat = parseFloat(params.taxaEntrada);
      if (taxaFloat < parseFloat(GAME_CONSTANTS.MIN_TAXA_ENTRADA) || 
          taxaFloat > parseFloat(GAME_CONSTANTS.MAX_TAXA_ENTRADA)) {
        throw new Error(`Taxa deve estar entre ${GAME_CONSTANTS.MIN_TAXA_ENTRADA} e ${GAME_CONSTANTS.MAX_TAXA_ENTRADA} ETH`);
      }

      if (params.timeoutHoras < GAME_CONSTANTS.MIN_TIMEOUT_HORAS || 
          params.timeoutHoras > GAME_CONSTANTS.MAX_TIMEOUT_HORAS) {
        throw new Error(`Timeout deve estar entre ${GAME_CONSTANTS.MIN_TIMEOUT_HORAS} e ${GAME_CONSTANTS.MAX_TIMEOUT_HORAS} horas`);
      }

      // ✅ CONVERSÃO PARA PARÂMETROS DO CONTRATO
      const contractParams = GameTypeConverter.hookToContract(params);
      
      console.log('🔄 Parâmetros convertidos para contrato:', {
        numeroMaximo: contractParams.numeroMaximo,
        taxaEntrada: contractParams.taxaEntrada.toString() + ' wei',
        timeoutRodada: contractParams.timeoutRodada.toString() + ' segundos',
        padroesVitoria: contractParams.padroesVitoria
      });

      // ✅ TOAST DE INÍCIO
      toast({
        title: "🚀 Criando rodada...",
        description: `Números 1-${params.numeroMaximo}, Taxa: ${params.taxaEntrada} ETH`,
      });

      // ✅ CHAMAR CONTRATO
      await writeContract({
        address: deployment.bingoContract as `0x${string}`,
        abi: BINGO_ABI,
        functionName: 'iniciarRodada',
        args: [
          contractParams.numeroMaximo,
          contractParams.taxaEntrada,
          contractParams.timeoutRodada,
          contractParams.padroesVitoria
        ],
        gas: BigInt(300000),
        gasPrice: BigInt(2000000000), // 2 gwei
      });

      console.log('✅ writeContract executado com sucesso!');
      
    } catch (error: any) {
      console.error('❌ Erro na criação da rodada:', error);
      
      // ✅ TRATAMENTO DE ERROS MELHORADO
      let errorTitle = "Erro ao criar rodada";
      let errorMessage = "Erro desconhecido";
      
      if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
        errorTitle = "Transação cancelada";
        errorMessage = "Você cancelou a transação na MetaMask";
      } else if (error.message?.includes('insufficient funds')) {
        errorTitle = "Saldo insuficiente";
        errorMessage = "ETH insuficiente para pagar o gas da transação";
      } else if (error.message?.includes('execution reverted')) {
        errorTitle = "Transação rejeitada";
        errorMessage = "Verifique se você tem permissões de operador";
      } else if (error.message?.includes('Número máximo') || 
                 error.message?.includes('Taxa deve') || 
                 error.message?.includes('Timeout deve')) {
        errorTitle = "Parâmetros inválidos";
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error; // Re-throw para que o componente possa lidar com o erro
    }
  }, [writeContract, toast]);

  // ✅ EFEITO PARA SUCESSO DA TRANSAÇÃO
  useState(() => {
    if (isConfirmed && hash) {
      console.log('✅ Rodada criada com sucesso! Hash:', hash);
      
      toast({
        title: "✅ Rodada criada com sucesso!",
        description: "A nova rodada está ativa para participações",
      });
      
      // Simular salvamento no Supabase se necessário
      if (typeof window !== 'undefined' && window.localStorage) {
        setPendingSupabaseSave(true);
        
        setTimeout(() => {
          setPendingSupabaseSave(false);
          console.log('📝 Dados salvos localmente (simulação)');
        }, 1000);
      }
    }
  });

  // ✅ RETORNO DO HOOK
  return {
    createRound,
    isCreating,
    isConfirmed,
    error,
    hash,
    pendingSupabaseSave,
    
    // Estados detalhados para debug
    isPending,
    isConfirming,
  };
}