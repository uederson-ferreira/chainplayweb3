# Guia de Contribuição

Obrigado por considerar contribuir com o BingoWeb3! Este documento fornece diretrizes e instruções para contribuir com o projeto.

## 📋 Código de Conduta

Este projeto e todos que participam dele estão comprometidos com um ambiente amigável e seguro para todos. Por favor, seja respeitoso e inclusivo.

## 🎯 Como Contribuir

### 1. Configuração do Ambiente

1. Faça um fork do projeto
2. Clone seu fork:
   ```bash
   git clone https://github.com/seu-usuario/bingoweb3.git
   cd bingoweb3
   ```
3. Adicione o repositório original como upstream:
   ```bash
   git remote add upstream https://github.com/original-usuario/bingoweb3.git
   ```

### 2. Fluxo de Trabalho

1. Mantenha seu fork atualizado:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/nome-da-sua-feature
   ```

3. Faça suas alterações seguindo os padrões de código

4. Faça commit das suas alterações:
   ```bash
   git commit -m "feat: descrição da sua feature"
   ```

5. Envie para seu fork:
   ```bash
   git push origin feature/nome-da-sua-feature
   ```

6. Abra um Pull Request

### 3. Padrões de Código

#### Smart Contracts
- Use Solidity 0.8.x ou superior
- Siga o [Style Guide do Solidity](https://docs.soliditylang.org/en/latest/style-guide.html)
- Documente todas as funções públicas usando NatSpec
- Escreva testes para todas as novas funcionalidades

#### Frontend
- Siga as [convenções do Next.js](https://nextjs.org/docs/basic-features/typescript)
- Use TypeScript para todo novo código
- Siga o [Style Guide do Airbnb](https://github.com/airbnb/javascript)
- Mantenha os componentes pequenos e reutilizáveis

### 4. Commits

Use o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` para novas funcionalidades
- `fix:` para correções de bugs
- `docs:` para alterações na documentação
- `style:` para alterações de formatação
- `refactor:` para refatorações
- `test:` para adição/modificação de testes
- `chore:` para tarefas de manutenção

### 5. Pull Requests

1. Atualize a documentação necessária
2. Adicione testes para novas funcionalidades
3. Certifique-se que todos os testes passam
4. Atualize o CHANGELOG.md se necessário
5. Descreva claramente as mudanças no PR

## 🧪 Testes

### Smart Contracts
```bash
cd contracts
forge test
```

### Frontend
```bash
cd frontend
npm test
```

## 📝 Documentação

- Mantenha a documentação atualizada
- Use comentários claros e concisos
- Documente todas as APIs públicas
- Atualize o README quando necessário

## 🔍 Revisão de Código

- Todos os PRs precisam de pelo menos uma aprovação
- Mantenha as discussões construtivas
- Responda aos comentários prontamente
- Faça as alterações sugeridas quando apropriado

## 🚀 Deploy

- Não faça deploy de mudanças sem aprovação
- Teste em ambiente de staging antes de produção
- Mantenha as chaves privadas seguras
- Documente o processo de deploy

## 📫 Dúvidas?

Se você tiver dúvidas, abra uma issue ou entre em contato com a equipe de manutenção. 