// Script para verificar configuração completa
// Execute com: node check-setup.js

import { createPublicClient, http } from 'viem'

const RPC_URL = "http://127.0.0.1:8545"
require('dotenv').config()
const CONTRACTS = {
  CARTELA: process.env.NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS,
  BINGO: process.env.NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS
}

const publicClient = createPublicClient({
  chain: {
    id: 31337,
    name: "Local Network", 
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
  },
  transport: http(RPC_URL),
})

async function checkSetup() {
  console.log("🔧 VERIFICAÇÃO COMPLETA DA CONFIGURAÇÃO")
  console.log("=" .repeat(60))
  
  let allChecksPass = true

  // 1. Verificar conexão RPC
  try {
    console.log("1️⃣ Testando conexão RPC...")
    const blockNumber = await publicClient.getBlockNumber()
    console.log(`✅ RPC funcionando - Bloco: ${blockNumber}`)
  } catch (error) {
    console.log(`❌ RPC falhou: ${error.message}`)
    console.log("   💡 Solução: Execute 'anvil' em outro terminal")
    allChecksPass = false
    return
  }

  // 2. Verificar se há código no endereço do contrato
  try {
    console.log("\n2️⃣ Verificando contrato Cartela...")
    const code = await publicClient.getBytecode({ address: CARTELA_ADDRESS })
    
    if (!code || code === '0x') {
      console.log(`❌ Sem código em ${CARTELA_ADDRESS}`)
      console.log("   💡 Solução: Faça o deploy dos contratos")
      allChecksPass = false
    } else {
      console.log(`✅ Contrato encontrado (${code.length} chars)`)
      
      // Testar função básica
      try {
        const precoBase = await publicClient.readContract({
          address: CARTELA_ADDRESS,
          abi: [{
            "type": "function", 
            "name": "precoBaseCartela",
            "inputs": [],
            "outputs": [{"name": "", "type": "uint256"}],
            "stateMutability": "view"
          }],
          functionName: "precoBaseCartela",
        })
        console.log(`✅ Função precoBaseCartela: ${precoBase} wei (${Number(precoBase)/1e18} ETH)`)
      } catch (error) {
        console.log(`❌ Função precoBaseCartela falhou: ${error.message}`)
        allChecksPass = false
      }
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar contrato: ${error.message}`)
    allChecksPass = false
  }

  // 3. Verificar saldos das contas padrão do Anvil
  console.log("\n3️⃣ Verificando contas Anvil...")
  const accounts = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account 0
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account 1  
  ]

  for (let i = 0; i < accounts.length; i++) {
    try {
      const balance = await publicClient.getBalance({ address: accounts[i] })
      const ethBalance = Number(balance) / 1e18
      console.log(`✅ Account ${i}: ${ethBalance.toFixed(2)} ETH`)
      
      if (ethBalance < 1) {
        console.log(`   ⚠️  Saldo baixo para Account ${i}`)
      }
    } catch (error) {
      console.log(`❌ Erro ao verificar Account ${i}: ${error.message}`)
    }
  }

  // 4. Verificar variáveis de ambiente
  console.log("\n4️⃣ Verificando variáveis de ambiente...")
  const envVars = {
    'NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS': process.env.NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS,
    'NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS': process.env.NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS,
    'NEXT_PUBLIC_RPC_URL': process.env.NEXT_PUBLIC_RPC_URL,
    'NEXT_PUBLIC_NETWORK_ID': process.env.NEXT_PUBLIC_NETWORK_ID,
  }

  for (const [key, value] of Object.entries(envVars)) {
    if (!value) {
      console.log(`❌ ${key}: não definida`)
      allChecksPass = false
    } else {
      console.log(`✅ ${key}: ${value}`)
      
      // Verificar se o endereço atual está correto
      if (key === 'NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS' && value !== CARTELA_ADDRESS) {
        console.log(`   ⚠️  .env.local tem ${value}, mas app usa ${CARTELA_ADDRESS}`)
        console.log(`   💡 Atualize .env.local ou redeploy contratos`)
      }
    }
  }

  // 5. Testar criação de cartela (simulação)
  console.log("\n5️⃣ Simulando criação de cartela...")
  if (allChecksPass) {
    try {
      // Simular chamada de criação de cartela (não executa)
      const gasEstimate = await publicClient.estimateGas({
        account: accounts[0],
        to: CARTELA_ADDRESS,
        data: '0x1234', // dados fictícios
      })
      console.log(`✅ Estimativa de gas funciona: ${gasEstimate}`)
    } catch (error) {
      console.log(`❌ Simulação falhou: ${error.message}`)
    }
  }

  // 6. Resultados e soluções
  console.log("\n" + "=" .repeat(60))
  if (allChecksPass) {
    console.log("🎉 TODAS AS VERIFICAÇÕES PASSARAM!")
    console.log("\n📋 Próximos passos:")
    console.log("   1. Certifique-se que o endereço no .env.local está correto")
    console.log("   2. Reinicie o servidor Next.js (npm run dev)")
    console.log("   3. Conecte MetaMask à rede local (localhost:8545)")
    console.log("   4. Importe a chave privada da Account 0 no MetaMask:")
    console.log("      0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
  } else {
    console.log("❌ ALGUMAS VERIFICAÇÕES FALHARAM")
    console.log("\n🔧 Soluções rápidas:")
    console.log("   1. Verificar se Anvil está rodando: anvil")
    console.log("   2. Deploy dos contratos: forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast")
    console.log("   3. Atualizar .env.local com os novos endereços")
    console.log("   4. Reiniciar servidor: npm run dev")
  }

  console.log("\n🛠️ COMANDOS ÚTEIS:")
  console.log("   Deploy rápido: forge create CartelaContract --constructor-args $(cast --to-wei 0.01) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
  console.log("   Verificar saldo: cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://127.0.0.1:8545")
  console.log("   Reset Anvil: pkill anvil && anvil")
}

// Executar verificação
checkSetup().catch(console.error)