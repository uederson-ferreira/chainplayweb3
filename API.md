# Documentação da API

## Smart Contracts

### BingoGame.sol

Contrato principal que gerencia o jogo de Bingo.

#### Funções

##### `createGame(uint256 ticketPrice, uint256 maxPlayers)`

Cria uma nova partida de Bingo.

- **Parâmetros:**
  - `ticketPrice`: Preço em wei para cada cartela
  - `maxPlayers`: Número máximo de jogadores
- **Retorno:** ID da partida criada
- **Eventos:**
  - `GameCreated(uint256 gameId, uint256 ticketPrice, uint256 maxPlayers)`

##### `joinGame(uint256 gameId)`

Permite que um jogador entre em uma partida.

- **Parâmetros:**
  - `gameId`: ID da partida
- **Requisitos:**
  - Jogador deve enviar o valor correto do ticket
  - Partida deve estar aberta
  - Não deve ter atingido o limite de jogadores
- **Eventos:**
  - `PlayerJoined(uint256 gameId, address player)`

##### `startGame(uint256 gameId)`

Inicia uma partida de Bingo.

- **Parâmetros:**
  - `gameId`: ID da partida
- **Requisitos:**
  - Apenas o criador da partida pode iniciar
  - Mínimo de jogadores deve ser atingido
- **Eventos:**
  - `GameStarted(uint256 gameId)`

##### `callNumber(uint256 gameId)`

Sorteia um número para a partida.

- **Parâmetros:**
  - `gameId`: ID da partida
- **Requisitos:**
  - Partida deve estar em andamento
  - Apenas o criador da partida pode chamar números
- **Eventos:**
  - `NumberCalled(uint256 gameId, uint256 number)`

##### `claimBingo(uint256 gameId)`

Permite que um jogador reclame a vitória.

- **Parâmetros:**
  - `gameId`: ID da partida
- **Requisitos:**
  - Jogador deve ter uma cartela válida
  - Cartela deve ter completado o padrão de vitória
- **Eventos:**
  - `BingoClaimed(uint256 gameId, address winner)`

#### Eventos

```solidity
event GameCreated(uint256 indexed gameId, uint256 ticketPrice, uint256 maxPlayers);
event PlayerJoined(uint256 indexed gameId, address indexed player);
event GameStarted(uint256 indexed gameId);
event NumberCalled(uint256 indexed gameId, uint256 number);
event BingoClaimed(uint256 indexed gameId, address indexed winner);
```

### BingoCard.sol

Contrato que gerencia as cartelas de Bingo.

#### Funções da Cartela

##### `generateCard(uint256 gameId)`

Gera uma nova cartela para um jogador.

- **Parâmetros:**
  - `gameId`: ID da partida
- **Retorno:** Array com os números da cartela
- **Eventos:**
  - `CardGenerated(uint256 gameId, address player, uint256[] numbers)`

##### `verifyBingo(uint256 gameId, address player, uint256[] calledNumbers)`

Verifica se um jogador fez Bingo.

- **Parâmetros:**
  - `gameId`: ID da partida
  - `player`: Endereço do jogador
  - `calledNumbers`: Números já sorteados
- **Retorno:** `bool` indicando se o jogador fez Bingo

## Frontend API

### Hooks

#### `useBingoGame`

Hook para interagir com o contrato do jogo.

```typescript
const {
  createGame,
  joinGame,
  startGame,
  callNumber,
  claimBingo,
  gameState,
  error,
  loading
} = useBingoGame(gameId);
```

#### `useBingoCard`

Hook para gerenciar cartelas.

```typescript
const {
  generateCard,
  verifyBingo,
  cardNumbers,
  isBingo,
  error,
  loading
} = useBingoCard(gameId, playerAddress);
```

### Componentes

#### `BingoGame`

Componente principal do jogo.

```typescript
interface BingoGameProps {
  gameId: number;
  onGameStart?: () => void;
  onGameEnd?: (winner: string) => void;
}
```

#### `BingoCard`

Componente que exibe uma cartela.

```typescript
interface BingoCardProps {
  numbers: number[];
  calledNumbers: number[];
  onNumberClick?: (number: number) => void;
}
```

## Endpoints da API

### `/api/games`

#### `GET /api/games`

Lista todas as partidas ativas.

- **Resposta:**

  ```json
  {
    "games": [
      {
        "id": "number",
        "ticketPrice": "string",
        "maxPlayers": "number",
        "currentPlayers": "number",
        "status": "string",
        "createdAt": "string"
      }
    ]
  }
  ```

#### `POST /api/games`

Cria uma nova partida.

- **Request:**

  ```json
  {
    "ticketPrice": "string",
    "maxPlayers": "number"
  }
  ```

- **Resposta:**

  ```json
  {
    "gameId": "number",
    "transactionHash": "string"
  }
  ```

### `/api/games/:gameId`

#### `GET /api/games/:gameId`

Obtém detalhes de uma partida específica.

- **Resposta:**

  ```json
  {
    "id": "number",
    "ticketPrice": "string",
    "maxPlayers": "number",
    "currentPlayers": "number",
    "status": "string",
    "numbers": "number[]",
    "winner": "string",
    "createdAt": "string"
  }
  ```

#### `POST /api/games/:gameId/join`

Entra em uma partida.

- **Resposta:**

  ```json
  {
    "transactionHash": "string",
    "cardNumbers": "number[]"
  }
  ```

#### `POST /api/games/:gameId/start`

Inicia uma partida.

- **Resposta:**

  ```json
  {
    "transactionHash": "string"
  }
  ```

#### `POST /api/games/:gameId/call`

Sorteia um número.

- **Resposta:**

  ```json
  {
    "number": "number",
    "transactionHash": "string"
  }
  ```

#### `POST /api/games/:gameId/claim`

Reclama a vitória.

- **Resposta:**

  ```json
  {
    "success": "boolean",
    "transactionHash": "string"
  }
  ```
