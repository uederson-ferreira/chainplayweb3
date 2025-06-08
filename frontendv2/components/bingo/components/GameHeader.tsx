// Arquivo: components/bingo/components/GameHeader.tsx

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Network } from "lucide-react";
import Link from "next/link";

interface GameHeaderProps {
  address?: string;
  isCorrectNetwork: boolean;
}

/**
 * Header do jogo de Bingo com navegação e informações do usuário
 */
export default function GameHeader({ address, isCorrectNetwork }: GameHeaderProps) {
  return (
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
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Chainlink VRF
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          {address && (
            <Badge variant="outline" className="text-slate-300">
              <Users className="h-3 w-3 mr-1" />
              {address.slice(0, 6)}...{address.slice(-4)}
            </Badge>
          )}
          {!isCorrectNetwork && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              <Network className="h-3 w-3 mr-1" />
              Rede Incorreta
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}