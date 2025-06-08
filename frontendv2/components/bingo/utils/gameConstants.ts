// components/bingo/utils/gameConstants.ts

import { parseEther } from 'viem';

// ========================================
// CONFIGURAÇÕES PADRÃO DE RODADA
// ========================================
export const DEFAULT_ROUND_CONFIG = {
  numeroMaximo: 75,                          // Números de 1 a 75
  taxaEntrada: parseEther("0.01"),          // 0.01 ETH de entrada
  timeoutRodada: BigInt(3600),              // 1 hora em segundos
  padroesVitoria: [true, true, true, false] // [linha, coluna, diagonal, cartela_completa]
} as const;

// ========================================
// ESTADOS DAS RODADAS
// ========================================
export const RODADA_ESTADOS = {
  INATIVA: 0,
  ABERTA: 1,
  SORTEANDO: 2,
  FINALIZADA: 3,
  CANCELADA: 4
} as const;

export const ESTADO_TEXTOS = {
  [RODADA_ESTADOS.INATIVA]: "Inativa",
  [RODADA_ESTADOS.ABERTA]: "Aberta", 
  [RODADA_ESTADOS.SORTEANDO]: "Sorteando",
  [RODADA_ESTADOS.FINALIZADA]: "Finalizada",
  [RODADA_ESTADOS.CANCELADA]: "Cancelada"
} as const;

export const ESTADO_CORES = {
  [RODADA_ESTADOS.INATIVA]: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  [RODADA_ESTADOS.ABERTA]: "bg-green-500/20 text-green-400 border-green-500/30",
  [RODADA_ESTADOS.SORTEANDO]: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  [RODADA_ESTADOS.FINALIZADA]: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  [RODADA_ESTADOS.CANCELADA]: "bg-red-500/20 text-red-400 border-red-500/30"
} as const;

// ========================================
// CONFIGURAÇÕES DE GAS
// ========================================
export const GAS_CONFIGS = {
  INICIAR_RODADA: {
    gas: BigInt(300000),
    gasPrice: BigInt(2000000000), // 2 gwei
  },
  SORTEAR_NUMERO: {
    gas: BigInt(250000),
    gasPrice: BigInt(2000000000), // 2 gwei
  },
  PARTICIPAR: {
    gas: BigInt(200000),
    gasPrice: BigInt(2000000000), // 2 gwei
  },
  CANCELAR_RODADA: {
    gas: BigInt(200000),
    gasPrice: BigInt(2000000000), // 2 gwei
  }
} as const;

// ========================================
// MENSAGENS DE TOAST
// ========================================
export const TOAST_MESSAGES = {
  SUCCESS: {
    RODADA_CRIADA: {
      title: "✅ Rodada criada!",
      description: "Nova rodada de Bingo está ativa."
    },
    NUMERO_SORTEADO: {
      title: "🎲 Número sorteado!",
      description: "Um novo número foi sorteado via Chainlink VRF."
    },
    PARTICIPACAO_CONFIRMADA: {
      title: "✅ Participação confirmada!",
      description: "Você entrou na rodada com sucesso."
    }
  },
  ERROR: {
    CARTEIRA_NAO_CONECTADA: {
      title: "❌ Carteira não conectada",
      description: "Conecte sua carteira primeiro."
    },
    REDE_INCORRETA: {
      title: "❌ Rede incorreta",
      description: "Conecte-se à rede local (localhost:8545)."
    },
    SEM_PERMISSAO: {
      title: "❌ Sem permissão",
      description: "Você não tem permissão de operador."
    },
    CONTRATO_INACESSIVEL: {
      title: "❌ Contrato inacessível",
      description: "Verifique se a blockchain local está rodando."
    }
  },
  INFO: {
    CRIANDO_RODADA: {
      title: "🚀 Criando rodada...",
      description: "Confirme na MetaMask e aguarde confirmação."
    },
    SORTEANDO_NUMERO: {
      title: "🎲 Sorteando número...",
      description: "Transação enviada via Chainlink VRF."
    },
    PARTICIPANDO: {
      title: "🎯 Participando...",
      description: "Registrando participação na rodada."
    }
  }
} as const;

// ========================================
// VALIDAÇÕES
// ========================================
export const VALIDATIONS = {
  NUMERO_MAXIMO: {
    MIN: 10,
    MAX: 99
  },
  TIMEOUT_RODADA: {
    MIN: 30 * 60,      // 30 minutos
    MAX: 24 * 60 * 60  // 24 horas
  },
  TAXA_ENTRADA: {
    MIN: parseEther("0.001"), // 0.001 ETH mínimo
    MAX: parseEther("10")     // 10 ETH máximo
  },
  CARTELA: {
    LINHAS_MIN: 3,
    LINHAS_MAX: 10,
    COLUNAS_MIN: 3, 
    COLUNAS_MAX: 10,
    CELULAS_MAX: 255
  }
} as const;

// ========================================
// TIMEOUTS E DELAYS
// ========================================
export const TIMEOUTS = {
  AGUARDAR_CONFIRMACAO: 3000,    // 3 segundos após confirmação
  RELOAD_AUTOMATICO: 8000,       // 8 segundos para reload automático
  TIMEOUT_CONEXAO: 15000,        // 15 segundos para timeout de conexão
  DEBOUNCE_BUSCA: 500           // 500ms de debounce para buscas
} as const;

// ========================================
// PADRÕES DE VITÓRIA
// ========================================
export const PADROES_VITORIA = {
  LINHA: 0,
  COLUNA: 1,
  DIAGONAL: 2,
  CARTELA_COMPLETA: 3
} as const;

export const PADROES_VITORIA_NOMES = {
  [PADROES_VITORIA.LINHA]: "Linha",
  [PADROES_VITORIA.COLUNA]: "Coluna", 
  [PADROES_VITORIA.DIAGONAL]: "Diagonal",
  [PADROES_VITORIA.CARTELA_COMPLETA]: "Cartela Completa"
} as const;