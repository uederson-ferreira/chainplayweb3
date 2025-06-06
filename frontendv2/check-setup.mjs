// check-setup-updated.mjs - Versão atualizada
import { createPublicClient, http } from 'viem'
import fs from 'fs'

const RPC_URL = "http://127.0.0.1:8545"

// Ler endereços do .env.local
function readEnvLocal() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8')
    const lines = envContent.split('\n')
    
    const envVars = {}
    lines.forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        envVars[key.trim()] = value.trim()
      }
    })
    
    return envVars
  } catch (error) {
    console.log('❌ Erro ao ler .env.local:', error.message)
    return {}
  }
}

const envVars = readEnvLocal()
const CARTELA_ADDRESS = envVars.NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000"
const BINGO_ADDRESS = envVars.NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000"

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
  console.log("🔧 VERIFICAÇÃO COMPLETA DA CONFIGURAÇÃO (ATUALIZADA)")
  console.log("=" .repeat(60))
  
  let allChecksPass = true

  // 1. Verificar conexão RPC
  try {
    console.log("1️⃣ Testando conexão RPC...")
    const blockNumber = await publicClient.getBlockNumber()
    const chainId = await publicClient.getChainId()
    console.log(`✅ RPC funcionando - Bloco: ${blockNumber}, Chain: ${chainId}`)
  } catch (error) {
    console.log(`❌ RPC falhou: ${error.message}`)
    console.log("   💡 Solução: Execute 'npm run anvil-alchemy' em outro terminal")
    allChecksPass = false
    return
  }

  // 2. Verificar se há código nos endereços dos contratos
  console.log("\n2️⃣ Verificando contratos...")
  console.log(`   📋 CARTELA: ${CARTELA_ADDRESS}`)
  console.log(`   🎲 BINGO: ${BINGO_ADDRESS}`)
  
  const contracts = [
    { name: "CARTELA", address: CARTELA_ADDRESS },
    { name: "BINGO", address: BINGO_ADDRESS }
  ]

  for (const contract of contracts) {
    if (!contract.address || contract.address === "0x0000000000000000000000000000000000000000") {
      console.log(`❌ ${contract.name}: Endereço não configurado`)
      allChecksPass = false
      continue
    }

    try {
      const code = await publicClient.getBytecode({ address: contract.address })
      
      if (!code || code === '0x') {
        console.log(`❌ ${contract.name}: SEM CÓDIGO em ${contract.address}`)
        allChecksPass = false
      } else {
        console.log(`✅ ${contract.name}: ${code.length} chars em ${contract.address}`)
        
        // Se for Cartela, testar função básica
        if (contract.name === "CARTELA") {
          try {
            const precoBase = await publicClient.readContract({
              address: contract.address,
              abi: [{
                "type": "function", 
                "name": "precoBaseCartela",
                "inputs": [],
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view"
              }],
              functionName: "precoBaseCartela",
            })
            console.log(`   📋 precoBaseCartela: ${precoBase} wei (${Number(precoBase)/1e18} ETH)`)
          } catch (error) {
            console.log(`   ❌ precoBaseCartela falhou: ${error.message}`)
            allChecksPass = false
          }
        }

        // Se for Bingo, testar função básica
        if (contract.name === "BINGO") {
          try {
            const admin = await publicClient.readContract({
              address: contract.address,
              abi: [{
                "type": "function", 
                "name": "admin",
                "inputs": [],
                "outputs": [{"name": "", "type": "address"}],
                "stateMutability": "view"
              }],
              functionName: "admin",
            })
            console.log(`   🎲 admin: ${admin}`)
          } catch (error) {
            console.log(`   ❌ admin falhou: ${error.message}`)
            allChecksPass = false
          }
        }
      }
    } catch (error) {
      console.log(`❌ Erro ao verificar ${contract.name}: ${error.message}`)
      allChecksPass = false
    }
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

  // 4. Verificar configurações do .env.local
  console.log("\n4️⃣ Verificando configurações...")
  
  const requiredVars = {
    'NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS': CARTELA_ADDRESS,
    'NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS': BINGO_ADDRESS,
    'NEXT_PUBLIC_RPC_URL': envVars.NEXT_PUBLIC_RPC_URL,
    'NEXT_PUBLIC_NETWORK_ID': envVars.NEXT_PUBLIC_NETWORK_ID,
  }
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      console.log(`   ❌ ${key}: não definida`)
      allChecksPass = false
    } else {
      console.log(`   ✅ ${key}: ${value}`)
    }
  }

  // 5. Resultados e próximos passos
  console.log("\n" + "=" .repeat(60))
  if (allChecksPass) {
    console.log("🎉 TODAS AS VERIFICAÇÕES PASSARAM!")
    console.log("\n📋 Sua aplicação está pronta!")
    console.log("   1. Execute: npm run dev")
    console.log("   2. Acesse: http://localhost:3000")
    console.log("   3. Configure MetaMask:")
    console.log("      - RPC: http://127.0.0.1:8545")
    console.log("      - Chain ID: 1 (mainnet fork)")
    console.log("      - Importe a chave: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
    console.log("   4. Teste criando uma cartela!")
  } else {
    console.log("❌ ALGUMAS VERIFICAÇÕES FALHARAM")
    console.log("\n🔧 PROBLEMAS IDENTIFICADOS:")
    
    if (!CARTELA_ADDRESS || CARTELA_ADDRESS === "0x0000000000000000000000000000000000000000") {
      console.log("   • Endereço do CartelaContract não configurado")
    }
    if (!BINGO_ADDRESS || BINGO_ADDRESS === "0x0000000000000000000000000000000000000000") {
      console.log("   • Endereço do BingoGameContract não configurado")
    }
    
    console.log("\n💡 SOLUÇÕES:")
    console.log("   1. Verifique se o .env.local tem os endereços corretos:")
    console.log(`      NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS=${CARTELA_ADDRESS}`)
    console.log(`      NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS=${BINGO_ADDRESS}`)
    console.log("   2. Reinicie o servidor: npm run dev")
    console.log("   3. Se os contratos não existem, rode novamente:")
    console.log("      cd ../contracts && forge script script/DeployBingo.s.sol --rpc-url http://127.0.0.1:8545 --broadcast")
  }

  console.log("\n🛠️ COMANDOS ÚTEIS:")
  console.log("   Verificar deployments: cast call " + CARTELA_ADDRESS + " 'precoBaseCartela()' --rpc-url http://127.0.0.1:8545")
  console.log("   Reset Anvil: pkill anvil && npm run anvil-alchemy")
  console.log("   Re-deploy: cd ../contracts && forge script script/DeployBingo.s.sol --rpc-url http://127.0.0.1:8545 --broadcast")
}

// Executar verificação
checkSetup().catch(console.error)