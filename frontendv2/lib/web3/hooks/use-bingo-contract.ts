// ========================================
//lib/web3/hooks/use-bingo-contract.ts
// ========================================

"use client"

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { BINGO_ABI } from "../contracts/abis"
import { CONTRACTS } from "../config"
import deployment from "@/lib/web3/contracts/deployment.json";

const bingoContractConfig = {
    address: deployment.bingoContract as `0x${string}`,
    abi: BINGO_ABI,
};

export function useBingoContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // ========================================
  // CORREÇÃO 1: LOGS DE DEBUG E VALIDAÇÃO (CORRIGIDO)
  // ========================================
  console.log('🔍 Debug do contrato Bingo:', {
    address: CONTRACTS.BINGO,
    hasAddress: !!CONTRACTS.BINGO,
    abiLength: BINGO_ABI.length,
    // CORRIGIDO: Filtrar apenas funções antes de procurar por name
    temIniciarRodada: BINGO_ABI.filter(item => item.type === 'function').find(f => f.name === 'iniciarRodada')
  })

  // ========================================
  // CORREÇÃO 2: FUNÇÃO iniciarRodada MELHORADA (CORRIGIDO)
  // ========================================
  const iniciarRodada = async (
    numeroMaximo: number,
    taxaEntrada: bigint,
    timeoutRodada: bigint,
    padroesVitoria: boolean[]
  ) => {
    console.log('🎯 INICIANDO CORREÇÃO DA RODADA')
    console.log('📋 Parâmetros recebidos:', {
      numeroMaximo,
      numeroMaximoType: typeof numeroMaximo,
      taxaEntrada: taxaEntrada.toString(),
      taxaEntradaType: typeof taxaEntrada,
      timeoutRodada: timeoutRodada.toString(),
      timeoutRodadaType: typeof timeoutRodada,
      padroesVitoria,
      padroesVitoriaType: typeof padroesVitoria,
      isPadroesArray: Array.isArray(padroesVitoria)
    })

    // ========================================
    // VALIDAÇÕES OBRIGATÓRIAS (CORRIGIDAS)
    // ========================================
    if (!CONTRACTS.BINGO) {
      throw new Error('❌ Endereço do contrato Bingo não configurado')
    }

    if (!BINGO_ABI || BINGO_ABI.length < 1) {
      throw new Error('❌ ABI do contrato Bingo não encontrada')
    }

    // CORRIGIDO: Filtrar apenas funções antes de procurar
    const funcoesBingo = BINGO_ABI.filter(item => item.type === 'function')
    const iniciarRodadaABI = funcoesBingo.find(f => f.name === 'iniciarRodada')
    
    if (!iniciarRodadaABI) {
      throw new Error('❌ Função iniciarRodada não encontrada na ABI')
    }

    // Validar parâmetros específicos
    if (numeroMaximo < 10 || numeroMaximo > 99) {
      throw new Error('❌ numeroMaximo deve estar entre 10 e 99')
    }

    if (taxaEntrada <= 0) {
      throw new Error('❌ taxaEntrada deve ser maior que 0')
    }

    if (timeoutRodada < 1800 || timeoutRodada > 86400) {
      throw new Error('❌ timeoutRodada deve estar entre 30min e 24h')
    }

    if (!Array.isArray(padroesVitoria) || padroesVitoria.length !== 4) {
      throw new Error('❌ padroesVitoria deve ser array com exatamente 4 elementos')
    }

    console.log('✅ Todas as validações passaram!')

    // ========================================
    // CORREÇÃO 3: CHAMADA writeContract CORRIGIDA
    // ========================================
    try {
      console.log('📤 Enviando writeContract com configuração corrigida...')
      
      // Configuração explícita e corrigida
      const contractConfig = {
        address: CONTRACTS.BINGO as `0x${string}`,
        abi: BINGO_ABI,
        functionName: "iniciarRodada" as const,
        args: [
          Number(numeroMaximo),        // Garantir que é number
          taxaEntrada,                 // Já é bigint
          timeoutRodada,               // Já é bigint
          padroesVitoria              // Já é boolean[]
        ],
        // Configurações de gas explícitas
        gas: BigInt(300000),
        gasPrice: BigInt(2000000000), // 2 gwei
      } as const

      console.log('📋 Configuração final da transação:', contractConfig)
      
      const resultado = await writeContract(contractConfig)
      
      console.log('🎉 writeContract executado!')
      console.log('📋 Resultado completo:', resultado)
      console.log('📋 Tipo do resultado:', typeof resultado)
      
      // CORRIGIDO: Não tentar usar hash aqui, ele vem do hook separadamente
      console.log('💡 O hash será disponível no hook data')
      
      return resultado
      
    } catch (error: any) {
      console.error('❌ ERRO DETALHADO na writeContract:', error)
      console.error('❌ Error name:', error?.name)
      console.error('❌ Error code:', error?.code)
      console.error('❌ Error message:', error?.message)
      console.error('❌ Error cause:', error?.cause)
      console.error('❌ Error details:', error?.details)
      console.error('❌ Stack trace:', error?.stack)
      
      // Melhor tratamento de erros
      if (error?.message?.includes('user rejected') || error?.message?.includes('User denied')) {
        throw new Error('Transação cancelada pelo usuário na MetaMask')
      } else if (error?.message?.includes('insufficient funds')) {
        throw new Error('ETH insuficiente para pagar o gas da transação')
      } else if (error?.message?.includes('execution reverted')) {
        throw new Error('Transação rejeitada pelo contrato - verifique se você é operador')
      } else if (error?.message?.includes('network')) {
        throw new Error('Erro de rede - verifique sua conexão')
      } else {
        throw new Error(`Erro na transação: ${error?.message || 'Erro desconhecido'}`)
      }
    }
  }

  // Participar da rodada (payable)
  const participar = async (rodadaId: bigint, cartelaId: bigint, taxaEntrada: bigint) => {
    console.log('🎯 Participando da rodada:', { rodadaId, cartelaId, taxaEntrada })
    
    try {
      return await writeContract({
        address: CONTRACTS.BINGO as `0x${string}`,
        abi: BINGO_ABI,
        functionName: "participar",
        args: [rodadaId, cartelaId],
        value: taxaEntrada, // Pagamento obrigatório
        gas: BigInt(200000),
        gasPrice: BigInt(2000000000),
      })
    } catch (error: any) {
      console.error('❌ Erro ao participar:', error)
      throw error
    }
  }

  // Sortear número
  const sortearNumero = async (rodadaId: bigint) => {
    console.log('🎯 Sorteando número para rodada:', rodadaId)
    
    try {
      return await writeContract({
        address: CONTRACTS.BINGO as `0x${string}`,
        abi: BINGO_ABI,
        functionName: "sortearNumero",
        args: [rodadaId],
        gas: BigInt(250000),
        gasPrice: BigInt(2000000000),
      })
    } catch (error: any) {
      console.error('❌ Erro ao sortear número:', error)
      throw error
    }
  }

  // Cancelar rodada
  const cancelarRodada = async (rodadaId: bigint, motivo: string) => {
    console.log('🎯 Cancelando rodada:', { rodadaId, motivo })
    
    try {
      return await writeContract({
        address: CONTRACTS.BINGO as `0x${string}`,
        abi: BINGO_ABI,
        functionName: "cancelarRodada",
        args: [rodadaId, motivo],
        gas: BigInt(200000),
        gasPrice: BigInt(2000000000),
      })
    } catch (error: any) {
      console.error('❌ Erro ao cancelar rodada:', error)
      throw error
    }
  }

  return {
    iniciarRodada,
    participar,
    sortearNumero,
    cancelarRodada,
    hash,           // IMPORTANTE: Exportar hash
    isPending,
    isConfirming,   // IMPORTANTE: Exportar isConfirming  
    isConfirmed,    // IMPORTANTE: Exportar isConfirmed
    error,
  }
}

