// components/bingo/utils/gameHelpers.ts

import { ESTADO_TEXTOS, ESTADO_CORES, RODADA_ESTADOS } from './gameConstants';

// ========================================
// FUNÇÕES DE ESTADO DAS RODADAS
// ========================================

export function getEstadoTexto(estado: number): string {
  return ESTADO_TEXTOS[estado as keyof typeof ESTADO_TEXTOS] || "Desconhecido";
}

export function getEstadoCor(estado: number): string {
  return ESTADO_CORES[estado as keyof typeof ESTADO_CORES] || ESTADO_CORES[RODADA_ESTADOS.INATIVA];
}

// ========================================
// GERAÇÃO DE NÚMEROS ÚNICOS PARA CARTELAS
// ========================================

export function generateUniqueNumbers(count: number, min: number = 1, max: number = 99): number[] {
  if (count > (max - min + 1)) {
    throw new Error(`Não é possível gerar ${count} números únicos entre ${min} e ${max}`);
  }
  
  const numbers = new Set<number>();
  
  while (numbers.size < count) {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(randomNumber);
  }
  
  return Array.from(numbers);
}

// ========================================
// FORMATAÇÃO DE ERROS
// ========================================

export function formatErrorMessage(error: any): { title: string; message: string } {
  console.log('🔍 Formatando erro:', error);
  
  // Extrair mensagem do erro
  const errorMessage = error?.message || error?.toString() || 'Erro desconhecido';
  
  // Padrões de erro conhecidos
  if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
    return {
      title: "Transação cancelada",
      message: "Você cancelou a transação na MetaMask"
    };
  }
  
  if (errorMessage.includes('insufficient funds')) {
    return {
      title: "Saldo insuficiente", 
      message: "ETH insuficiente para pagar o gas da transação"
    };
  }
  
  if (errorMessage.includes('execution reverted')) {
    return {
      title: "Transação rejeitada",
      message: "Transação rejeitada pelo contrato - verifique as condições"
    };
  }
  
  if (errorMessage.includes('operador') || errorMessage.includes('operator')) {
    return {
      title: "Sem permissão",
      message: "Você precisa ser operador para esta ação"
    };
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('conexão')) {
    return {
      title: "Erro de rede",
      message: "Verifique sua conexão com a blockchain"
    };
  }
  
  if (errorMessage.includes('timeout')) {
    return {
      title: "Timeout",
      message: "Operação demorou muito para completar"
    };
  }
  
  // Erro genérico
  return {
    title: "Erro na transação",
    message: errorMessage.slice(0, 100) // Limitar tamanho da mensagem
  };
}

// ========================================
// UTILITÁRIOS DE FORMATAÇÃO
// ========================================

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(4);
}

export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

export function formatDuration(seconds: bigint): string {
  const totalSeconds = Number(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ========================================
// VALIDAÇÕES
// ========================================

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidBigInt(value: any): boolean {
  try {
    BigInt(value);
    return true;
  } catch {
    return false;
  }
}

// ========================================
// UTILITÁRIOS DE CARTELA
// ========================================

export function validateCartelaDimensions(rows: number, columns: number): { valid: boolean; error?: string } {
  if (rows < 3 || rows > 10) {
    return { valid: false, error: 'Linhas devem estar entre 3 e 10' };
  }
  
  if (columns < 3 || columns > 10) {
    return { valid: false, error: 'Colunas devem estar entre 3 e 10' };
  }
  
  if (rows * columns > 255) {
    return { valid: false, error: 'Cartela muito grande (máximo 255 células)' };
  }
  
  return { valid: true };
}

export function calculateCartelaPrice(rows: number, columns: number, basePrice: bigint): bigint {
  const cellCount = rows * columns;
  const multiplier = Math.max(1, Math.floor(cellCount / 25)); // Multiplicador baseado no tamanho
  return basePrice * BigInt(multiplier);
}

// ========================================
// UTILITÁRIOS DE RODADA
// ========================================

export function isRodadaAtiva(estado: number): boolean {
  return estado === RODADA_ESTADOS.ABERTA || estado === RODADA_ESTADOS.SORTEANDO;
}

export function isRodadaFinalizada(estado: number): boolean {
  return estado === RODADA_ESTADOS.FINALIZADA || estado === RODADA_ESTADOS.CANCELADA;
}

export function canJoinRodada(estado: number): boolean {
  return estado === RODADA_ESTADOS.ABERTA;
}

export function canDrawNumber(estado: number): boolean {
  return estado === RODADA_ESTADOS.ABERTA || estado === RODADA_ESTADOS.SORTEANDO;
}

// ========================================
// UTILITÁRIOS DE TEMPO
// ========================================

export function isRodadaExpired(timestampInicio: bigint, timeoutRodada: bigint): boolean {
  const now = Math.floor(Date.now() / 1000);
  const expiry = Number(timestampInicio) + Number(timeoutRodada);
  return now > expiry;
}

export function getTimeRemaining(timestampInicio: bigint, timeoutRodada: bigint): number {
  const now = Math.floor(Date.now() / 1000);
  const expiry = Number(timestampInicio) + Number(timeoutRodada);
  return Math.max(0, expiry - now);
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expirado';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ========================================
// UTILITÁRIOS DE DEBUG
// ========================================

export function logTransactionInfo(hash: string, type: string) {
  console.log(`📋 ${type} Transaction:`, {
    hash,
    explorerUrl: `https://etherscan.io/tx/${hash}`,
    timestamp: new Date().toISOString()
  });
}

export function logContractCall(contractName: string, functionName: string, args: any[]) {
  console.log(`📞 Contract Call - ${contractName}.${functionName}:`, {
    args,
    timestamp: new Date().toISOString()
  });
}