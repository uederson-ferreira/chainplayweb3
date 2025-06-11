// Script para debugar conexão com contratos
// Salve como: debug-contracts.js na raiz do projeto

import { createPublicClient, http } from "viem";

// Carregar variáveis de ambiente
require("dotenv").config({ path: "../.env.local" });

const publicClient = createPublicClient({
  chain: {
    id: 31337,
    name: "Local Network",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
  },
  transport: process.env.NEXT_PUBLIC_RPC_URL,
});

const BINGO_ADDRESS = process.env.NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS;
const CARTELA_ADDRESS = process.env.NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS;

// Verificar se as variáveis existem
if (!BINGO_ADDRESS || !CARTELA_ADDRESS) {
  console.error("❌ Endereços dos contratos não encontrados no .env");
  console.log(
    "Certifique-se de que NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS e NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS estão definidos"
  );
  process.exit(1);
}

console.log("📋 Endereços carregados do .env:");
console.log("🎯 BINGO:", BINGO_ADDRESS);
console.log("🎫 CARTELA:", CARTELA_ADDRESS);

async function debugContracts() {
  console.log("🔍 DIAGNÓSTICO DOS CONTRATOS");
  console.log("=".repeat(50));

  try {
    // 1. Verificar se a rede está acessível
    console.log("1️⃣ Testando conexão com a rede...");
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ Conectado! Bloco atual: ${blockNumber}`);

    // 2. Verificar se há código nos endereços
    console.log("\n2️⃣ Verificando códigos dos contratos...");

    const cartelaCode = await publicClient.getBytecode({
      address: CARTELA_ADDRESS,
    });
    console.log(`📋 Cartela (${CARTELA_ADDRESS}):`);
    console.log(
      `   Código: ${
        cartelaCode
          ? `${cartelaCode.slice(0, 20)}... (${cartelaCode.length} chars)`
          : "❌ SEM CÓDIGO"
      }`
    );

    const bingoCode = await publicClient.getBytecode({
      address: BINGO_ADDRESS,
    });
    console.log(`🎲 Bingo (${BINGO_ADDRESS}):`);
    console.log(
      `   Código: ${
        bingoCode
          ? `${bingoCode.slice(0, 20)}... (${bingoCode.length} chars)`
          : "❌ SEM CÓDIGO"
      }`
    );

    // 3. Testar funções básicas
    console.log("\n3️⃣ Testando funções básicas...");

    if (cartelaCode) {
      try {
        // Testar precoBaseCartela (função view simples)
        const precoBase = await publicClient.readContract({
          address: CARTELA_ADDRESS,
          abi: [
            {
              type: "function",
              name: "precoBaseCartela",
              inputs: [],
              outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
              stateMutability: "view",
            },
          ],
          functionName: "precoBaseCartela",
        });
        console.log(`✅ precoBaseCartela: ${precoBase}`);
      } catch (error) {
        console.log(`❌ precoBaseCartela falhou: ${error.message}`);
      }

      try {
        // Testar feeCollector
        const feeCollector = await publicClient.readContract({
          address: CARTELA_ADDRESS,
          abi: [
            {
              type: "function",
              name: "feeCollector",
              inputs: [],
              outputs: [{ name: "", type: "address", internalType: "address" }],
              stateMutability: "view",
            },
          ],
          functionName: "feeCollector",
        });
        console.log(`✅ feeCollector: ${feeCollector}`);
      } catch (error) {
        console.log(`❌ feeCollector falhou: ${error.message}`);
      }

      try {
        // Testar cartela ID 0 (deve falhar)
        const cartela0 = await publicClient.readContract({
          address: CARTELA_ADDRESS,
          abi: [
            {
              type: "function",
              name: "cartelas",
              inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
              outputs: [
                { name: "id", type: "uint256", internalType: "uint256" },
                { name: "linhas", type: "uint8", internalType: "uint8" },
                { name: "colunas", type: "uint8", internalType: "uint8" },
                { name: "dono", type: "address", internalType: "address" },
                {
                  name: "numerosRegistrados",
                  type: "bool",
                  internalType: "bool",
                },
                { name: "emUso", type: "bool", internalType: "bool" },
                { name: "preco", type: "uint256", internalType: "uint256" },
              ],
              stateMutability: "view",
            },
          ],
          functionName: "cartelas",
          args: [BigInt(0)],
        });
        console.log(`✅ cartela[0]: ${JSON.stringify(cartela0)}`);
      } catch (error) {
        console.log(`❌ cartela[0] falhou: ${error.message}`);
      }
    }

    // 4. Verificar eventos históricos
    console.log("\n4️⃣ Verificando eventos...");
    if (cartelaCode) {
      try {
        const logs = await publicClient.getLogs({
          address: CARTELA_ADDRESS,
          fromBlock: BigInt(0),
          toBlock: "latest",
        });
        console.log(`📋 Total de eventos do contrato Cartela: ${logs.length}`);
        if (logs.length > 0) {
          console.log(
            `   Primeiro evento: Bloco ${logs[0].blockNumber}, Topics: ${logs[0].topics.length}`
          );
        }
      } catch (error) {
        console.log(`❌ Erro ao buscar eventos: ${error.message}`);
      }
    }

    // 5. Verificar saldo de accounts
    console.log("\n5️⃣ Verificando contas...");
    const accounts = [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account 0 Anvil
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account 1 Anvil
    ];

    for (const account of accounts) {
      try {
        const balance = await publicClient.getBalance({ address: account });
        console.log(`💰 ${account}: ${Number(balance) / 1e18} ETH`);
      } catch (error) {
        console.log(
          `❌ Erro ao verificar saldo de ${account}: ${error.message}`
        );
      }
    }
  } catch (error) {
    console.error("❌ ERRO GERAL:", error);
  }
}

// Executar diagnóstico
debugContracts();