export function useTotalRodadas() {
    const { data, isLoading, refetch } = useReadContract({
        ...bingoContractConfig,
        functionName: 'getTotalRodadas',
    });
    return { totalRodadas: data as bigint | undefined, isLoading, refetch };
}

// Hook para ler dados da rodada com TODOS os campos
export function useRodadaData(rodadaId?: bigint) {
  const { data: rodadaRaw } = useReadContract({
    address: CONTRACTS.BINGO,
    abi: BINGO_ABI,
    functionName: "rodadas",
    args: rodadaId ? [rodadaId] : undefined,
    query: {
      enabled: !!rodadaId,
    },
  })

  // Converter array em objeto com TODOS os campos do ABI
  const rodada = rodadaRaw ? {
    id: rodadaRaw[0],                    // uint256
    estado: rodadaRaw[1],               // enum (0=Inativa, 1=Aberta, 2=Sorteando, 3=Finalizada, 4=Cancelada)
    numeroMaximo: rodadaRaw[2],         // uint8
    ultimoRequestId: rodadaRaw[3],      // uint256
    pedidoVrfPendente: rodadaRaw[4],    // bool
    premiosDistribuidos: rodadaRaw[5],  // bool
    taxaEntrada: rodadaRaw[6],          // uint256
    premioTotal: rodadaRaw[7],          // uint256
    timestampInicio: rodadaRaw[8],      // uint256
    timeoutRodada: rodadaRaw[9],        // uint256
  } : null

  return {
    rodada,
    rodadaRaw,
  }
}

// Hook para números sorteados
export function useNumerosSorteados(rodadaId?: bigint) {
  const { data: numerosSorteados } = useReadContract({
    address: CONTRACTS.BINGO,
    abi: BINGO_ABI,
    functionName: "getNumerosSorteados",
    args: rodadaId ? [rodadaId] : undefined,
    query: {
      enabled: !!rodadaId,
    },
  })

  return {
    numerosSorteados: numerosSorteados ? numerosSorteados.map(n => Number(n)) : [],
  }
}

// Hook para vencedores
export function useVencedores(rodadaId?: bigint) {
  const { data: vencedores } = useReadContract({
    address: CONTRACTS.BINGO,
    abi: BINGO_ABI,
    functionName: "getVencedores",
    args: rodadaId ? [rodadaId] : undefined,
    query: {
      enabled: !!rodadaId,
    },
  })

  return {
    vencedores: vencedores || [],
  }
}

export function useIsOperator() {
  const { address, isConnected } = useAccount();

  const { data, isLoading } = useReadContract({
    ...bingoContractConfig, // Este config já deve estar definido no topo do seu arquivo
    functionName: 'operadores',
    args: [address!],
    query: {
      enabled: isConnected && !!address,
    },
  });

  return { isOperator: data as boolean, isLoading };
}