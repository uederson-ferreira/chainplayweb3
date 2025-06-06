#!/bin/bash
# deploy-contracts.sh - Execute na pasta frontendv2/

echo "🚀 DEPLOY DOS CONTRATOS BINGO WEB3"
echo "=================================="

# Configurações
RPC_URL="http://127.0.0.1:8545"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
DEPLOYER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo "🔧 Configurações:"
echo "   RPC: $RPC_URL"
echo "   Deployer: $DEPLOYER"
echo "   Private Key: ${PRIVATE_KEY:0:10}..."
echo ""

# 1. Verificar se Anvil está rodando
echo "1️⃣ Verificando Anvil..."
if curl -s -X POST -H "Content-Type: application/json" \
   --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
   $RPC_URL > /dev/null; then
    BLOCK=$(curl -s -X POST -H "Content-Type: application/json" \
       --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
       $RPC_URL | jq -r '.result')
    echo "✅ Anvil rodando - Bloco: $BLOCK"
else
    echo "❌ Anvil não está rodando!"
    echo "   Execute em outro terminal: anvil"
    exit 1
fi

# 2. Verificar se Foundry está instalado
echo ""
echo "2️⃣ Verificando Foundry..."
if command -v forge &> /dev/null; then
    FORGE_VERSION=$(forge --version | head -n1)
    echo "✅ Foundry instalado: $FORGE_VERSION"
else
    echo "❌ Foundry não encontrado!"
    echo "   Instale: curl -L https://foundry.paradigm.xyz | bash"
    echo "   Depois: foundryup"
    exit 1
fi

# 3. Verificar saldo do deployer
echo ""
echo "3️⃣ Verificando saldo do deployer..."
BALANCE=$(cast balance $DEPLOYER --rpc-url $RPC_URL)
BALANCE_ETH=$(cast --from-wei $BALANCE)
echo "   Saldo: $BALANCE_ETH ETH"

if (( $(echo "$BALANCE_ETH < 1" | bc -l) )); then
    echo "❌ Saldo insuficiente para deploy!"
    exit 1
fi

# 4. Verificar se os arquivos dos contratos existem
echo ""
echo "4️⃣ Verificando arquivos dos contratos..."

# Voltar para a pasta raiz onde estão os contratos
cd ..

if [ -f "src/CartelaContract.sol" ]; then
    echo "✅ CartelaContract.sol encontrado"
else
    echo "❌ CartelaContract.sol não encontrado em src/"
    echo "   Verifique se está na pasta correta"
    exit 1
fi

if [ -f "src/BingoGameContract.sol" ]; then
    echo "✅ BingoGameContract.sol encontrado"
else
    echo "❌ BingoGameContract.sol não encontrado em src/"
    exit 1
fi

# 5. Compilar contratos
echo ""
echo "5️⃣ Compilando contratos..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Falha na compilação!"
    exit 1
fi
echo "✅ Contratos compilados"

# 6. Deploy do CartelaContract
echo ""
echo "6️⃣ Deploy do CartelaContract..."
echo "   Preço base: 0.01 ETH"
echo "   Fee collector: $DEPLOYER"

