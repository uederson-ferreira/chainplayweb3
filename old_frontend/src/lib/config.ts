// Configuração da aplicação

// Endereços dos contratos implantados
export const CONTRACT_ADDRESSES = {
  // Rede local Anvil/Hardhat (Chain ID 31337)
  "31337": {
    CARTELA_CONTRACT: import.meta.env.VITE_CARTELA_CONTRACT_ADDRESS,
    BINGO_GAME_CONTRACT: import.meta.env.VITE_BINGOGAME_CONTRACT_ADDRESS,
  },
  // Sepolia testnet (Chain ID 11155111)
  "11155111": {
    CARTELA_CONTRACT: "0x0000000000000000000000000000000000000000", // Será atualizado após deploy
    BINGO_GAME_CONTRACT: "0x0000000000000000000000000000000000000000", // Será atualizado após deploy
  }
};

// Configuração da rede
export const CHAIN_CONFIG = {
  "31337": {
    chainId: 31337,
    name: "Localhost",
    currency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["http://127.0.0.1:8545"], // Endereço padrão do Anvil/Hardhat
    blockExplorers: {
      default: {
        name: "Etherscan",
        url: "#", // Não há block explorer para rede local normalmente
      },
    },
  },
  "11155111": {
    chainId: 11155111,
    name: "Sepolia",
    currency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorers: {
      default: {
        name: "Etherscan",
        url: "https://sepolia.etherscan.io",
      },
    },
  }
};

// Roles da aplicação
export const ROLES = {
  ADMIN: "admin",
  PLAYER: "player",
};

// Configuração de cores do tema
export const THEME_COLORS = {
  primary: "#4F46E5", // Indigo
  secondary: "#EC4899", // Pink
  accent: "#F59E0B", // Amber
  background: "#F9FAFB", // Light gray
  text: "#111827", // Dark gray
  success: "#10B981", // Green
  error: "#EF4444", // Red
  warning: "#F59E0B", // Amber
  info: "#3B82F6", // Blue
};

// Estados da rodada de bingo
export enum EstadoRodada {
  Inativa = 0,
  Aberta = 1,
  Sorteando = 2,
  Finalizada = 3
}

// Mapeamento de estados para texto legível
export const ESTADO_RODADA_TEXT = {
  [EstadoRodada.Inativa]: "Inativa",
  [EstadoRodada.Aberta]: "Aberta para participação",
  [EstadoRodada.Sorteando]: "Sorteando números",
  [EstadoRodada.Finalizada]: "Finalizada",
};

// Configurações padrão para cartelas
export const DEFAULT_CARD_CONFIG = {
  ROWS: 5,
  COLUMNS: 5,
  MAX_NUMBER: 75,
};
