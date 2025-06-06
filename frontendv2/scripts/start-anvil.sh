#!/bin/bash
# scripts/start-anvil.sh
# Script para iniciar Anvil com fork da mainnet

echo "🚀 Iniciando Anvil com fork da mainnet..."

# Verificar se tem RPC_URL configurada
if [ -z "$MAINNET_RPC_URL" ]; then
    echo "⚠️  MAINNET_RPC_URL não configurada, usando RPC demo"
    RPC_URL="https://eth-mainnet.g.alchemy.com/v2/demo"
else
    echo "✅ Usando RPC configurada: $MAINNET_RPC_URL"
    RPC_URL="$MAINNET_RPC_URL"
fi

# Iniciar Anvil com configurações otimizadas
anvil \
  --fork-url "$RPC_URL" \
  --host 0.0.0.0 \
  --port 8545 \
  --accounts 10 \
  --balance 10000 \
  --gas-limit 30000000 \
  --gas-price 1000000000 \
  --base-fee 1000000000 \
  --block-time 1

echo "✅ Anvil iniciado em http://localhost:8545"
echo "🔧 Chain ID: 31337"
echo "💰 10 accounts com 10,000 ETH cada"
echo "🌐 Fork da mainnet com contratos VRF reais"