# Bingo Web3 com Chainlink VRF

## Descrição

Este projeto implementa os contratos inteligentes para uma aplicação descentralizada (DApp) de Bingo na blockchain. O objetivo é criar um jogo de bingo flexível onde os usuários podem:

*   Criar cartelas com dimensões personalizadas.
*   Registrar os números de suas cartelas.
*   Participar de rodadas de bingo.
*   Ter os números sorteados de forma comprovadamente aleatória e justa utilizando o Chainlink VRF (Verifiable Random Function) v2.
*   Ter os vencedores determinados automaticamente on-chain com base em regras de vitória (atualmente linha, coluna e diagonal para cartelas quadradas).
*   (Opcional) Distribuir prêmios aos vencedores.

O sistema é composto por dois contratos principais:

1.  `CartelaContract.sol`: Gerencia a criação, registro de números e propriedade das cartelas de bingo.
2.  `BingoGameContract.sol`: Orquestra as rodadas do jogo, interage com o Chainlink VRF para o sorteio de números, verifica os vencedores e (opcionalmente) distribui prêmios.

## Tecnologias Utilizadas

*   **Blockchain:** EVM-compatível (desenvolvido com foco em Ethereum, Polygon, etc.)
*   **Smart Contracts:** Solidity `^0.8.20`
*   **Framework de Desenvolvimento e Testes:** Foundry
*   **Oráculo de Aleatoriedade:** Chainlink VRF v2 (utilizando mocks para testes locais)

## Estrutura do Projeto

```
bingochainweb3
├── src/                      # Diretório dos contratos inteligentes
│   ├── CartelaContract.sol
│   └── BingoGameContract.sol
├── test/                     # Diretório dos testes unitários e de integração
│   ├── CartelaContract.t.sol
│   └── BingoGameContract.t.sol
├── lib/                      # Dependências (instaladas via forge install)
│   ├── chainlink/
│   └── forge-std/
├── script/                   # Diretório para scripts de deploy (a ser criado)
├── foundry.toml              # Arquivo de configuração do Foundry
├── .git/                     # Diretório do Git (se inicializado)
├── .github/                  # Configurações do GitHub (se aplicável)
├── README.md                 # Este arquivo
└── ... (outros arquivos gerados pelo Foundry: cache, out, etc.)
```

## Pré-requisitos

