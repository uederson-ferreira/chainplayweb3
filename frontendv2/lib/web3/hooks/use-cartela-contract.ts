// Arquivo: lib/web3/hooks/use-cartela-contract.ts

"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useAccount, useBlockNumber } from "wagmi";
import { useEffect, useState, useCallback } from "react";
import { CONTRACTS } from "../config";
import { createPublicClient, http, parseEther } from "viem";
import { localChain } from "../config";

// Nova ABI atualizada para CARTELA
export const CARTELA_ABI = [
  {
    type: "function",
    name: "criarCartela",
    inputs: [
      {
        name: "_linhas",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "_colunas",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    outputs: [
      {
        name: "cartelaId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "registrarNumerosCartela",
    inputs: [
      {
        name: "_cartelaId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_numeros",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cartelas",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "id",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "linhas",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "colunas",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "dono",
        type: "address",
        internalType: "address",
      },
      {
        name: "numerosRegistrados",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "emUso",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "preco",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getNumerosCartela",
    inputs: [
      {
        name: "_cartelaId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "precoBaseCartela",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
] as const;

// Cliente público para ler eventos
const publicClient = createPublicClient({
  chain: localChain,
  transport: process.env.NEXT_PUBLIC_RPC_URL,
});

// VERSÃO CORRIGIDA - use-cartela-contract.ts

export function useCartelaContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Buscar preço base antes de criar cartela
  const { data: precoBase } = useReadContract({
    address: CONTRACTS.CARTELA,
    abi: CARTELA_ABI,
    functionName: "precoBaseCartela",
  });

  // CORREÇÃO: Criar cartela SEM pagamento se preço for 0
  const criarCartela = async (linhas: number, colunas: number) => {
    console.log("💰 Preço base detectado:", {
      precoBase: precoBase?.toString(),
      precoEmETH: precoBase ? (Number(precoBase) / 1e18).toFixed(6) : "0",
    });

    // Se não há precoBase ou é 0, não enviar value
    const shouldSendValue = precoBase && precoBase > 0;
    const valorPagamento = shouldSendValue ? precoBase : undefined;

    console.log("🚀 Criando cartela:", {
      linhas,
      colunas,
      shouldSendValue,
      valor: valorPagamento
        ? (Number(valorPagamento) / 1e18).toFixed(6) + " ETH"
        : "GRÁTIS",
    });

    // Corrigir os tipos dos parâmetros
    const baseParams = {
      address: CONTRACTS.CARTELA,
      abi: CARTELA_ABI,
      functionName: "criarCartela" as const,
      args: [linhas, colunas] as const, // ← CORREÇÃO: adicionar 'as const'
    };

    const txParams = shouldSendValue
      ? { ...baseParams, value: valorPagamento }
      : baseParams;

    return writeContract(txParams);
  };

  // Registrar números com gas otimizado
  const registrarNumeros = async (cartelaId: bigint, numeros: bigint[]) => {
    console.log("📝 Registrando números:", {
      cartelaId: cartelaId.toString(),
      quantidade: numeros.length,
      primeiros3: numeros.slice(0, 3).map((n) => n.toString()),
    });

    return writeContract({
      address: CONTRACTS.CARTELA,
      abi: CARTELA_ABI,
      functionName: "registrarNumerosCartela",
      args: [cartelaId, numeros] as const, // ← CORREÇÃO: adicionar 'as const'
    });
  };

  return {
    criarCartela,
    registrarNumeros,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    precoBase,
  };
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
  });

  const { data: numeros } = useReadContract({
    address: CONTRACTS.CARTELA,
    abi: CARTELA_ABI,
    functionName: "getNumerosCartela",
    args: cartelaId ? [cartelaId] : undefined,
    query: {
      enabled: !!cartelaId,
    },
  });

  // ← ATUALIZAR ESTA PARTE:
  const cartelaData = cartela
    ? {
        id: cartela[0], // uint256
        linhas: cartela[1], // uint8
        colunas: cartela[2], // uint8
        dono: cartela[3], // address
        numerosRegistrados: cartela[4], // bool
        emUso: cartela[5], // bool ← NOVO
        preco: cartela[6], // uint256 ← NOVO
      }
    : null;

  return {
    cartela: cartelaData,
    numeros,
  };
}

// 4. ADICIONAR este novo hook no final do arquivo:
export function usePrecoBaseCartela() {
  const { data: precoBase } = useReadContract({
    address: CONTRACTS.CARTELA,
    abi: CARTELA_ABI,
    functionName: "precoBaseCartela",
  });

  return precoBase;
}

// Hook para próximo ID de cartela - usar precoBase como proxy
export function useProximoCartelaId() {
  // Como não há mais a função proximoCartelaId, vamos simular
  // Você pode ajustar isso baseado na lógica do seu contrato
  return BigInt(1); // Placeholder
}

// ========================================
//use-cartela-contract.ts
// ========================================

// Hook para buscar cartelas do usuário usando eventos
export function useUserCartelas() {
  const { address } = useAccount();
  const [userCardIds, setUserCardIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: blockNumber } = useBlockNumber();

  // NOVA FUNÇÃO: Função para buscar cartelas do usuário
  const fetchUserCards = useCallback(async () => {
    if (!address || !CONTRACTS.CARTELA) return;

    setIsLoading(true);
    try {
      console.log("🔍 Buscando eventos para:", address);
      console.log("📍 Contrato:", CONTRACTS.CARTELA);

      // Buscar TODOS os eventos do contrato primeiro
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock =
        currentBlock > BigInt(500) ? currentBlock - BigInt(500) : BigInt(0);

      const allLogs = await publicClient.getLogs({
        address: CONTRACTS.CARTELA,
        fromBlock: fromBlock,
        toBlock: "latest",
      });
      // const allLogs = await publicClient.getLogs({
      //   address: CONTRACTS.CARTELA,
      //   fromBlock: BigInt(0),
      //   toBlock: 'latest',
      // })

      console.log("📋 TODOS os eventos do contrato:", allLogs.length);
      console.log("🔍 Eventos completos:", allLogs);

      // Se existem eventos, vamos decodificar manualmente
      if (allLogs.length > 0) {
        console.log("🔍 Analisando eventos manualmente...");

        // Filtrar por topic do evento CartelaCriada e pelo endereço do usuário
        const cartelaLogs = allLogs.filter((log) => {
          // O topic[2] contém o endereço do dono (indexed parameter)
          const donoTopic = log.topics[2];
          if (donoTopic) {
            // Remover padding zeros e comparar endereços
            const donoAddress = `0x${donoTopic.slice(-40)}`;
            return donoAddress.toLowerCase() === address.toLowerCase();
          }
          return false;
        });

        console.log("👤 Logs filtrados por dono:", cartelaLogs.length);
        console.log("📋 Logs do usuário:", cartelaLogs);

        if (cartelaLogs.length > 0) {
          console.log("📝 Processando logs do usuário...");

          // Extrair IDs das cartelas dos topics com debugging
          const cardIds = cartelaLogs
            .map((log, index) => {
              console.log(`🔍 Log ${index}:`, {
                topics: log.topics,
                topic1: log.topics[1],
                address: log.address,
              });

              // O topic[1] contém o cartelaId (indexed parameter)
              const cartelaIdHex = log.topics[1];
              if (cartelaIdHex) {
                const cartelaId = BigInt(cartelaIdHex);
                console.log(
                  `🆔 ID extraído do log ${index}:`,
                  cartelaId.toString()
                );
                return cartelaId;
              }
              console.log(`❌ Nenhum ID encontrado no log ${index}`);
              return null;
            })
            .filter(Boolean) as bigint[];

          console.log(
            "🆔 IDs finais extraídos:",
            cardIds.map((id) => id.toString())
          );
          setUserCardIds(cardIds);
          return;
        }
      }

      // Fallback: verificar se existe cartela ID 1 e se pertence ao usuário
      console.log("🔄 Fallback: verificando cartela ID 1...");
      try {
        const cartela = (await publicClient.readContract({
          address: CONTRACTS.CARTELA,
          abi: CARTELA_ABI,
          functionName: "cartelas",
          args: [BigInt(1)], // ← CORRIGIDO: era 'id', agora é BigInt(1)
        })) as [bigint, number, number, string, boolean, boolean, bigint]; // ← CORRIGIDO: tipo atualizado

        console.log("📋 Cartela 1 dados:", cartela);

        if (
          cartela &&
          cartela[3] &&
          cartela[3].toLowerCase() === address.toLowerCase()
        ) {
          console.log("✅ Cartela 1 pertence ao usuário!");
          setUserCardIds([BigInt(1)]);
        } else {
          console.log("❌ Cartela 1 não pertence ao usuário ou não existe");
          setUserCardIds([]);
        }
      } catch (fallbackError) {
        console.error("❌ Fallback falhou:", fallbackError);
        setUserCardIds([]);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar cartelas do usuário:", error);
      setUserCardIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchUserCards();
  }, [fetchUserCards, blockNumber]);

  return {
    userCardIds,
    isLoading,
    address,
    refetchUserCards: fetchUserCards, // NOVA: Expor a função
  };
}

// Hook para buscar dados completos das cartelas do usuário
export function useUserCartelasCompletas() {
  const {
    userCardIds,
    isLoading: isLoadingIds,
    refetchUserCards: refetchIds,
  } = useUserCartelas(); // Pegar refetch
  const [userCards, setUserCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // NOVA FUNÇÃO: Função para buscar dados completos das cartelas
  const fetchCardsData = useCallback(async () => {
    if (userCardIds.length === 0) {
      setUserCards([]);
      return;
    }

    setIsLoading(true);
    try {
      const cardsPromises = userCardIds.map(async (id) => {
        try {
          // Buscar dados da cartela
          const cartela = (await publicClient.readContract({
            address: CONTRACTS.CARTELA,
            abi: CARTELA_ABI,
            functionName: "cartelas",
            args: [id],
          })) as [bigint, number, number, string, boolean, boolean, bigint]; // ← CORRIGIDO: tipo atualizado

          console.log(`📋 Dados da cartela ${id}:`, cartela);

          // Buscar números da cartela
          let numeros: bigint[] = [];
          try {
            numeros = (await publicClient.readContract({
              address: CONTRACTS.CARTELA,
              abi: CARTELA_ABI,
              functionName: "getNumerosCartela",
              args: [id],
            })) as bigint[];
            console.log(`🔢 Números da cartela ${id}:`, numeros);
          } catch (error) {
            console.log(`Cartela ${id} ainda não tem números registrados`);
          }

          return {
            id: id.toString(),
            cartela,
            numeros: numeros.map((n) => Number(n)),
            card_data: {
              numbers:
                numeros.length > 0
                  ? numeros.map((n) => Number(n))
                  : Array.from(
                      { length: Number(cartela[1]) * Number(cartela[2]) },
                      () => 0
                    ),
            },
            rows: Number(cartela[1]), // linhas
            columns: Number(cartela[2]), // colunas
            hasNumbers: cartela[4], // numerosRegistrados
            emUso: cartela[5], // emUso ← NOVO
            preco: cartela[6], // preco ← NOVO
          };
        } catch (error) {
          console.error(`Erro ao buscar dados da cartela ${id}:`, error);
          return null;
        }
      });

      const cards = await Promise.all(cardsPromises);
      const validCards = cards.filter((card) => card !== null);

      console.log(
        `✅ Carregadas ${validCards.length} cartelas com dados completos`
      );
      setUserCards(validCards);
    } catch (error) {
      console.error("Erro ao carregar dados das cartelas:", error);
      setUserCards([]);
    } finally {
      setIsLoading(false);
    }
  }, [userCardIds]);

  useEffect(() => {
    fetchCardsData();
  }, [fetchCardsData]);

  // NOVA FUNÇÃO: Refetch completo (IDs + dados)
  const refetchUserCards = useCallback(async () => {
    console.log("🔄 Refetch completo iniciado...");
    await refetchIds(); // Primeiro recarrega os IDs
    // Os dados serão recarregados automaticamente pelo useEffect quando userCardIds mudar
  }, [refetchIds]);

  return {
    userCards,
    isLoading: isLoadingIds || isLoading,
    totalCards: userCardIds.length,
    refetchUserCards, // NOVA: Expor a função de refetch completo
  };
}