CARTELA_RESULT=$(forge create src/CartelaContract.sol:CartelaContract \
    --constructor-args $(cast --to-wei 0.01) $DEPLOYER \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    CARTELA_ADDRESS=$(echo $CARTELA_RESULT | jq -r '.deployedTo')
    echo "✅ CartelaContract deployado: $CARTELA_ADDRESS"
else
    echo "❌ Falha no deploy do CartelaContract"
    echo "   Erro: $CARTELA_RESULT"
    exit 1
fi

# 7. Deploy do BingoGameContract
echo ""
echo "7️⃣ Deploy do BingoGameContract..."

# Parâmetros Chainlink para ambiente local/teste
VRF_COORDINATOR="0x271682DEB8C4E0901D1a1550aD2e64D568E69909"  # Endereço mainnet (para teste)
SUBSCRIPTION_ID=1
KEY_HASH="0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef"

echo "   Cartela: $CARTELA_ADDRESS"
echo "   VRF Coordinator: $VRF_COORDINATOR"
echo "   Subscription ID: $SUBSCRIPTION_ID"

BINGO_RESULT=$(forge create src/BingoGameContract.sol:BingoGameContract \
    --constructor-args \
    $CARTELA_ADDRESS \
    $VRF_COORDINATOR \
    $SUBSCRIPTION_ID \
    $KEY_HASH \
    $DEPLOYER \
    $DEPLOYER \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    BINGO_ADDRESS=$(echo $BINGO_RESULT | jq -r '.deployedTo')
    echo "✅ BingoGameContract deployado: $BINGO_ADDRESS"
else
    echo "⚠️  BingoGameContract falhou (normal se VRF não estiver configurado)"
    echo "   Continuando apenas com CartelaContract..."
    BINGO_ADDRESS=""
fi

# 8. Configurar contratos
echo ""
echo "8️⃣ Configurando contratos..."

# Configurar BingoGame no Cartela (se BingoGame foi deployado)
if [ -n "$BINGO_ADDRESS" ]; then
    echo "   Configurando BingoGame no CartelaContract..."
    cast send $CARTELA_ADDRESS \
        "setBingoGameContract(address)" $BINGO_ADDRESS \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --quiet
    
    if [ $? -eq 0 ]; then
        echo "✅ BingoGame configurado no Cartela"
    else
        echo "⚠️  Erro ao configurar BingoGame no Cartela"
    fi

    # Configurar operador no Bingo
    echo "   Configurando operador no BingoGame..."
    cast send $BINGO_ADDRESS \
        "setOperador(address,bool)" $DEPLOYER true \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --quiet
    
    if [ $? -eq 0 ]; then
        echo "✅ Operador configurado no Bingo"
    else
        echo "⚠️  Erro ao configurar operador no Bingo"
    fi
fi

# 9. Verificar deploy
echo ""
echo "9️⃣ Verificando deploy..."

# Testar função do Cartela
PRECO_BASE=$(cast call $CARTELA_ADDRESS "precoBaseCartela()" --rpc-url $RPC_URL)
PRECO_ETH=$(cast --from-wei $PRECO_BASE)
echo "   Preço base: $PRECO_ETH ETH"

# Testar função do Bingo (se deployou)
if [ -n "$BINGO_ADDRESS" ]; then
    ADMIN=$(cast call $BINGO_ADDRESS "admin()" --rpc-url $RPC_URL)
    echo "   Admin Bingo: $ADMIN"
fi

# 10. Atualizar .env.local
echo ""
echo "🔟 Atualizando .env.local..."

# Voltar para frontendv2/
cd frontendv2

# Backup do .env.local atual
if [ -f .env.local ]; then
    cp .env.local .env.local.backup.$(date +%s)
    echo "   📦 Backup criado"
fi

# Criar/atualizar .env.local
{
    echo "# Contratos atualizados em $(date)"
    echo "NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS=$CARTELA_ADDRESS"
    if [ -n "$BINGO_ADDRESS" ]; then
        echo "NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS=$BINGO_ADDRESS"
    fi
    echo "NEXT_PUBLIC_NETWORK_ID=31337"
    echo "NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545"
    echo ""
    echo "# Supabase (se necessário)"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://yogkvtfscclmjxhiyxpu.supabase.co"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZ2t2dGZzY2NsbWp4aGl5eHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDA0NjYsImV4cCI6MjA2Mzc3NjQ2Nn0.7-_DHUVjwJdSqfMroOKFWPkLcI3NlwP4JNNPR1n2xgg"
} > .env.local

echo "✅ .env.local atualizado"

# 11. Resumo final
echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo "==================="
echo "📋 CartelaContract: $CARTELA_ADDRESS"
if [ -n "$BINGO_ADDRESS" ]; then
    echo "🎲 BingoGameContract: $BINGO_ADDRESS"
else
    echo "🎲 BingoGameContract: Não deployado (VRF não configurado)"
fi
echo ""
echo "📝 Próximos passos:"
echo "   1. Reinicie o servidor Next.js:"
echo "      Ctrl+C (para parar)"
echo "      npm run dev (para iniciar)"
echo ""
echo "   2. Configure MetaMask:"
echo "      - Rede: localhost:8545"
echo "      - Chain ID: 31337"
echo "      - Moeda: ETH"
echo ""
echo "   3. Importe a conta no MetaMask:"
echo "      - Private Key: $PRIVATE_KEY"
echo ""
echo "   4. Teste criando uma cartela!"
echo ""
echo "🛠️ Para re-deploy:"
echo "   ./deploy-contracts.sh"