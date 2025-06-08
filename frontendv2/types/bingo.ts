// types/bingo.ts - Definições de tipos atualizadas

export interface PremioConfig {
  tipo: 'automatico' | 'fixo' | 'hibrido'
  premioMinimo: string  // ETH como string
  percentualCasa: number  // 0-50%
  distribuicaoPadroes: {
    linha: number      // %
    coluna: number     // %
    diagonal: number   // %
    cartelaCompleta: number // %
  }
}

export interface PadroesVitoria {
  linha: boolean
  coluna: boolean
  diagonal: boolean
  cartelaCompleta: boolean
}

export interface RoundCreationParams {
  // Identificação
  name: string
  description: string
  
  // Configurações técnicas
  numeroMaximo: number
  taxaEntrada: string
  timeoutHoras: number
  
  // ✅ NOVA: Configurações de prêmio
  premioConfig: PremioConfig
  
  // Padrões de vitória
  padroesVitoria: PadroesVitoria
}

// Tipo para dados salvos no Supabase
export interface CustomRoundSupabase {
  id: string
  name: string
  description?: string
  numero_maximo: number
  taxa_entrada: number
  timeout_horas: number
  padroes_vitoria: PadroesVitoria
  premio_config: PremioConfig  // ✅ NOVA
  creator_address?: string
  blockchain_created: boolean
  blockchain_round_id?: number
  created_at: string
  updated_at: string
}

// Tipo para rodadas ativas da blockchain
export interface ActiveRoundBlockchain {
  id: bigint
  estado: number
  numeroMaximo: number
  taxaEntrada: bigint
  premioTotal: bigint
  timestampInicio: bigint
  timeoutRodada: bigint
  numerosSorteados: number[]
  participantes: number
}

// Tipo híbrido (blockchain + supabase)
export interface EnhancedActiveRound extends ActiveRoundBlockchain {
  // Dados extras do Supabase (se disponíveis)
  customData?: {
    name: string
    description?: string
    premioConfig: PremioConfig
    creatorAddress?: string
  }
  
  // Helpers computados
  hasCustomData: boolean
  displayName: string
  premioEstimado: number  // ETH
  premioDistribuicao: {
    totalVencedores: number  // ETH
    taxaCasa: number        // ETH
    porPadrao: Record<keyof PadroesVitoria, number> // ETH por padrão
  }
}

// Estados de criação de rodada
export type CreationStep = 'idle' | 'preparing' | 'signing' | 'mining' | 'saving' | 'success' | 'error'

// Configurações padrão
export const DEFAULT_PREMIO_CONFIG: PremioConfig = {
  tipo: 'automatico',
  premioMinimo: "0",
  percentualCasa: 10,
  distribuicaoPadroes: {
    linha: 25,
    coluna: 25,
    diagonal: 25,
    cartelaCompleta: 25
  }
}

export const DEFAULT_PADROES_VITORIA: PadroesVitoria = {
  linha: true,
  coluna: true,
  diagonal: true,
  cartelaCompleta: false
}

// Funções utilitárias para cálculos de prêmio
export const calcularPremio = (
  taxaEntrada: number,
  participantes: number,
  config: PremioConfig
): {
  totalArrecadado: number
  taxaCasa: number
  premioLiquido: number
  premioFinal: number
} => {
  const totalArrecadado = taxaEntrada * participantes
  const taxaCasa = totalArrecadado * (config.percentualCasa / 100)
  const premioLiquido = totalArrecadado - taxaCasa
  const premioMinimo = parseFloat(config.premioMinimo)
  
  const premioFinal = config.tipo === 'fixo' ? premioMinimo :
                     config.tipo === 'hibrido' ? Math.max(premioMinimo, premioLiquido) :
                     premioLiquido
  
  return {
    totalArrecadado,
    taxaCasa,
    premioLiquido,
    premioFinal
  }
}

export const calcularDistribuicaoPorPadrao = (
  premioTotal: number,
  config: PremioConfig,
  padroesAtivos: PadroesVitoria
): Record<keyof PadroesVitoria, number> => {
  const distribuicao: Record<keyof PadroesVitoria, number> = {
    linha: 0,
    coluna: 0,
    diagonal: 0,
    cartelaCompleta: 0
  }
  
  Object.entries(padroesAtivos).forEach(([padrao, ativo]) => {
    if (ativo) {
      const percentual = config.distribuicaoPadroes[padrao as keyof PadroesVitoria]
      distribuicao[padrao as keyof PadroesVitoria] = premioTotal * (percentual / 100)
    }
  })
  
  return distribuicao
}

// Validações
export const validarPremioConfig = (config: PremioConfig): string[] => {
  const erros: string[] = []
  
  if (config.percentualCasa < 0 || config.percentualCasa > 50) {
    erros.push('Taxa da casa deve estar entre 0% e 50%')
  }
  
  if ((config.tipo === 'fixo' || config.tipo === 'hibrido') && 
      parseFloat(config.premioMinimo) <= 0) {
    erros.push('Prêmio mínimo deve ser maior que 0 para este tipo')
  }
  
  const totalDistribuicao = Object.values(config.distribuicaoPadroes).reduce((sum, val) => sum + val, 0)
  if (totalDistribuicao !== 100) {
    erros.push('A distribuição do prêmio deve somar exatamente 100%')
  }
  
  return erros
}