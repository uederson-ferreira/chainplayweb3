"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CARTELA_ABI } from "../contracts/abis"
import { CONTRACTS } from "../config"

export function useCartelaContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Criar cartela
  const criarCartela = async (linhas: number, colunas: number) => {
    return writeContract({
      address: CONTRACTS.CARTELA,
      abi: CARTELA_ABI,
      functionName: "criarCartela",
      args: [linhas, colunas],
    })
  }

  // Registrar números da cartela
  const registrarNumeros = async (cartelaId: bigint, numeros: bigint[]) => {
    return writeContract({
      address: CONTRACTS.CARTELA,
      abi: CARTELA_ABI,
      functionName: "registrarNumerosCartela",
      args: [cartelaId, numeros],
    })
  }

  return {
    criarCartela,
    registrarNumeros,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// Hook para ler dados da cartela
export function useCartelaData(cartelaId?: bigint) {
  const { data: cartela } = useReadContract({
    address: CONTRACTS.CARTELA,
    abi: CARTELA_ABI,
    functionName: "cartelas",
    args: cartelaId ? [cartelaId] : undefined,
    query: {
      enabled: !!cartelaId,
    },
  })

  const { data: numeros } = useReadContract({
    address: CONTRACTS.CARTELA,
    abi: CARTELA_ABI,
    functionName: "getNumerosCartela",
    args: cartelaId ? [cartelaId] : undefined,
    query: {
      enabled: !!cartelaId,
    },
  })

  return {
    cartela,
    numeros,
  }
}

// Hook para próximo ID de cartela
export function useProximoCartelaId() {
  const { data: proximoId } = useReadContract({
    address: CONTRACTS.CARTELA,
    abi: CARTELA_ABI,
    functionName: "proximoCartelaId",
  })

  return proximoId
}
