#!/bin/bash
# Script de deploy simplificado
# Execute passo a passo ou salve como deploy-simple.sh

echo "🚀 DEPLOY SIMPLIFICADO DOS CONTRATOS"
echo "====================================="

# Configurações
RPC_URL="http://127.0.0.1:8545"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
DEPLOYER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo "🔧 Configurações:"
echo "   RPC: $RPC_URL"
echo "   Deployer: $DEPLOYER"
echo ""

# 1. Verificar Anvil
echo "1️⃣ Verificando Anvil..."
if curl -s -X POST -H "Content-Type: application/json" \
   --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
   $RPC_URL > /dev/null; then
    echo "✅ Anvil rodando"
else
    echo "❌ Anvil não está rodando!"
    echo "   Execute: anvil"
    exit 1
fi

# 2. Deploy CartelaContract
echo ""
echo "2️⃣ Deploy do CartelaContract..."
echo "   Preço base: 0.01 ETH"
echo "   Fee collector: $DEPLOYER"

CARTELA_ADDRESS=$(forge create src/CartelaContract.sol:CartelaContract \
    --constructor-args $(cast --to-wei 0.01) $DEPLOYER \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --json | jq -r '.deployedTo')

if [ "$CARTELA_ADDRESS" != "null" ] && [ -n "$CARTELA_ADDRESS" ]; then
    echo "✅ CartelaContract: $CARTELA_ADDRESS"
else
    echo "❌ Falha no deploy do CartelaContract"
    exit 1
fi

# 3. Deploy BingoGameContract
echo ""
echo "3️⃣ Deploy do BingoGameContract..."
echo "   Usando Chainlink VRF mock local"

# Parâmetros Chainlink para local/testing
VRF_COORDINATOR="0x271682DEB8C4E0901D1a1550aD2e64D568E69909"  # Mainnet (mock)
SUBSCRIPTION_ID=1
KEY_HASH="0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef"

BINGO_ADDRESS=$(forge create src/BingoGameContract.sol:BingoGameContract \
    --constructor-args \
    $CARTELA_ADDRESS \
    $VRF_COORDINATOR \
    $SUBSCRIPTION_ID \
    $KEY_HASH \
    $DEPLOYER \
    $DEPLOYER \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --json | jq -r '.deployedTo')

if [ "$BINGO_ADDRESS" != "null" ] && [ -n "$BINGO_ADDRESS" ]; then
    echo "✅ BingoGameContract: $BINGO_ADDRESS"
else
    echo "❌ Falha no deploy do BingoGameContract"
    echo "   💡 Pode ser por causa dos parâmetros Chainlink"
    echo "   💡 Ajuste VRF_COORDINATOR para ambiente local"
fi

# 4. Configurar contratos
echo ""
echo "4️⃣ Configurando contratos..."

# Definir BingoGameContract no CartelaContract
if [ -n "$BINGO_ADDRESS" ]; then
    echo "   Configurando BingoGame no Cartela..."
    cast send $CARTELA_ADDRESS \
        "setBingoGameContract(address)" $BINGO_ADDRESS \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ BingoGame configurado no Cartela"
    else
        echo "⚠️  Falha ao configurar BingoGame no Cartela"
    fi
fi

# Definir operador no BingoGame  
if [ -n "$BINGO_ADDRESS" ]; then
    echo "   Configurando operador no Bingo..."
    cast send $BINGO_ADDRESS \
        "setOperador(address,bool)" $DEPLOYER true \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY > /dev/null
        
    if [ $? -eq 0 ]; then
        echo "✅ Operador configurado no Bingo"
    else
        echo "⚠️  Falha ao configurar operador no Bingo"
    fi
fi

# 5. Verificar deploy
echo ""
echo "5️⃣ Verificando deploy..."

# Testar função do Cartela
PRECO_BASE=$(cast call $CARTELA_ADDRESS "precoBaseCartela()" --rpc-url $RPC_URL)
echo "   Preço base cartela: $PRECO_BASE wei ($(cast --from-wei $PRECO_BASE) ETH)"

# Testar função do Bingo (se deployou)
if [ -n "$BINGO_ADDRESS" ]; then
    ADMIN=$(cast call $BINGO_ADDRESS "admin()" --rpc-url $RPC_URL)
    echo "   Admin do Bingo: $ADMIN"
fi

# 6. Atualizar .env.local
echo ""
echo "6️⃣ Atualizando .env.local..."

# Backup do .env.local atual
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "   📦 Backup criado: .env.local.backup"
fi

# Atualizar endereços
if grep -q "NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS" .env.local 2>/dev/null; then
    sed -i.tmp "s/NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS=.*/NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS=$CARTELA_ADDRESS/" .env.local
    rm .env.local.tmp 2>/dev/null
else
    echo "NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS=$CARTELA_ADDRESS" >> .env.local
fi

if [ -n "$BINGO_ADDRESS" ]; then
    if grep -q "NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS" .env.local 2>/dev/null; then
        sed -i.tmp "s/NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS=.*/NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS=$BINGO_ADDRESS/" .env.local
        rm .env.local.tmp 2>/dev/null
    else
        echo "NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS=$BINGO_ADDRESS" >> .env.local
    fi
fi

echo "✅ .env.local atualizado"

# 7. Resumo final
echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo "==================="
echo "📋 CartelaContract: $CARTELA_ADDRESS"
if [ -n "$BINGO_ADDRESS" ]; then
    echo "🎲 BingoGameContract: $BINGO_ADDRESS"
fi
echo ""
echo "📝 Próximos passos:"
echo "   1. Reinicie o servidor Next.js (Ctrl+C e npm run dev)"
echo "   2. Configure MetaMask para rede local:"
echo "      - RPC: http://127.0.0.1:8545"
echo "      - Chain ID: 31337"
echo "      - Símbolo: ETH"
echo "   3. Importe a account 0 do Anvil no MetaMask:"
echo "      - Private Key: $PRIVATE_KEY"
echo "   4. Teste criando uma cartela na aplicação!"
echo ""
echo "🛠️ Comandos úteis:"
echo "   Verificar saldo: cast balance $DEPLOYER --rpc-url $RPC_URL"
echo "   Reset Anvil: pkill anvil && anvil"
echo "   Re-deploy: ./deploy-simple.sh"