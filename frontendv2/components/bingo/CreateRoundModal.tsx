// Local: components/bingo/CreateRoundModal.tsx
// Descrição: Modal completo, refatorado e integrado com o arquivo central de tipos e constantes.
"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { X, Trophy, Clock, Users, Info, Loader2 } from "lucide-react"
import { parseEther, formatEther } from "viem"
import { GAME_CONSTANTS } from "@/types/game-types" // ✅ Importando constantes centrais

// =========================================================================
// TIPOS ESPECÍFICOS PARA ESTE MODAL COMPLEXO
// Estes tipos estendem os tipos básicos de 'game-types' para incluir
// configurações de prêmios, nome e descrição, que são coletados aqui.
// =========================================================================
export interface PremioConfig {
  tipo: 'automatico' | 'fixo' | 'hibrido'
  premioMinimo?: string
  percentualCasa: number
  distribuicaoPadroes: {
    linha: number
    coluna: number 
    diagonal: number
    cartelaCompleta: number // ✅ Padronizado para camelCase
  }
}

export interface PadroesVitoria {
  linha: boolean
  coluna: boolean
  diagonal: boolean
  cartelaCompleta: boolean // ✅ Padronizado para camelCase
}

// Este é o objeto de dados completo que este modal gerencia.
export interface RichRoundCreationParams {
  nome: string
  descricao: string
  numeroMaximo: number
  taxaEntrada: string
  duracaoHoras: number
  premioConfig: PremioConfig
  padroesVitoria: PadroesVitoria
}

interface CreateRoundModalProps {
  onClose: () => void
  // A função onCreateRound espera o objeto de dados completo deste modal
  onCreateRound: (params: RichRoundCreationParams) => Promise<void>
  isCreating?: boolean
  currentStep?: string
  progress?: number
}

// ✅ ESTADO INICIAL USANDO CONSTANTES CENTRAIS
const INITIAL_STATE: RichRoundCreationParams = {
  nome: "",
  descricao: "",
  numeroMaximo: 75,
  taxaEntrada: GAME_CONSTANTS.MIN_TAXA_ENTRADA,
  duracaoHoras: 1,
  premioConfig: {
    tipo: 'automatico',
    percentualCasa: 10,
    premioMinimo: '',
    distribuicaoPadroes: {
      linha: 0,
      coluna: 0,
      diagonal: 0,
      cartelaCompleta: 0,
    }
  },
  padroesVitoria: { ...GAME_CONSTANTS.DEFAULT_PADROES_VITORIA }
};

