"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Target, Zap } from "lucide-react"
import type { Database } from "@/lib/supabase/types"

type BingoCardType = Database["public"]["Tables"]["bingo_cards"]["Row"]
type GameRound = Database["public"]["Tables"]["game_rounds"]["Row"]

interface GameStatsProps {
  userCards: BingoCardType[]
  activeRound: GameRound | null
}

export default function GameStats({ userCards, activeRound }: GameStatsProps) {
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
          <span className="font-medium text-white">{userCards.length}</span>
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
          <span className="font-medium text-white">{activeRound ? "Sim" : "Não"}</span>
        </div>

        {activeRound && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Números Sorteados:</span>
            <span className="font-medium text-blue-400">{activeRound.drawn_numbers.length}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
