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

// Estados de rodada
export enum EstadoRodada {
  INATIVA = 0,
  ABERTA = 1,
  SORTEANDO = 2,
  FINALIZADA = 3,
  CANCELADA = 4
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

// Constantes do jogo
export const GAME_CONSTANTS = {
  MIN_NUMERO_MAXIMO: 10,
  MAX_NUMERO_MAXIMO: 99,
  MIN_TAXA_ENTRADA: "0.001", // ETH
  MAX_TAXA_ENTRADA: "10.0", // ETH
  MIN_TIMEOUT_HORAS: 0.5,
  MAX_TIMEOUT_HORAS: 24,
  DEFAULT_PADROES_VITORIA: {
    linha: true,
    coluna: true,
    diagonal: true,
    cartelaCompleta: false
  }
} as const;