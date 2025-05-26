"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Play, Users, Zap, Trophy } from "lucide-react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"
import BingoCard from "./bingo-card"
import CreateCardModal from "./create-card-modal"
import GameStats from "./game-stats"

type BingoCardType = Database["public"]["Tables"]["bingo_cards"]["Row"]
type GameRound = Database["public"]["Tables"]["game_rounds"]["Row"]
type GameParticipation = Database["public"]["Tables"]["game_participations"]["Row"]

interface BingoGameProps {
  user: User
  userCards: BingoCardType[]
  activeRound: GameRound | null
  userParticipations: GameParticipation[]
}

export default function BingoGame({
  user,
  userCards: initialCards,
  activeRound: initialRound,
  userParticipations: initialParticipations,
}: BingoGameProps) {
  const [userCards, setUserCards] = useState(initialCards)
  const [activeRound, setActiveRound] = useState(initialRound)
  const [userParticipations, setUserParticipations] = useState(initialParticipations)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Subscrever a mudanças em tempo real
    const roundsSubscription = supabase
      .channel("game_rounds")
      .on("postgres_changes", { event: "*", schema: "public", table: "game_rounds" }, (payload) => {
        if (payload.eventType === "UPDATE" && payload.new.id === activeRound?.id) {
          setActiveRound(payload.new as GameRound)
        }
      })
      .subscribe()

    return () => {
      roundsSubscription.unsubscribe()
    }
  }, [activeRound?.id, supabase])

  const handleCreateCard = async (rows: number, columns: number) => {
    // Gerar números aleatórios para a cartela
    const numbers = Array.from({ length: rows * columns }, () => Math.floor(Math.random() * 75) + 1)

    const { data, error } = await supabase
      .from("bingo_cards")
      .insert({
        user_id: user.id,
        card_data: { numbers },
        rows,
        columns,
      })
      .select()
      .single()

    if (!error && data) {
      setUserCards([data, ...userCards])
      setShowCreateModal(false)
    }
  }

  const handleJoinRound = async (cardId: string) => {
    if (!activeRound) return

    const { error } = await supabase.from("game_participations").insert({
      round_id: activeRound.id,
      user_id: user.id,
      card_id: cardId,
    })

    if (!error) {
      setSelectedCard(cardId)
      // Atualizar participações
      const { data } = await supabase
        .from("game_participations")
        .select("*")
        .eq("round_id", activeRound.id)
        .eq("user_id", user.id)
      setUserParticipations(data || [])
    }
  }

  const handleDrawNumber = async () => {
    if (!activeRound) return

    // Simular sorteio de número (em produção seria via Chainlink VRF)
    const newNumber = Math.floor(Math.random() * activeRound.max_number) + 1
    const updatedNumbers = [...activeRound.drawn_numbers, newNumber]

    const { error } = await supabase
      .from("game_rounds")
      .update({ drawn_numbers: updatedNumbers })
      .eq("id", activeRound.id)

    if (!error) {
      setActiveRound({ ...activeRound, drawn_numbers: updatedNumbers })
    }
  }

  const isParticipating = userParticipations.some((p) => p.card_id === selectedCard)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Bingo Web3
            </h1>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Chainlink VRF</Badge>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-slate-300">
              <Users className="h-3 w-3 mr-1" />
              {activeRound ? "Rodada Ativa" : "Aguardando"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Área Principal do Jogo */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rodada Ativa */}
            {activeRound ? (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Rodada #{activeRound.round_number}</CardTitle>
                    <Badge
                      className={
                        activeRound.status === "active"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : activeRound.status === "waiting"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {activeRound.status === "active"
                        ? "Ativa"
                        : activeRound.status === "waiting"
                          ? "Aguardando"
                          : "Finalizada"}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-400">Números de 1 a {activeRound.max_number}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Números Sorteados */}
                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">
                      Números Sorteados ({activeRound.drawn_numbers.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {activeRound.drawn_numbers.map((number, index) => (
                        <Badge
                          key={index}
                          className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-lg px-3 py-1"
                        >
                          {number}
                        </Badge>
                      ))}
                      {activeRound.drawn_numbers.length === 0 && (
                        <span className="text-slate-400 text-sm">Nenhum número sorteado ainda</span>
                      )}
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleDrawNumber}
                      disabled={activeRound.status !== "active"}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Sortear Número
                    </Button>

                    {isParticipating && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-2">
                        <Play className="h-3 w-3 mr-1" />
                        Participando
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="py-8 text-center">
                  <p className="text-slate-400 mb-4">Nenhuma rodada ativa no momento</p>
                  <Button disabled>Aguardando Nova Rodada</Button>
                </CardContent>
              </Card>
            )}

            {/* Cartelas do Usuário */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Suas Cartelas</CardTitle>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    size="sm"
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cartela
                  </Button>
                </div>
                <CardDescription className="text-slate-400">Gerencie suas cartelas de bingo</CardDescription>
              </CardHeader>
              <CardContent>
                {userCards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userCards.map((card) => (
                      <BingoCard
                        key={card.id}
                        card={card}
                        drawnNumbers={activeRound?.drawn_numbers || []}
                        onJoinRound={handleJoinRound}
                        isParticipating={userParticipations.some((p) => p.card_id === card.id)}
                        canJoin={!!activeRound && activeRound.status === "active"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">Você ainda não tem cartelas</p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Cartela
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GameStats userCards={userCards} activeRound={activeRound} />

            {/* Ranking */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Trophy className="h-4 w-4 mr-2 text-yellow-400" />
                  Top Jogadores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "CryptoMaster", wins: 15 },
                  { name: "BingoKing", wins: 12 },
                  { name: "Web3Player", wins: 8 },
                ].map((player, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm text-white">{player.name}</span>
                    </div>
                    <span className="text-sm text-yellow-400">{player.wins}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Como Jogar */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Como Jogar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-400">
                <p>1. Crie ou selecione uma cartela</p>
                <p>2. Participe de uma rodada ativa</p>
                <p>3. Aguarde os números serem sorteados</p>
                <p>4. Complete uma linha, coluna ou diagonal</p>
                <p>5. Seja o primeiro a gritar "BINGO!"</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Criar Cartela */}
      {showCreateModal && <CreateCardModal onClose={() => setShowCreateModal(false)} onCreateCard={handleCreateCard} />}
    </div>
  )
}
