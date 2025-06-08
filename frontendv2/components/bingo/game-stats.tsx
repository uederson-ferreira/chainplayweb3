"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Target, Zap } from "lucide-react"

// ===== TIPOS FLEXÍVEIS PARA DIFERENTES FONTES =====

// Tipo original do Supabase
type SupabaseGameRound = {
  id: string
  round_number: number
  max_number: number
  drawn_numbers: number[]
  status: "waiting" | "active" | "finished"
  winner_id: string | null
  created_at: string
  finished_at: string | null
}

// Tipo do nosso hook Web3
type Web3ActiveRound = {
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

// Tipo unificado que aceita ambos
type UnifiedGameRound = SupabaseGameRound | Web3ActiveRound | null

// Tipo para cartelas (mantém compatibilidade)
type BingoCardType = any[] // Aceita qualquer formato de cartela

interface GameStatsProps {
  userCards: BingoCardType
  activeRound: UnifiedGameRound  // ← TIPO FLEXÍVEL
}

// ===== FUNÇÃO HELPER PARA CONVERTER TIPOS =====
function getUnifiedRoundData(round: UnifiedGameRound) {
  if (!round) {
    return {
      isActive: false,
      drawnNumbersCount: 0,
      status: "Nenhuma",
      maxNumbers: 0
    }
  }

  // Verificar se é do tipo Supabase
  if ('round_number' in round && 'status' in round) {
    return {
      isActive: round.status === "active",
      drawnNumbersCount: round.drawn_numbers?.length || 0,
      status: round.status === "active" ? "Ativa" : 
               round.status === "waiting" ? "Aguardando" : "Finalizada",
      maxNumbers: round.max_number
    }
  }
  
  // Verificar se é do tipo Web3
  if ('estado' in round && 'numerosSorteados' in round) {
    return {
      isActive: round.estado === 1 || round.estado === 2, // Aberta ou Sorteando
      drawnNumbersCount: round.numerosSorteados?.length || 0,
      status: round.estado === 1 ? "Aberta" :
               round.estado === 2 ? "Sorteando" :
               round.estado === 3 ? "Finalizada" : "Inativa",
      maxNumbers: round.numeroMaximo
    }
  }

  // Fallback para tipos desconhecidos
  return {
    isActive: false,
    drawnNumbersCount: 0,
    status: "Desconhecido",
    maxNumbers: 0
  }
}

export default function GameStats({ userCards, activeRound }: GameStatsProps) {
  const roundData = getUnifiedRoundData(activeRound)

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Estatísticas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-slate-400">Cartelas:</span>
          </div>
          <span className="font-medium text-white">{userCards?.length || 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-slate-400">Vitórias:</span>
          </div>
          <span className="font-medium text-yellow-400">0</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-green-400" />
            <span className="text-sm text-slate-400">Rodada Ativa:</span>
          </div>
          <span className="font-medium text-white">
            {roundData.isActive ? "Sim" : "Não"}
          </span>
        </div>

        {roundData.isActive && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Status:</span>
              <span className="font-medium text-blue-400">{roundData.status}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Números Sorteados:</span>
              <span className="font-medium text-green-400">
                {roundData.drawnNumbersCount}
                {roundData.maxNumbers > 0 && ` / ${roundData.maxNumbers}`}
              </span>
            </div>
          </>
        )}

        {/* Debug info em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && activeRound && (
          <div className="text-xs text-slate-500 border-t border-slate-600 pt-2 mt-2">
            <div>Tipo: {'round_number' in activeRound ? 'Supabase' : 'Web3'}</div>
            <div>ID: {'round_number' in activeRound ? activeRound.id : activeRound.id.toString()}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}