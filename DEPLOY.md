# Guia de Deploy

Este documento descreve o processo de deploy do BingoWeb3, incluindo os smart contracts e a aplicação frontend.

## 📋 Pré-requisitos

- Node.js v18 ou superior
- Foundry instalado
- Conta em um provedor de RPC (Infura, Alchemy, etc.)
- Carteira Ethereum com ETH para deploy
- Acesso a um serviço de hospedagem (Vercel, AWS, etc.)

## 🚀 Deploy dos Smart Contracts

### 1. Preparação

1. Configure as variáveis de ambiente:

   ```bash
   cp ENV.md .env
   # Edite o arquivo .env com suas configurações
   ```

2. Verifique se você tem ETH suficiente na rede alvo:
   - Sepolia Testnet: <https://sepoliafaucet.com/>
   - Mainnet: Certifique-se de ter ETH suficiente para gas

### 2. Deploy dos Contratos

1. Compile os contratos:

   ```bash
   cd contracts
   forge build
   ```

2. Execute os testes:

   ```bash
   forge test
   ```

3. Deploy para a rede de teste:

   ```bash
   forge script script/Deploy.s.sol:DeployScript --rpc-url $NEXT_PUBLIC_RPC_URL --broadcast --verify
   ```

4. Anote os endereços dos contratos deployados e atualize o `.env`

### 3. Verificação

1. Verifique os contratos no Etherscan:
   - Sepolia: <https://sepolia.etherscan.io/>
   - Mainnet: <https://etherscan.io/>

2. Execute testes de integração:

   ```bash
   forge test --fork-url $NEXT_PUBLIC_RPC_URL
   ```

## 🎨 Deploy do Frontend

### 1. Preparação 1

1. Configure as variáveis de ambiente do frontend:

   ```bash
   cd frontend
   cp ../ENV.md .env.local
   # Atualize com os endereços dos contratos
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Execute os testes:

   ```bash
   npm test
   ```

### 2. Build

1. Gere o build de produção:

   ```bash
   npm run build
   ```

2. Teste localmente:

   ```bash
   npm run start
   ```

### 3. Deploy

#### Opção 1: Vercel (Recomendado)

1. Instale a CLI da Vercel:

   ```bash
   npm i -g vercel
   ```

2. Faça login:

   ```bash
   vercel login
   ```

3. Deploy:

   ```bash
   vercel
   ```

#### Opção 2: AWS Amplify

1. Configure o AWS Amplify:

   ```bash
   amplify init
   ```

2. Adicione o frontend:

   ```bash
   amplify add frontend
   ```

3. Deploy:

   ```bash
   amplify push
   ```

#### Opção 3: Deploy Manual

1. Gere os arquivos estáticos:

   ```bash
   npm run export
   ```

2. Faça upload para seu servidor web

## 🔍 Pós-Deploy

### 1. Verificações

- [ ] Contratos verificados no Etherscan
- [ ] Frontend acessível e responsivo
- [ ] Conexão com carteira funcionando
- [ ] Transações sendo processadas
- [ ] Eventos sendo emitidos corretamente

### 2. Monitoramento

1. Configure o Sentry para monitoramento de erros
2. Configure o Google Analytics (opcional)
3. Monitore o uso de gas e custos

### 3. Manutenção

- Mantenha as dependências atualizadas
- Monitore o uso de recursos
- Faça backup regular dos dados
- Mantenha as chaves de API seguras

## 🛡️ Segurança

### Checklist de Segurança

- [ ] Contratos auditados
- [ ] Chaves privadas seguras
- [ ] Variáveis de ambiente protegidas
- [ ] SSL/TLS configurado
- [ ] Backups configurados
- [ ] Monitoramento ativo

### Boas Práticas

1. Use diferentes chaves para desenvolvimento e produção
2. Mantenha as chaves privadas offline
3. Use um gerenciador de segredos em produção
4. Configure rate limiting
5. Implemente monitoramento de segurança

## 🔄 Atualizações

### Processo de Atualização

1. Desenvolva e teste em ambiente de staging
2. Faça backup dos dados
3. Atualize os contratos (se necessário)
4. Atualize o frontend
5. Execute testes de integração
6. Faça deploy em produção
7. Monitore o sistema

### Rollback

1. Mantenha versões anteriores dos contratos
2. Configure pontos de restauração
3. Documente o processo de rollback
4. Teste o processo de rollback regularmente

## 📝 Documentação

- Mantenha a documentação atualizada
- Documente todas as mudanças
- Mantenha um registro de deploy
- Atualize o CHANGELOG.md

## 🆘 Suporte

Em caso de problemas:

1. Verifique os logs
2. Consulte a documentação
3. Verifique o status da rede
4. Entre em contato com a equipe de suporte
