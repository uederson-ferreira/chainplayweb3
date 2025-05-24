# Variáveis de Ambiente

Este documento lista todas as variáveis de ambiente necessárias para o projeto. Crie um arquivo `.env` na raiz do projeto e copie estas variáveis, preenchendo com seus valores.

## Configurações da Rede Ethereum

```env
# ID da rede Ethereum (11155111 para Sepolia Testnet)
NEXT_PUBLIC_NETWORK_ID=11155111

# URL do provedor RPC (Infura, Alchemy, etc)
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/seu-projeto-id

# ID da chain (deve corresponder ao NETWORK_ID)
NEXT_PUBLIC_CHAIN_ID=11155111
```

## Endereços dos Contratos

```env
# Endereços dos contratos após deploy
NEXT_PUBLIC_BINGO_GAME_CONTRACT_ADDRESS=
NEXT_PUBLIC_BINGO_CARD_CONTRACT_ADDRESS=
```

## Configurações do Frontend

```env
# Informações básicas da aplicação
NEXT_PUBLIC_APP_NAME=BingoWeb3
NEXT_PUBLIC_APP_DESCRIPTION=Jogo de Bingo Descentralizado
NEXT_PUBLIC_APP_URL=http://localhost:3000

# URL da API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Configurações de Segurança

```env
# Configurações de transações
NEXT_PUBLIC_REQUIRED_CONFIRMATIONS=1
NEXT_PUBLIC_MAX_GAS_LIMIT=3000000
```

## Configurações de Desenvolvimento

```env
# Ambiente
NODE_ENV=development
DEBUG=false

# Chaves de API (NUNCA compartilhe ou comite)
PRIVATE_KEY=  # Chave privada para deploy
INFURA_API_KEY=  # Chave da Infura
ALCHEMY_API_KEY=  # Chave da Alchemy (opcional)
```

## Configurações de Teste

```env
# Configurações específicas para testes
TEST_PRIVATE_KEY=  # Chave privada para testes
TEST_RPC_URL=  # URL RPC para testes
```

## Monitoramento e Analytics

```env
# Monitoramento de erros
NEXT_PUBLIC_SENTRY_DSN=  # DSN do Sentry

# Analytics (opcional)
NEXT_PUBLIC_ANALYTICS_ID=  # Google Analytics
```

## Cache e Armazenamento

```env
# Redis (opcional)
REDIS_URL=

# IPFS
NEXT_PUBLIC_IPFS_PROJECT_ID=
NEXT_PUBLIC_IPFS_PROJECT_SECRET=
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

## Email

```env
# Configurações SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
```

## Notas Importantes

1. **NUNCA** comite o arquivo `.env` no repositório
2. Mantenha suas chaves privadas seguras
3. Use diferentes chaves para desenvolvimento e produção
4. Considere usar um gerenciador de segredos em produção
5. Revise regularmente as permissões das chaves de API

## Como Usar

1. Copie este arquivo para `.env`
2. Preencha as variáveis com seus valores
3. Para desenvolvimento local, apenas as variáveis marcadas como `NEXT_PUBLIC_` são necessárias
4. Para deploy, todas as variáveis são necessárias

## Variáveis por Ambiente

### Desenvolvimento Local
- NEXT_PUBLIC_*
- NODE_ENV
- DEBUG

### Testes
- Todas as variáveis de desenvolvimento
- TEST_*

### Produção
- Todas as variáveis
- NODE_ENV=production
- Chaves de produção 