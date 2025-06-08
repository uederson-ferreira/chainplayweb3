//Local: components/bingo/CreateRoundModal.tsx
//Descrição: Modal completo com formulário e validações
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X, Trophy, Clock, Users, AlertCircle, Info, Loader2 } from "lucide-react"
import { parseEther, formatEther } from "viem"

// ========================================
// TIPOS CORRIGIDOS E UNIFICADOS
// ========================================
export interface PremioConfig {
  tipo: 'automatico' | 'fixo' | 'hibrido'
  premioMinimo?: string // em ETH
  percentualCasa: number // 0-50%
  distribuicaoPadroes: {
    linha: number
    coluna: number 
    diagonal: number
    cartela_completa: number // ← CORRIGIDO: era cartelaCompleta
  }
}

export interface PadroesVitoria {
  linha: boolean
  coluna: boolean
  diagonal: boolean
  cartela_completa: boolean // ← CORRIGIDO: era cartelaCompleta
}

export interface RoundCreationParams {
  // Identificação
  nome: string
  descricao: string
  
  // Configurações básicas
  numeroMaximo: number
  taxaEntrada: string // em ETH
  duracaoHoras: number
  
  // Prêmios (CORRIGIDO: tipo unificado)
  premioConfig: PremioConfig
  
  // Padrões de vitória (CORRIGIDO: tipo unificado)
  padroesVitoria: PadroesVitoria
}

interface CreateRoundModalProps {
  onClose: () => void
  onCreateRound: (params: RoundCreationParams) => Promise<void>
  isCreating?: boolean
  currentStep?: string
  progress?: number
}

