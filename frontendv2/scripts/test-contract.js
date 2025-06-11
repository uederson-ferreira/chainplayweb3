// ========================================
// SCRIPT DE DEBUG - test-contract.js
// ========================================
// Execute este script para testar o contrato diretamente

const { createPublicClient, http, getContract } = require("viem");

// Configuração da rede local
const localChain = {
  id: 1,
  name: "Local Anvil Fork",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  testnet: true,
};

// Endereços dos contratos (substitua pelos seus)
require("dotenv").config();
const CONTRACTS = {
  CARTELA: process.env.NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS,
  BINGO: process.env.NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS,
};

// ABI simplificada para teste
const BINGO_ABI = [
  {
    type: "function",
    name: "admin",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "operadores",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "iniciarRodada",
    inputs: [
      { name: "_numeroMaximo", type: "uint8" },
      { name: "_taxaEntrada", type: "uint256" },
      { name: "_timeoutRodada", type: "uint256" },
      { name: "_padroesVitoria", type: "bool[]" },
    ],
    outputs: [{ name: "rodadaId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
];

async function testContract() {
  console.log("🧪 INICIANDO TESTE DO CONTRATO");

  try {
    // Criar cliente público
    const publicClient = createPublicClient({
      chain: localChain,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
    });

    console.log("✅ Cliente criado");

    // ========================================
    // TESTE 1: VERIFICAR REDE
    // ========================================
    console.log("\n📡 TESTE 1: Verificando rede...");

    const blockNumber = await publicClient.getBlockNumber();
    console.log("📋 Número do bloco:", blockNumber.toString());

    const chainId = await publicClient.getChainId();
    console.log("🔗 Chain ID:", chainId);

    // ========================================
    // TESTE 2: VERIFICAR CONTRATO CARTELA
    // ========================================
    console.log("\n📋 TESTE 2: Verificando contrato Cartela...");
    console.log("📍 Endereço Cartela:", CONTRACTS.CARTELA);

    const cartelaCode = await publicClient.getBytecode({
      address: CONTRACTS.CARTELA,
    });

    if (cartelaCode) {
      console.log(
        "✅ Contrato Cartela deployado (tamanho:",
        cartelaCode.length,
        ")"
      );
    } else {
      console.log("❌ Contrato Cartela NÃO encontrado!");
    }

    // ========================================
    // TESTE 3: VERIFICAR CONTRATO BINGO
    // ========================================
    console.log("\n🎯 TESTE 3: Verificando contrato Bingo...");
    console.log("📍 Endereço Bingo:", CONTRACTS.BINGO);

    const bingoCode = await publicClient.getBytecode({
      address: CONTRACTS.BINGO,
    });

    if (bingoCode) {
      console.log(
        "✅ Contrato Bingo deployado (tamanho:",
        bingoCode.length,
        ")"
      );
    } else {
      console.log("❌ Contrato Bingo NÃO encontrado!");
      return;
    }

    // ========================================
    // TESTE 4: CHAMADAS DE LEITURA
    // ========================================
    console.log("\n📖 TESTE 4: Testando funções de leitura...");

    try {
      const admin = await publicClient.readContract({
        address: CONTRACTS.BINGO,
        abi: BINGO_ABI,
        functionName: "admin",
      });
      console.log("👑 Admin do contrato:", admin);
    } catch (error) {
      console.log("❌ Erro ao ler admin:", error.message);
    }

    // ========================================
    // TESTE 5: VERIFICAR OPERADORES
    // ========================================
    console.log("\n🔑 TESTE 5: Verificando operadores...");

    // Endereços comuns para testar
    const testAddresses = [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Anvil account #0
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Anvil account #1
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Anvil account #2
    ];

    for (const testAddress of testAddresses) {
      try {
        const isOperator = await publicClient.readContract({
          address: CONTRACTS.BINGO,
          abi: BINGO_ABI,
          functionName: "operadores",
          args: [testAddress],
        });
        console.log(
          `🔑 ${testAddress}: ${isOperator ? "É OPERADOR" : "não é operador"}`
        );

        if (isOperator) {
          console.log("✅ OPERADOR ENCONTRADO:", testAddress);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar ${testAddress}:`, error.message);
      }
    }

    // ========================================
    // TESTE 6: SIMULAR CHAMADA iniciarRodada
    // ========================================
    console.log("\n🎯 TESTE 6: Simulando iniciarRodada...");

    const numeroMaximo = 75;
    const taxaEntrada = BigInt("10000000000000000"); // 0.01 ETH em wei
    const timeoutRodada = BigInt(3600); // 1 hora
    const padroesVitoria = [true, true, true, false];

    console.log("📋 Parâmetros:", {
      numeroMaximo,
      taxaEntrada: taxaEntrada.toString(),
      taxaEntradaETH: (Number(taxaEntrada) / 1e18).toFixed(4) + " ETH",
      timeoutRodada: timeoutRodada.toString(),
      padroesVitoria,
    });

    try {
      // Simular a chamada (não vai executar, apenas validar)
      const simulacao = await publicClient.simulateContract({
        address: CONTRACTS.BINGO,
        abi: BINGO_ABI,
        functionName: "iniciarRodada",
        args: [numeroMaximo, taxaEntrada, timeoutRodada, padroesVitoria],
        account: testAddresses[0], // Usar primeira conta
      });

      console.log("✅ Simulação da chamada OK!");
      console.log("📋 Resultado esperado:", simulacao.result);
    } catch (error) {
      console.log("❌ Erro na simulação:", error.message);

      if (error.message.includes("operador")) {
        console.log("💡 DICA: O erro indica que precisa ser operador");
      }
      if (error.message.includes("revert")) {
        console.log("💡 DICA: A transação está sendo rejeitada pelo contrato");
      }
    }

    console.log("\n🎉 TESTE CONCLUÍDO!");
  } catch (error) {
    console.error("❌ ERRO GERAL:", error);
  }
}

// ========================================
// EXECUTAR O TESTE
// ========================================
testContract()
  .then(() => {
    console.log("\n✅ Script finalizado");
  })
  .catch((error) => {
    console.error("\n❌ Script falhou:", error);
  });

// ========================================
// INSTRUÇÕES DE USO
// ========================================
/*
Para executar este script:

1. Salve como test-contract.js
2. Instale as dependências:
   npm install viem

3. Execute:
   node test-contract.js

4. Analise os resultados:
   - Verifique se os contratos estão deployados
   - Verifique qual endereço é operador
   - Use esse endereço operador na MetaMask
*/
