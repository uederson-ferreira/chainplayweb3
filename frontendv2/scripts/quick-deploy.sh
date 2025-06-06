#!/bin/bash
# Script para deploy rápido dos contratos
# Salve como: quick-deploy.sh

echo "🚀 DEPLOY RÁPIDO DOS CONTRATOS"
echo "================================"

# 1. Verificar se Anvil está rodando
echo "1️⃣ Verificando Anvil..."
if curl -s -X POST -H "Content-Type: application/json" \
   --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
   http://127.0.0.1:8545 > /dev/null; then
    echo "✅ Anvil está rodando"
else
    echo "❌ Anvil não está rodando! Execute: anvil"
    exit 1
fi

# 2. Compilar contratos
echo -e "\n2️⃣ Compilando contratos..."
if command -v forge &> /dev/null; then
    echo "📦 Usando Forge..."
    forge build
else
    echo "📦 Forge não encontrado, usando npx..."
    npx hardhat compile
fi

# 3. Deploy do contrato Cartela
echo -e "\n3️⃣ Fazendo deploy do CartelaContract..."

# Deploy usando cast (Foundry)
if command -v cast &> /dev/null; then
    echo "🔨 Usando cast para deploy..."
    
    # Deploy Cartela
    CARTELA_ADDRESS=$(cast send --rpc-url http://127.0.0.1:8545 \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --create \
        $(cat out/CartelaContract.sol/CartelaContract.json | jq -r '.bytecode.object') \
        --constructor-args \
        $(cast --to-wei 0.01) \
        0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        | grep "contractAddress" | awk '{print $2}')
    
    echo "📋 CartelaContract deployed em: $CARTELA_ADDRESS"
    
    # Deploy Bingo (precisa dos parâmetros do Chainlink)
    echo "🎲 Para o BingoContract, você precisa dos parâmetros Chainlink VRF..."
    echo "   VRF_COORDINATOR, SUBSCRIPTION_ID, KEY_HASH"
    
else
    echo "❌ Cast não encontrado! Instale Foundry: curl -L https://foundry.paradigm.xyz | bash"
fi

# 4. Atualizar .env.local
echo -e "\n4️⃣ Atualize seu .env.local com os novos endereços:"
echo "NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS=$CARTELA_ADDRESS"
echo "NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS=<bingo_address>"

echo -e "\n✅ Deploy concluído!"
echo "📝 Próximos passos:"
echo "   1. Atualize os endereços no .env.local"
echo "   2. Reinicie o servidor Next.js"
echo "   3. Teste a criação de cartelas"