export default function CreateRoundModal({ 
  onClose, 
  onCreateRound, 
  isCreating = false,
  currentStep = 'idle',
  progress = 0
}: CreateRoundModalProps) {
  // Estados do formulário
  const [params, setParams] = useState<RoundCreationParams>({
    nome: "",
    descricao: "",
    numeroMaximo: 75,
    taxaEntrada: "0.01",
    duracaoHoras: 1,
    premioConfig: {
      tipo: 'automatico',
      percentualCasa: 10,
      distribuicaoPadroes: {
        linha: 25,
        coluna: 25,
        diagonal: 25,
        cartela_completa: 25 // ← CORRIGIDO
      }
    },
    padroesVitoria: {
      linha: true,
      coluna: true,
      diagonal: true,
      cartela_completa: false // ← CORRIGIDO
    }
  })

  // Estados de validação
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-distribuição quando padrões mudam
  useEffect(() => {
    const padroes = params.padroesVitoria
    const ativos = Object.values(padroes).filter(Boolean).length
    
    if (ativos > 0) {
      const porcentagemPorPadrao = Math.floor(100 / ativos)
      const resto = 100 - (porcentagemPorPadrao * ativos)
      
      setParams(prev => ({
        ...prev,
        premioConfig: {
          ...prev.premioConfig,
          distribuicaoPadroes: {
            linha: padroes.linha ? porcentagemPorPadrao + (resto > 0 ? 1 : 0) : 0,
            coluna: padroes.coluna ? porcentagemPorPadrao + (resto > 1 ? 1 : 0) : 0,
            diagonal: padroes.diagonal ? porcentagemPorPadrao + (resto > 2 ? 1 : 0) : 0,
            cartela_completa: padroes.cartela_completa ? porcentagemPorPadrao : 0 // ← CORRIGIDO
          }
        }
      }))
    }
  }, [params.padroesVitoria])

  // Validações
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!params.nome.trim()) newErrors.nome = "Nome é obrigatório"
    if (params.numeroMaximo < 10 || params.numeroMaximo > 99) newErrors.numeroMaximo = "Deve estar entre 10 e 99"
    if (!params.taxaEntrada || parseFloat(params.taxaEntrada) <= 0) newErrors.taxaEntrada = "Taxa deve ser maior que 0"
    if (params.duracaoHoras < 0.5 || params.duracaoHoras > 24) newErrors.duracaoHoras = "Duração entre 30min e 24h"
    
    // Validar prêmio mínimo para tipos fixo/híbrido
    if ((params.premioConfig.tipo === 'fixo' || params.premioConfig.tipo === 'hibrido') && 
        (!params.premioConfig.premioMinimo || parseFloat(params.premioConfig.premioMinimo) <= 0)) {
      newErrors.premioMinimo = "Prêmio mínimo obrigatório para este tipo"
    }
    
    // Validar distribuição soma 100%
    const total = Object.values(params.premioConfig.distribuicaoPadroes).reduce((a, b) => a + b, 0)
    if (total !== 100) newErrors.distribuicao = "Distribuição deve somar 100%"
    
    // Validar pelo menos um padrão ativo
    if (!Object.values(params.padroesVitoria).some(Boolean)) {
      newErrors.padroes = "Pelo menos um padrão deve estar ativo"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Simulação de prêmio
  const calcularSimulacao = () => {
    const participantes = 10
    const taxaTotal = parseEther(params.taxaEntrada) * BigInt(participantes)
    const taxaCasa = taxaTotal * BigInt(params.premioConfig.percentualCasa) / BigInt(100)
    const premioLiquido = taxaTotal - taxaCasa
    
    let premioFinal = premioLiquido
    
    if (params.premioConfig.tipo === 'fixo' && params.premioConfig.premioMinimo) {
      premioFinal = parseEther(params.premioConfig.premioMinimo)
    } else if (params.premioConfig.tipo === 'hibrido' && params.premioConfig.premioMinimo) {
      const minimo = parseEther(params.premioConfig.premioMinimo)
      premioFinal = premioLiquido > minimo ? premioLiquido : minimo
    }
    
    return {
      taxaTotal: formatEther(taxaTotal),
      taxaCasa: formatEther(taxaCasa),
      premioFinal: formatEther(premioFinal),
      participantes
    }
  }

  const simulacao = calcularSimulacao()

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      await onCreateRound(params)
    } catch (error) {
      console.error('Erro ao criar rodada:', error)
    }
  }

  // Steps do progresso
  const getStepText = () => {
    switch (currentStep) {
      case 'preparing': return 'Preparando transação...'
      case 'signing': return 'Aguardando assinatura...'
      case 'mining': return 'Processando na blockchain...'
      case 'saving': return 'Salvando dados...'
      case 'success': return 'Rodada criada com sucesso!'
      default: return 'Criar Rodada'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">Nova Rodada de Bingo</h2>
            <p className="text-slate-400 text-sm">Configure sua rodada personalizada</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isCreating}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Progress Bar (quando criando) */}
          {isCreating && (
            <Card className="bg-blue-900/50 border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                  <span className="text-blue-200 font-medium">{getStepText()}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-blue-300 text-xs mt-1">{progress}% concluído</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Coluna Esquerda - Configurações */}
            <div className="space-y-6">
              
              {/* 1. Identificação */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center">
                    <Trophy className="h-4 w-4 mr-2 text-yellow-400" />
                    Identificação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Nome da Rodada</Label>
                    <Input
                      value={params.nome}
                      onChange={(e) => setParams(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Mega Bingo da Tarde"
                      className="bg-slate-600 border-slate-500 text-white"
                      disabled={isCreating}
                    />
                    {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome}</p>}
                  </div>
                  
                  <div>
                    <Label className="text-white">Descrição (opcional)</Label>
                    <Textarea
                      value={params.descricao}
                      onChange={(e) => setParams(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descrição da rodada..."
                      className="bg-slate-600 border-slate-500 text-white"
                      rows={2}
                      disabled={isCreating}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 2. Configurações Básicas */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-400" />
                    Configurações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Número Máximo</Label>
                      <Input
                        type="number"
                        min="10"
                        max="99"
                        value={params.numeroMaximo}
                        onChange={(e) => setParams(prev => ({ ...prev, numeroMaximo: parseInt(e.target.value) }))}
                        className="bg-slate-600 border-slate-500 text-white"
                        disabled={isCreating}
                      />
                      {errors.numeroMaximo && <p className="text-red-400 text-xs mt-1">{errors.numeroMaximo}</p>}
                    </div>
                    
                    <div>
                      <Label className="text-white">Taxa de Entrada (ETH)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={params.taxaEntrada}
                        onChange={(e) => setParams(prev => ({ ...prev, taxaEntrada: e.target.value }))}
                        className="bg-slate-600 border-slate-500 text-white"
                        disabled={isCreating}
                      />
                      {errors.taxaEntrada && <p className="text-red-400 text-xs mt-1">{errors.taxaEntrada}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-white">Duração (horas)</Label>
                    <Input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={params.duracaoHoras}
                      onChange={(e) => setParams(prev => ({ ...prev, duracaoHoras: parseFloat(e.target.value) }))}
                      className="bg-slate-600 border-slate-500 text-white"
                      disabled={isCreating}
                    />
                    {errors.duracaoHoras && <p className="text-red-400 text-xs mt-1">{errors.duracaoHoras}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* 3. Padrões de Vitória */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white">Padrões de Vitória</CardTitle>
                  <CardDescription className="text-slate-400">
                    Quais padrões serão aceitos para ganhar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: 'linha', label: 'Linha Completa' },
                    { key: 'coluna', label: 'Coluna Completa' },
                    { key: 'diagonal', label: 'Diagonal Completa' },
                    { key: 'cartela_completa', label: 'Cartela Completa' } // ← CORRIGIDO
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-white text-sm">{label}</span>
                      <Switch
                        checked={params.padroesVitoria[key as keyof typeof params.padroesVitoria]}
                        onCheckedChange={(checked) => 
                          setParams(prev => ({
                            ...prev,
                            padroesVitoria: { ...prev.padroesVitoria, [key]: checked }
                          }))
                        }
                        disabled={isCreating}
                      />
                    </div>
                  ))}
                  {errors.padroes && <p className="text-red-400 text-xs mt-2">{errors.padroes}</p>}
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita - Prêmios e Preview */}
            <div className="space-y-6">
              
              {/* 4. Configuração de Prêmios */}
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center">
                    <Trophy className="h-4 w-4 mr-2 text-yellow-400" />
                    Configuração de Prêmios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Tipo de Prêmio */}
                  <div>
                    <Label className="text-white">Tipo de Prêmio</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { value: 'automatico', label: 'Automático', desc: 'Taxas coletadas' },
                        { value: 'fixo', label: 'Fixo', desc: 'Valor garantido' },
                        { value: 'hibrido', label: 'Híbrido', desc: 'Mínimo + taxas' }
                      ].map(({ value, label, desc }) => (
                        <button
                          key={value}
                          onClick={() => setParams(prev => ({ 
                            ...prev, 
                            premioConfig: { ...prev.premioConfig, tipo: value as any }
                          }))}
                          disabled={isCreating}
                          className={`p-2 rounded text-xs text-center border transition-colors ${
                            params.premioConfig.tipo === value
                              ? 'bg-blue-500 border-blue-400 text-white'
                              : 'bg-slate-600 border-slate-500 text-slate-300 hover:bg-slate-500'
                          }`}
                        >
                          <div className="font-medium">{label}</div>
                          <div className="text-xs opacity-75">{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prêmio Mínimo (para fixo/híbrido) */}
                  {(params.premioConfig.tipo === 'fixo' || params.premioConfig.tipo === 'hibrido') && (
                    <div>
                      <Label className="text-white">Prêmio Mínimo (ETH)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={params.premioConfig.premioMinimo || ''}
                        onChange={(e) => setParams(prev => ({ 
                          ...prev, 
                          premioConfig: { ...prev.premioConfig, premioMinimo: e.target.value }
                        }))}
                        className="bg-slate-600 border-slate-500 text-white"
                        disabled={isCreating}
                      />
                      {errors.premioMinimo && <p className="text-red-400 text-xs mt-1">{errors.premioMinimo}</p>}
                    </div>
                  )}

                  {/* Taxa da Casa */}
                  <div>
                    <Label className="text-white">Taxa da Casa (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={params.premioConfig.percentualCasa}
                      onChange={(e) => setParams(prev => ({ 
                        ...prev, 
                        premioConfig: { ...prev.premioConfig, percentualCasa: parseInt(e.target.value) }
                      }))}
                      className="bg-slate-600 border-slate-500 text-white"
                      disabled={isCreating}
                    />
                  </div>

                  {/* Distribuição por Padrão */}
                  <div>
                    <Label className="text-white">Distribuição por Padrão (%)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { key: 'linha', label: 'Linha' },
                        { key: 'coluna', label: 'Coluna' },
                        { key: 'diagonal', label: 'Diagonal' },
                        { key: 'cartela_completa', label: 'Cartela' } // ← CORRIGIDO
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <Label className="text-xs text-slate-400">{label}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={params.premioConfig.distribuicaoPadroes[key as keyof typeof params.premioConfig.distribuicaoPadroes]}
                            onChange={(e) => setParams(prev => ({ 
                              ...prev, 
                              premioConfig: { 
                                ...prev.premioConfig, 
                                distribuicaoPadroes: { 
                                  ...prev.premioConfig.distribuicaoPadroes, 
                                  [key]: parseInt(e.target.value) 
                                }
                              }
                            }))}
                            className="bg-slate-600 border-slate-500 text-white text-xs"
                            disabled={isCreating}
                          />
                        </div>
                      ))}
                    </div>
                    {errors.distribuicao && <p className="text-red-400 text-xs mt-1">{errors.distribuicao}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* 5. Preview da Simulação */}
              <Card className="bg-green-900/20 border-green-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center">
                    <Users className="h-4 w-4 mr-2 text-green-400" />
                    Simulação (10 participantes)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Taxa Total:</span>
                      <p className="text-white font-medium">{simulacao.taxaTotal} ETH</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Taxa Casa:</span>
                      <p className="text-white font-medium">{simulacao.taxaCasa} ETH</p>
                    </div>
                  </div>
                  <div className="border-t border-green-700 pt-3">
                    <span className="text-green-400">Prêmio Final:</span>
                    <p className="text-white font-bold text-lg">{simulacao.premioFinal} ETH</p>
                  </div>
                  
                  <div className="bg-blue-900/30 p-3 rounded border border-blue-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-3 w-3 text-blue-400" />
                      <span className="text-blue-400 text-xs font-medium">Tipo: {params.premioConfig.tipo}</span>
                    </div>
                    <p className="text-blue-200 text-xs">
                      {params.premioConfig.tipo === 'automatico' && 'Prêmio = taxas coletadas - taxa da casa'}
                      {params.premioConfig.tipo === 'fixo' && 'Prêmio = valor fixo garantido'}
                      {params.premioConfig.tipo === 'hibrido' && 'Prêmio = maior entre mínimo e (taxas - casa)'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {getStepText()}
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4 mr-2" />
                  Criar Rodada
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}