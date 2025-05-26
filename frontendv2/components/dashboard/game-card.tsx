import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Play } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface GameCardProps {
  title: string
  description: string
  image: string
  href: string
  status: "Disponível" | "Em breve" | "Manutenção"
  players: number
  disabled?: boolean
}

export default function GameCard({ title, description, image, href, status, players, disabled }: GameCardProps) {
  const statusColors = {
    Disponível: "bg-green-500/20 text-green-400 border-green-500/30",
    "Em breve": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Manutenção: "bg-red-500/20 text-red-400 border-red-500/30",
  }

  return (
    <Card
      className={`bg-slate-800/50 border-slate-700 backdrop-blur-sm ${disabled ? "opacity-60" : "hover:bg-slate-800/70"} transition-all duration-300`}
    >
      <CardHeader className="pb-3">
        <div className="relative h-40 w-full mb-4 rounded-lg overflow-hidden">
          <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        </div>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{title}</CardTitle>
          <Badge className={statusColors[status]}>{status}</Badge>
        </div>
        <CardDescription className="text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-slate-400">
            <Users className="h-4 w-4" />
            <span>{players} jogadores</span>
          </div>
        </div>

        {disabled ? (
          <Button disabled className="w-full">
            Em Desenvolvimento
          </Button>
        ) : (
          <Link href={href} className="block">
            <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
              <Play className="h-4 w-4 mr-2" />
              Jogar Agora
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