Para compilar, testar e interagir com os contratos localmente, você precisa ter o [Foundry](https://getfoundry.sh/) instalado.

## Instalação

1.  **Obtenha os arquivos:** Se você recebeu este projeto como um diretório, pule para o passo 2. Se for um repositório Git:
    ```bash
    git clone <url_do_repositorio>
    cd bingo_web3
    ```
2.  **Instale as dependências:** Navegue até o diretório raiz do projeto (`/home/ubuntu/bingo_web3`) e execute o comando do Foundry para instalar as bibliotecas necessárias (Chainlink e Forge-Std):
    ```bash
    forge install
    ```
    *Observação: Pode ser necessário inicializar o Git (`git init`) no diretório se ele ainda não for um repositório para que o `forge install` funcione corretamente.* 

## Configuração

*   **Foundry (`foundry.toml`):** O arquivo `foundry.toml` já está configurado com os `remappings` necessários para que o compilador encontre as dependências da Chainlink e do Forge-Std.
*   **Chainlink VRF (Testes Locais):** Para os testes locais (`forge test`), utilizamos um *mock* (`VRFCoordinatorV2Mock.sol`) fornecido pela Chainlink. Isso simula o comportamento do coordenador VRF sem a necessidade de uma subscrição real, chaves ou tokens LINK. As configurações do mock (ID da subscrição, keyHash) são definidas dentro do arquivo de teste (`test/BingoGameContract.t.sol`).
*   **Chainlink VRF (Testnet/Mainnet):** Para implantar em uma rede real (Testnet ou Mainnet), você precisará:
    1.  Obter um ID de Subscrição VRF v2 na [página de subscrição da Chainlink](https://vrf.chain.link/).
    2.  Financiar sua subscrição com tokens LINK.
    3.  Obter o endereço do Coordenador VRF e o Key Hash correspondentes à rede escolhida.
    4.  Passar esses valores (endereço do coordenador, ID da subscrição, key hash) como argumentos para o construtor do `BingoGameContract` durante o deploy.
    5.  Adicionar o endereço do seu contrato `BingoGameContract` implantado como um consumidor autorizado na sua subscrição VRF.
*   **Variáveis de Ambiente (Deploy):** Para realizar o deploy em redes públicas usando `forge script`, você precisará configurar variáveis de ambiente com seu endpoint RPC (ex: Alchemy, Infura) e sua chave privada. Consulte a [documentação do Foundry sobre scripts](https://book.getfoundry.sh/tutorials/solidity-scripting) para mais detalhes.

## Compilação

Para compilar os contratos inteligentes, navegue até o diretório raiz do projeto e execute:

```bash
forge build
```

Isso gerará os artefatos da compilação (ABI, bytecode) no diretório `out/`.

## Testes

O projeto inclui testes automatizados para ambos os contratos usando o Foundry.

*   `CartelaContract.t.sol`: Testa a criação, registro e transferência de propriedade das cartelas.
*   `BingoGameContract.t.sol`: Testa o fluxo do jogo, incluindo início de rodada, participação de jogadores, sorteio de números (usando o mock VRF), verificação de vencedores e distribuição de prêmios.

Para executar todos los testes:

```bash
forge test
```

Para executar testes com mais detalhes (verbose):

```bash
forge test -vv
```

Para executar testes de um contrato específico:

```bash
forge test --match-contract CartelaContractTest
forge test --match-contract BingoGameContractTest
```

## Deploy (Exemplo)

*Atualmente, scripts de deploy não estão implementados neste projeto.*

Para implantar os contratos, você normalmente criaria um script de deploy em Solidity na pasta `script/` (ex: `Deploy.s.sol`). Este script definiria a lógica para implantar primeiro o `CartelaContract` e depois o `BingoGameContract`, passando o endereço do primeiro e os parâmetros do VRF (reais, não mock) para o construtor do segundo.

Um comando de exemplo para executar tal script (requer configuração de RPC e chave privada via variáveis de ambiente ou `foundry.toml`) seria:

```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url <your_rpc_url> --private-key <your_private_key> --broadcast --verify
```

Consulte a [documentação do Foundry](https://book.getfoundry.sh/tutorials/solidity-scripting) para detalhes sobre a criação de scripts de deploy.

## Uso (Interação com Contratos)

Após o deploy, a interação com os contratos pode ser feita através de uma interface frontend (DApp) usando bibliotecas como Ethers.js ou Viem, ou diretamente através de ferramentas como `cast` (do Foundry) ou Remix.

**Fluxo Básico:**

1.  **Admin/Usuário implanta `CartelaContract`.**
2.  **Admin/Usuário implanta `BingoGameContract`**, fornecendo o endereço do `CartelaContract` e os parâmetros do Chainlink VRF (reais).
3.  **Admin/Usuário adiciona o endereço do `BingoGameContract` como consumidor na subscrição VRF.**
4.  **Jogador cria uma cartela:** Chama `cartelaContract.criarCartela(linhas, colunas)`.
5.  **Jogador registra os números:** Chama `cartelaContract.registrarNumerosCartela(cartelaId, numeros[])`.
6.  **Admin/Organizador inicia uma rodada:** Chama `bingoGame.iniciarRodada(numeroMaximo)`.
7.  **Jogador participa da rodada:** Chama `bingoGame.participar(rodadaId, cartelaId)` (precisa ser o dono da cartela).
8.  **Admin/Organizador (ou entidade autorizada) sorteia números:** Chama `bingoGame.sortearNumero(rodadaId)`. Isso dispara uma requisição ao Chainlink VRF.
9.  **Chainlink VRF responde:** O Coordenador VRF chama a função `bingoGame.fulfillRandomWords(requestId, randomWords[])` no contrato.
10. **Contrato processa o número:** `fulfillRandomWords` deriva o número de bingo, armazena-o, e chama a lógica interna `_verificarVencedores`.
11. **Verificação de Vencedores:** `_verificarVencedores` checa todas as cartelas participantes contra os números sorteados e as regras de vitória. Se um vencedor é encontrado, o estado da rodada muda para `Finalizada` e eventos são emitidos.
12. **Repetir Sorteio (Passo 8-11):** Se nenhum vencedor foi encontrado, o passo 8 pode ser repetido para sortear mais números.
13. **Distribuir Prêmios (Opcional):** Após a rodada ser `Finalizada`, `bingoGame.distribuirPremios(rodadaId)` pode ser chamado para distribuir o pool de prêmios (a lógica de acúmulo e o tipo de prêmio precisam ser definidos).

## Próximos Passos / TODO

*   [ ] Implementar interface frontend (React, Vue, etc.) com Ethers.js/Viem para interação.
*   [ ] Adicionar lógica de acúmulo de prêmios (ex: taxas de entrada).
*   [ ] Tornar as regras de vitória configuráveis por rodada (ex: usando bitmask).
*   [ ] Implementar verificação de 
