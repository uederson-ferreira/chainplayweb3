# BingoWeb3 🎲

Um projeto de Bingo descentralizado construído com tecnologia Web3, permitindo que usuários participem de jogos de bingo de forma transparente e segura através da blockchain.

## 🏗️ Estrutura do Projeto

O projeto está dividido em duas partes principais:

```
.
├── contracts/          # Smart Contracts (Foundry)
│   ├── src/           # Código fonte dos contratos
│   ├── test/          # Testes dos contratos
│   ├── script/        # Scripts de deploy
│   └── docs/          # Documentação dos contratos
│
└── frontend/          # Interface Web (Next.js)
    ├── components/    # Componentes React
    ├── pages/         # Páginas da aplicação
    ├── hooks/         # Custom hooks
    └── config/        # Configurações
```

## 🚀 Tecnologias Utilizadas

### Smart Contracts
- [Foundry](https://book.getfoundry.sh/) - Framework para desenvolvimento de smart contracts
- Solidity - Linguagem de programação para smart contracts
- Hardhat - Ambiente de desenvolvimento Ethereum

### Frontend
- Next.js - Framework React
- TypeScript - Superset JavaScript com tipagem estática
- Tailwind CSS - Framework CSS
- ethers.js - Biblioteca para interação com Ethereum

## 📋 Pré-requisitos

- Node.js (v18 ou superior)
- Foundry
- MetaMask ou outra wallet Web3
- Git

## 🔧 Instalação

### Smart Contracts

```bash
# Instalar Foundry
curl -L https://foundry.paradigm.xyz | bash

# Clonar o repositório
git clone https://github.com/seu-usuario/bingoweb3.git
cd bingoweb3

# Instalar dependências dos contratos
cd contracts
forge install
```

### Frontend

```bash
# Instalar dependências do frontend
cd frontend
npm install
```

## 🎮 Como Executar

### Smart Contracts

```bash
# Na pasta contracts/
forge test        # Executar testes
forge build       # Compilar contratos
forge script      # Executar scripts
```

### Frontend

```bash
# Na pasta frontend/
npm run dev      # Iniciar servidor de desenvolvimento
npm run build    # Build para produção
npm run start    # Iniciar servidor de produção
```

## 📝 Documentação

- [Documentação dos Smart Contracts](./contracts/docs/README.md)
- [Guia de Contribuição](./CONTRIBUTING.md)
- [Documentação da API](./API.md)

## 🤝 Como Contribuir

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Faça o Commit das suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Faça o Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📧 Contato

Seu Nome - [@seu_twitter](https://twitter.com/seu_twitter) - email@exemplo.com

Link do Projeto: [https://github.com/seu-usuario/bingoweb3](https://github.com/seu-usuario/bingoweb3) 