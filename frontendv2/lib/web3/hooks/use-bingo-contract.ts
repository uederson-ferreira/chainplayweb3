// ========================================
// 1. ARQUIVO: lib/web3/hooks/use-bingo-contract.ts
// ========================================

"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseEther } from "viem"
import { BINGO_ABI } from "../contracts/abis"
import { CONTRACTS } from "../config"

export function useBingoContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Iniciar rodada com parâmetros completos
  const iniciarRodada = async (
    numeroMaximo: number,
    taxaEntrada: bigint,
    timeoutRodada: bigint,
    padroesVitoria: boolean[]
  ) => {
    return writeContract({
      address: CONTRACTS.BINGO,
      abi: BINGO_ABI,
      functionName: "iniciarRodada",
      args: [numeroMaximo, taxaEntrada, timeoutRodada, padroesVitoria],
    })
  }

  // Participar da rodada (payable)
  const participar = async (rodadaId: bigint, cartelaId: bigint, taxaEntrada: bigint) => {
    return writeContract({
      address: CONTRACTS.BINGO,
      abi: BINGO_ABI,
      functionName: "participar",
      args: [rodadaId, cartelaId],
      value: taxaEntrada, // Pagamento obrigatório
    })
  }

  // Sortear número
  const sortearNumero = async (rodadaId: bigint) => {
    return writeContract({
      address: CONTRACTS.BINGO,
      abi: BINGO_ABI,
      functionName: "sortearNumero",
      args: [rodadaId],
    })
  }

  // Cancelar rodada
  const cancelarRodada = async (rodadaId: bigint, motivo: string) => {
    return writeContract({
      address: CONTRACTS.BINGO,
      abi: BINGO_ABI,
      functionName: "cancelarRodada",
      args: [rodadaId, motivo],
    })
  }

  return {
    iniciarRodada,
    participar,
    sortearNumero,
    cancelarRodada,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
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
    taxaEntrada: rodadaRaw[6],          // uint256 ← NOVO
    premioTotal: rodadaRaw[7],          // uint256 ← NOVO
    timestampInicio: rodadaRaw[8],      // uint256 ← NOVO
    timeoutRodada: rodadaRaw[9],        // uint256 ← NOVO
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