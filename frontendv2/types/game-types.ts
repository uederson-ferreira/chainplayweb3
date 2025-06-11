// Arquivo: types/game-types.ts
export interface RoundCreationParams {
  numeroMaximo: number;
  taxaEntrada: string; // em ETH como string (ex: "0.01")
  timeoutHoras: number;
  padroesVitoria: {
    linha: boolean;
    coluna: boolean;
    diagonal: boolean;
    cartelaCompleta: boolean;
  };
}

// Tipos específicos para o modal (pode ser diferente)
export interface ModalRoundCreationParams {
  numeroMaximo: number;
  taxaEntrada: string;
  timeoutHoras?: number; // opcional no modal
  timeout?: number; // fallback
  padroesVitoria: {
    linha: boolean;
    coluna: boolean;
    diagonal: boolean;
    cartelaCompleta: boolean;
  };
}

// Tipos para conversão entre modal e hook
export interface ContractRoundParams {
  numeroMaximo: number;
  taxaEntrada: bigint; // em wei para o contrato
  timeoutRodada: bigint; // em segundos
  padroesVitoria: boolean[]; // array de 4 booleans
}



// Tipo para rodadas ativas
export interface ActiveRound {
  id: bigint;
  estado: EstadoRodada;
  numeroMaximo: number;
  taxaEntrada: bigint;
  premioTotal: bigint;
  timestampInicio: bigint;
  timeoutRodada: bigint;
  numerosSorteados: number[];
  participantes: number;
}

// Tipo para cartelas
export interface BingoCard {
  id: string;
  cartela?: readonly [bigint, number, number, string, boolean, boolean, boolean, bigint];
  numeros?: number[];
  card_data: { 
    numbers: number[];
  };
  rows: number;
  columns: number;
  hasNumbers?: boolean;
  emUso?: boolean;
  foiGasta?: boolean;
  preco?: bigint;
}

// Tipos para estatísticas
export interface GameStats {
  totalRounds: number;
  activeRounds: number;
  totalParticipants: number;
  totalPrize: bigint;
}

// Tipos para criação de cartelas
export interface CardCreationParams {
  rows: number;
  columns: number;
}

// Tipos para participação em rodadas
export interface ParticipationParams {
  rodadaId: bigint;
  cartelaId: bigint;
  taxaEntrada: bigint;
}

// Utilitários de conversão
export class GameTypeConverter {
  static modalToHook(modal: ModalRoundCreationParams): RoundCreationParams {
    return {
      numeroMaximo: modal.numeroMaximo,
      taxaEntrada: modal.taxaEntrada,
      timeoutHoras: modal.timeoutHoras || modal.timeout || 1,
      padroesVitoria: modal.padroesVitoria
    };
  }

  static hookToContract(hook: RoundCreationParams): ContractRoundParams {
    return {
      numeroMaximo: hook.numeroMaximo,
      taxaEntrada: BigInt(Math.floor(parseFloat(hook.taxaEntrada) * 1e18)), // ETH to wei
      timeoutRodada: BigInt(hook.timeoutHoras * 3600), // horas to segundos
      padroesVitoria: [
        hook.padroesVitoria.linha,
        hook.padroesVitoria.coluna,
        hook.padroesVitoria.diagonal,
        hook.padroesVitoria.cartelaCompleta
      ]
    };
  }

  static contractToDisplay(contract: ContractRoundParams): RoundCreationParams {
    return {
      numeroMaximo: contract.numeroMaximo,
      taxaEntrada: (Number(contract.taxaEntrada) / 1e18).toFixed(4),
      timeoutHoras: Number(contract.timeoutRodada) / 3600,
      padroesVitoria: {
        linha: contract.padroesVitoria[0],
        coluna: contract.padroesVitoria[1],
        diagonal: contract.padroesVitoria[2],
        cartelaCompleta: contract.padroesVitoria[3]
      }
    };
  }
}







// types/game-types.ts - Tipos e constantes centralizadas do jogo

// ========================================
// ENUMS E CONSTANTES
// ========================================

export enum EstadoRodada {
  INATIVA = 0,
  ABERTA = 1,
  SORTEANDO = 2,
  FINALIZADA = 3,
  CANCELADA = 4
}

export enum PadraoVitoria {
  LINHA = 0,
  COLUNA = 1,
  DIAGONAL = 2,
  CARTELA_COMPLETA = 3
}

// Constantes do jogo
export const GAME_CONSTANTS = {
  MIN_NUMERO_MAXIMO: 10,
  MAX_NUMERO_MAXIMO: 99,
  MIN_TAXA_ENTRADA: "0.001", // ETH
  MAX_TAXA_ENTRADA: "1", // ETH
  MIN_TIMEOUT_HORAS: 0.5, // 30 minutos
  MAX_TIMEOUT_HORAS: 24, // 24 horas
  DEFAULT_PADROES_VITORIA: {
    linha: true,
    coluna: true,
    diagonal: true,
    cartelaCompleta: false
  }
} as const;

// ========================================
// TIPOS DE DADOS
// ========================================

// Tipo para rodada ativa (blockchain)
export interface ActiveRound {
  id: bigint;
  estado: EstadoRodada;
  numeroMaximo: number;
  taxaEntrada: bigint;
  premioTotal: bigint;
  timestampInicio: bigint;
  timeoutRodada: bigint;
  numerosSorteados: number[];
  participantes: number;
}

// Tipo para estatísticas do jogo
export interface GameStats {
  totalRounds: number;
  activeRounds: number;
  totalParticipants: number;
  totalPrize: bigint;
}

// Tipo para padrões de vitória
export interface PadroesVitoria {
  linha: boolean;
  coluna: boolean;
  diagonal: boolean;
  cartelaCompleta: boolean;
}

// Tipo para configuração de rodada
export interface RoundConfig {
  numeroMaximo: number;
  taxaEntrada: string; // em ETH
  timeoutHoras: number;
  padroesVitoria: PadroesVitoria;
}

// ========================================
// MAPEAMENTO DE ERROS CUSTOMIZADOS
// ========================================

export const CONTRACT_ERRORS = {
  '0x1f6a65b6': 'OnlyOperatorCanFulfill - Apenas operadores podem executar esta ação',
  '0x': 'Erro desconhecido do contrato'
} as const;

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

export function getEstadoTexto(estado: number): string {
  switch (estado) {
    case EstadoRodada.INATIVA:
      return "Inativa";
    case EstadoRodada.ABERTA:
      return "Aberta";
    case EstadoRodada.SORTEANDO:
      return "Sorteando";
    case EstadoRodada.FINALIZADA:
      return "Finalizada";
    case EstadoRodada.CANCELADA:
      return "Cancelada";
    default:
      return "Desconhecido";
  }
}

export function getEstadoCor(estado: number): string {
  switch (estado) {
    case EstadoRodada.ABERTA:
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case EstadoRodada.SORTEANDO:
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case EstadoRodada.FINALIZADA:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    case EstadoRodada.CANCELADA:
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

export function decodeContractError(errorMessage: string): string {
  // Procurar por erros customizados conhecidos
  for (const [code, description] of Object.entries(CONTRACT_ERRORS)) {
    if (errorMessage.includes(code)) {
      return description;
    }
  }
  
  // Outros erros comuns
  if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
    return 'Transação cancelada pelo usuário';
  }
  if (errorMessage.includes('insufficient funds')) {
    return 'ETH insuficiente para pagar o gas';
  }
  if (errorMessage.includes('execution reverted')) {
    return 'Transação rejeitada pelo contrato';
  }
  
  return errorMessage;
}