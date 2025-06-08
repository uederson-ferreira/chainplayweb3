// Arquivo: components/bingo/components/ActiveRoundCard.tsx

import { formatEther } from 'viem';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Zap } from "lucide-react";
import { getEstadoTexto, getEstadoCor } from "../utils/gameHelpers";

interface ActiveRoundCardProps {
  rodada: any;
  selectedCard: string | null;
  canDraw: boolean;
  isBingoLoading: boolean;
  isCorrectNetwork: boolean;
  isOperator: boolean;
  isLoadingOperator: boolean;
  isPending: boolean;
  onDrawNumber: () => void;
  onStartRound: () => void;
}

/**
 * Componente que exibe informações da rodada ativa e controles
 */
export default function ActiveRoundCard({
  rodada,
  selectedCard,
  canDraw,
  isBingoLoading,
  isCorrectNetwork,
  isOperator,
  isLoadingOperator,
  isPending,
  onDrawNumber,
  onStartRound,
}: ActiveRoundCardProps) {

  // Se há rodada ativa
  if (rodada && rodada.id > 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Rodada #{rodada.id.toString()}</CardTitle>
            <Badge className={getEstadoCor(rodada.estado)}>
              {getEstadoTexto(rodada.estado)}
            </Badge>
          </div>
          <CardDescription className="text-slate-400">
            Números de 1 a {rodada.numeroMaximo} • VRF Pendente: {rodada.pedidoVrfPendente ? "Sim" : "Não"}
            {rodada.taxaEntrada && rodada.taxaEntrada > 0 && (
              <> • Taxa: {formatEther(rodada.taxaEntrada)} ETH</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={onDrawNumber}
              disabled={!canDraw || isBingoLoading || !isCorrectNetwork}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isBingoLoading ? "Sorteando..." : "Sortear Número"}
            </Button>

            {selectedCard && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-2">
                <Play className="h-3 w-3 mr-1" />
                Participando
              </Badge>
            )}
          </div>

          {/* Informações adicionais da rodada */}
          {rodada.premioTotal && rodada.premioTotal > 0 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                💰 Prêmio Total: {formatEther(rodada.premioTotal)} ETH
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Se não há rodada ativa
  return (
    <div>
      {isLoadingOperator ? (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Verificando permissões...</p>
          </CardContent>
        </Card>
      ) : isOperator ? (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="py-8 text-center">
            <p className="text-slate-400 mb-4">Nenhuma rodada ativa no momento</p>
            <Button
              onClick={onStartRound}
              disabled={isPending || !isCorrectNetwork}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {isPending ? "Iniciando..." : "Iniciar Nova Rodada"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="py-8 text-center">
            <p className="text-slate-400 mb-2">Nenhuma rodada ativa no momento</p>
            <p className="text-slate-500 text-sm">Aguarde um operador iniciar uma nova rodada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}