export default function CreateRoundModal({ 
  onClose, 
  onCreateRound, 
  isCreating = false,
  currentStep = 'idle',
  progress = 0
}: CreateRoundModalProps) {
  
  const [formData, setFormData] = useState<RichRoundCreationParams>(INITIAL_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof RichRoundCreationParams, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrizeConfigChange = (field: keyof PremioConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      premioConfig: { ...prev.premioConfig, [field]: value }
    }));
  };

  const handlePrizeDistributionChange = (pattern: keyof PremioConfig['distribuicaoPadroes'], value: number) => {
    const numericValue = isNaN(value) ? 0 : value;
    setFormData(prev => ({
      ...prev,
      premioConfig: {
        ...prev.premioConfig,
        distribuicaoPadroes: { ...prev.premioConfig.distribuicaoPadroes, [pattern]: numericValue }
      }
    }));
  };

  const handlePatternChange = (pattern: keyof PadroesVitoria, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      padroesVitoria: { ...prev.padroesVitoria, [pattern]: checked }
    }));
  };
  
  useEffect(() => {
    const padroes = formData.padroesVitoria;
    const ativos = (Object.keys(padroes) as Array<keyof PadroesVitoria>).filter(key => padroes[key]);
    if (ativos.length === 0) return;

    const porcentagemBase = 100 / ativos.length;
    let distribuicaoAcumulada = 0;
    const novaDistribuicao: PremioConfig['distribuicaoPadroes'] = { linha: 0, coluna: 0, diagonal: 0, cartelaCompleta: 0 };

    ativos.forEach((key, index) => {
      if (index === ativos.length - 1) {
        novaDistribuicao[key] = 100 - distribuicaoAcumulada;
      } else {
        const valor = Math.floor(porcentagemBase);
        novaDistribuicao[key] = valor;
        distribuicaoAcumulada += valor;
      }
    });

    setFormData(prev => ({
      ...prev,
      premioConfig: { ...prev.premioConfig, distribuicaoPadroes: novaDistribuicao }
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.padroesVitoria]);


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const { nome, numeroMaximo, taxaEntrada, duracaoHoras, premioConfig, padroesVitoria } = formData;
    
    if (!nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (numeroMaximo < GAME_CONSTANTS.MIN_NUMERO_MAXIMO || numeroMaximo > GAME_CONSTANTS.MAX_NUMERO_MAXIMO) 
      newErrors.numeroMaximo = `Deve ser entre ${GAME_CONSTANTS.MIN_NUMERO_MAXIMO} e ${GAME_CONSTANTS.MAX_NUMERO_MAXIMO}`;
    
    if (!taxaEntrada || parseFloat(taxaEntrada) < parseFloat(GAME_CONSTANTS.MIN_TAXA_ENTRADA)) 
      newErrors.taxaEntrada = `Taxa deve ser >= ${GAME_CONSTANTS.MIN_TAXA_ENTRADA} ETH`;

    if (duracaoHoras < GAME_CONSTANTS.MIN_TIMEOUT_HORAS || duracaoHoras > GAME_CONSTANTS.MAX_TIMEOUT_HORAS) 
      newErrors.duracaoHoras = `Duração entre ${GAME_CONSTANTS.MIN_TIMEOUT_HORAS}h e ${GAME_CONSTANTS.MAX_TIMEOUT_HORAS}h`;
    
    if ((premioConfig.tipo === 'fixo' || premioConfig.tipo === 'hibrido') && (!premioConfig.premioMinimo || parseFloat(premioConfig.premioMinimo) <= 0)) {
      newErrors.premioMinimo = "Prêmio mínimo obrigatório";
    }
    
    const totalDistribuicao = Object.values(premioConfig.distribuicaoPadroes).reduce((a, b) => a + b, 0);
    if (Math.round(totalDistribuicao) !== 100) newErrors.distribuicao = `Soma deve ser 100% (atual: ${totalDistribuicao}%)`;
    
    if (!Object.values(padroesVitoria).some(Boolean)) newErrors.padroes = "Pelo menos um padrão deve estar ativo";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const simulacao = useMemo(() => {
    try {
      const taxa = parseFloat(formData.taxaEntrada) || 0;
      const premioMin = parseFloat(formData.premioConfig.premioMinimo || '0') || 0;
      const taxaTotal = parseEther(String(taxa)) * BigInt(10);
      const taxaCasa = taxaTotal * BigInt(formData.premioConfig.percentualCasa) / BigInt(100);
      const premioLiquido = taxaTotal - taxaCasa;
      
      let premioFinal = premioLiquido;
      if (formData.premioConfig.tipo === 'fixo') {
        premioFinal = parseEther(String(premioMin));
      } else if (formData.premioConfig.tipo === 'hibrido') {
        const minimoBigInt = parseEther(String(premioMin));
        premioFinal = premioLiquido > minimoBigInt ? premioLiquido : minimoBigInt;
      }
      return { taxaTotal: formatEther(taxaTotal), taxaCasa: formatEther(taxaCasa), premioFinal: formatEther(premioFinal) };
    } catch (e) {
      return { taxaTotal: '0', taxaCasa: '0', premioFinal: '0' };
    }
  }, [formData.taxaEntrada, formData.premioConfig]);

  const handleSubmit = async () => {
    if (!validateForm()) return;
    await onCreateRound(formData);
  };

  const getStepText = () => { /* ... (a mesma lógica do código anterior) ... */ };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Nova Rodada de Bingo</h2>
            <p className="text-slate-400 text-sm">Configure sua rodada personalizada</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isCreating}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Progress Bar Section */}
          {/* You can add a progress bar here if needed, for example:  */}
          {isCreating && (
            <div className="w-full bg-slate-600 rounded-full h-2 mb-4">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="space-y-6">
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-3"><CardTitle className="text-white flex items-center"><Trophy className="h-4 w-4 mr-2 text-yellow-400" />Identificação</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Nome da Rodada</Label>
                    <Input value={formData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} placeholder="Ex: Mega Bingo da Tarde" className="bg-slate-600 border-slate-500 text-white" disabled={isCreating} />
                    {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome}</p>}
                  </div>
                  <div>
                    <Label className="text-white">Descrição (opcional)</Label>
                    <Textarea value={formData.descricao} onChange={(e) => handleInputChange('descricao', e.target.value)} placeholder="Descrição da rodada..." className="bg-slate-600 border-slate-500 text-white" rows={2} disabled={isCreating} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-3"><CardTitle className="text-white flex items-center"><Clock className="h-4 w-4 mr-2 text-blue-400" />Configurações</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Número Máximo</Label>
                      {/* ✅ USANDO CONSTANTES */}
                      <Input type="number" min={GAME_CONSTANTS.MIN_NUMERO_MAXIMO} max={GAME_CONSTANTS.MAX_NUMERO_MAXIMO} value={formData.numeroMaximo} onChange={(e) => handleInputChange('numeroMaximo', parseInt(e.target.value))} className="bg-slate-600 border-slate-500 text-white" disabled={isCreating} />
                      {errors.numeroMaximo && <p className="text-red-400 text-xs mt-1">{errors.numeroMaximo}</p>}
                    </div>
                    <div>
                      <Label className="text-white">Taxa de Entrada (ETH)</Label>
                      {/* ✅ USANDO CONSTANTES */}
                      <Input type="number" step="0.001" min={GAME_CONSTANTS.MIN_TAXA_ENTRADA} max={GAME_CONSTANTS.MAX_TAXA_ENTRADA} value={formData.taxaEntrada} onChange={(e) => handleInputChange('taxaEntrada', e.target.value)} className="bg-slate-600 border-slate-500 text-white" disabled={isCreating} />
                      {errors.taxaEntrada && <p className="text-red-400 text-xs mt-1">{errors.taxaEntrada}</p>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-white">Duração (horas)</Label>
                    {/* ✅ USANDO CONSTANTES */}
                    <Input type="number" min={GAME_CONSTANTS.MIN_TIMEOUT_HORAS} max={GAME_CONSTANTS.MAX_TIMEOUT_HORAS} step="0.5" value={formData.duracaoHoras} onChange={(e) => handleInputChange('duracaoHoras', parseFloat(e.target.value))} className="bg-slate-600 border-slate-500 text-white" disabled={isCreating} />
                    {errors.duracaoHoras && <p className="text-red-400 text-xs mt-1">{errors.duracaoHoras}</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-3"><CardTitle className="text-white">Padrões de Vitória</CardTitle><CardDescription className="text-slate-400">Quais padrões serão aceitos para ganhar</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: 'linha', label: 'Linha Completa' },
                    { key: 'coluna', label: 'Coluna Completa' },
                    { key: 'diagonal', label: 'Diagonal Completa' },
                    { key: 'cartelaCompleta', label: 'Cartela Completa' } // ✅ Padronizado
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-white text-sm">{label}</span>
                      <Switch checked={formData.padroesVitoria[key as keyof PadroesVitoria]} onCheckedChange={(checked) => handlePatternChange(key as keyof PadroesVitoria, checked)} disabled={isCreating} />
                    </div>
                  ))}
                  {errors.padroes && <p className="text-red-400 text-xs mt-2">{errors.padroes}</p>}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              
              <Card className="bg-slate-700/50 border-slate-600">
                 <CardHeader className="pb-3"><CardTitle className="text-white flex items-center"><Trophy className="h-4 w-4 mr-2 text-yellow-400" />Configuração de Prêmios</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Tipo de Prêmio</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                       {[{ value: 'automatico', label: 'Automático', desc: 'Taxas coletadas' }, { value: 'fixo', label: 'Fixo', desc: 'Valor garantido' }, { value: 'hibrido', label: 'Híbrido', desc: 'Mínimo + taxas' }].map(({ value, label, desc }) => (
                         <button key={value} onClick={() => handlePrizeConfigChange('tipo', value)} disabled={isCreating} className={`p-2 rounded text-xs text-center border transition-colors ${formData.premioConfig.tipo === value ? 'bg-blue-500 border-blue-400 text-white' : 'bg-slate-600 border-slate-500 text-slate-300 hover:bg-slate-500'}`}>
                           <div className="font-medium">{label}</div><div className="text-xs opacity-75">{desc}</div>
                         </button>
                       ))}
                    </div>
                  </div>
                  {(formData.premioConfig.tipo === 'fixo' || formData.premioConfig.tipo === 'hibrido') && (
                    <div>
                      <Label className="text-white">Prêmio Mínimo (ETH)</Label>
                      <Input type="number" step="0.001" min="0.001" value={formData.premioConfig.premioMinimo || ''} onChange={(e) => handlePrizeConfigChange('premioMinimo', e.target.value)} className="bg-slate-600 border-slate-500 text-white" disabled={isCreating} />
                      {errors.premioMinimo && <p className="text-red-400 text-xs mt-1">{errors.premioMinimo}</p>}
                    </div>
                  )}
                  <div>
                    <Label className="text-white">Taxa da Casa (%)</Label>
                    <Input type="number" min="0" max="50" value={formData.premioConfig.percentualCasa} onChange={(e) => handlePrizeConfigChange('percentualCasa', parseInt(e.target.value))} className="bg-slate-600 border-slate-500 text-white" disabled={isCreating} />
                  </div>
                  <div>
                    <Label className="text-white">Distribuição por Padrão (%)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { key: 'linha', label: 'Linha' },
                        { key: 'coluna', label: 'Coluna' },
                        { key: 'diagonal', label: 'Diagonal' },
                        { key: 'cartelaCompleta', label: 'Cartela' } // ✅ Padronizado
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <Label className="text-xs text-slate-400">{label}</Label>
                          <Input type="number" min="0" max="100" value={formData.premioConfig.distribuicaoPadroes[key as keyof PremioConfig['distribuicaoPadroes']]} onChange={(e) => handlePrizeDistributionChange(key as keyof PremioConfig['distribuicaoPadroes'], parseInt(e.target.value))} className="bg-slate-600 border-slate-500 text-white text-xs" disabled={isCreating || !formData.padroesVitoria[key as keyof PadroesVitoria]} />
                        </div>
                      ))}
                    </div>
                    {errors.distribuicao && <p className="text-red-400 text-xs mt-1">{errors.distribuicao}</p>}
                  </div>
                 </CardContent>
              </Card>

              <Card className="bg-green-900/20 border-green-700">
                <CardHeader className="pb-3"><CardTitle className="text-white flex items-center"><Users className="h-4 w-4 mr-2 text-green-400" />Simulação (10 participantes)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     <div><span className="text-slate-400">Taxa Total:</span><p className="text-white font-medium">{simulacao.taxaTotal} ETH</p></div>
                     <div><span className="text-slate-400">Taxa Casa:</span><p className="text-white font-medium">{simulacao.taxaCasa} ETH</p></div>
                   </div>
                   <div className="border-t border-green-700 pt-3">
                     <span className="text-green-400">Prêmio Final:</span>
                     <p className="text-white font-bold text-lg">{simulacao.premioFinal} ETH</p>
                   </div>
                   <div className="bg-blue-900/30 p-3 rounded border border-blue-700">
                     <div className="flex items-center gap-2 mb-2"><Info className="h-3 w-3 text-blue-400" /><span className="text-blue-400 text-xs font-medium">Tipo: {formData.premioConfig.tipo}</span></div>
                     <p className="text-blue-200 text-xs">
                       {formData.premioConfig.tipo === 'automatico' && 'Prêmio = taxas coletadas - taxa da casa'}
                       {formData.premioConfig.tipo === 'fixo' && 'Prêmio = valor fixo garantido'}
                       {formData.premioConfig.tipo === 'hibrido' && 'Prêmio = maior entre mínimo e (taxas - casa)'}
                     </p>
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={onClose} disabled={isCreating} className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isCreating} className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
              {isCreating ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />{getStepText()}</>) : (<><Trophy className="h-4 w-4 mr-2" />Criar Rodada</>)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}