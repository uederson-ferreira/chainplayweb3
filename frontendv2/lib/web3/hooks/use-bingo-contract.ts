"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { BINGO_ABI } from "../contracts/abis"
import { CONTRACTS } from "../config"

export function useBingoContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Iniciar rodada
  const iniciarRodada = async (numeroMaximo: number) => {
    return writeContract({
      address: CONTRACTS.BINGO,
      abi: BINGO_ABI,
      functionName: "iniciarRodada",
      args: [numeroMaximo],
    })
  }

  // Participar da rodada
  const participar = async (rodadaId: bigint, cartelaId: bigint) => {
    return writeContract({
      address: CONTRACTS.BINGO,
      abi: BINGO_ABI,
      functionName: "participar",
      args: [rodadaId, cartelaId],
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

  // Distribuir prêmios
  const distribuirPremios = async (rodadaId: bigint) => {
    return writeContract({
      address: CONTRACTS.BINGO,
      abi: BINGO_ABI,
      functionName: "distribuirPremios",
      args: [rodadaId],
    })
  }

  return {
    iniciarRodada,
    participar,
    sortearNumero,
    distribuirPremios,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook para ler dados da rodada
export function useRodadaData(rodadaId?: bigint) {
  const { data: rodada } = useReadContract({
    address: CONTRACTS.BINGO,
    abi: BINGO_ABI,
    functionName: "rodadas",
    args: rodadaId ? [rodadaId] : undefined,
    query: {
      enabled: !!rodadaId,
    },
  })

  return {
    rodada,
  }
}
