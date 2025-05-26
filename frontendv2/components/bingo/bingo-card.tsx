"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play } from "lucide-react"
import type { Database } from "@/lib/supabase/types"

type BingoCardType = Database["public"]["Tables"]["bingo_cards"]["Row"]

interface BingoCardProps {
  card: BingoCardType
  drawnNumbers: number[]
  onJoinRound: (cardId: string) => void
  isParticipating: boolean
  canJoin: boolean
}

export default function BingoCard({ card, drawnNumbers, onJoinRound, isParticipating, canJoin }: BingoCardProps) {
  const numbers = card.card_data?.numbers || []

  return (
    <Card className="bg-slate-700/50 border-slate-600">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white">Cartela #{card.id.slice(-8)}</CardTitle>
          <Badge variant="outline" className="text-xs text-slate-300">
            {card.rows}x{card.columns}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Grid da Cartela */}
        <div
          className="grid gap-1 text-xs"
          style={{
            gridTemplateColumns: `repeat(${card.columns}, minmax(0, 1fr))`,
          }}
        >
          {numbers.map((number: number, index: number) => {
            const isDrawn = drawnNumbers.includes(number)
            return (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center rounded border text-xs font-medium
                  ${
                    isDrawn
                      ? "bg-green-500/30 border-green-500 text-green-400"
                      : "bg-slate-600/50 border-slate-500 text-slate-300"
                  }
                `}
              >
                {number}
              </div>
            )
          })}
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onJoinRound(card.id)}
            disabled={!canJoin || isParticipating}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
          >
            {isParticipating ? (
              <>
                <Play className="h-3 w-3 mr-1" />
                Participando
              </>
            ) : (
              "Usar Cartela"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
