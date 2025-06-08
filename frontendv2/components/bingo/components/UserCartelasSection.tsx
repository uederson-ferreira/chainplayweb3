// Arquivo: components/bingo/components/UserCartelasSection.tsx

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, RefreshCw } from "lucide-react";
import BingoCard from "../bingo-card";

interface UserCartelasSectionProps {
  userCards: any[];
  totalCards: number;
  isLoadingCards: boolean;
  isCreatingCard: boolean;
  isCorrectNetwork: boolean;
  isConnected: boolean;
  isRegisteringNumbers: boolean;
  selectedCard: string | null;
  precoBase?: bigint;
  canJoin: boolean;
  onRefreshCards: () => void;
  onShowCreateModal: () => void;
  onJoinRound: (cardId: string) => void;
  onRegisterNumbers: (cardId: string) => void;
}

/**
 * Seção que exibe e gerencia as cartelas do usuário
 */
export default function UserCartelasSection({
  userCards,
  totalCards,
  isLoadingCards,
  isCreatingCard,
  isCorrectNetwork,
  isConnected,
  isRegisteringNumbers,
  selectedCard,
  precoBase,
  canJoin,
  onRefreshCards,
  onShowCreateModal,
  onJoinRound,
  onRegisterNumbers,
}: UserCartelasSectionProps) {

  const formatPrecoBase = (preco?: bigint) => {
    if (!preco) return "Nova Cartela";
    return `Nova Cartela (${(Number(preco) / 1e18).toFixed(3)} ETH)`;
  };

  const formatPrecoBaseFirstCard = (preco?: bigint) => {
    if (!preco) return "Criar Primeira Cartela";
    return `Criar Primeira Cartela (${(Number(preco) / 1e18).toFixed(3)} ETH)`;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">
            Suas Cartelas {totalCards > 0 && `(${totalCards})`}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={onRefreshCards}
              size="sm"
              variant="outline"
              disabled={isLoadingCards || !isCorrectNetwork}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCards ? 'animate-spin' : ''}`} />
              {isLoadingCards ? "Carregando..." : "Atualizar"}
            </Button>
            <Button
              onClick={onShowCreateModal}
              size="sm"
              disabled={isCreatingCard || !isCorrectNetwork}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreatingCard ? "Criando..." : formatPrecoBase(precoBase)}
            </Button>
          </div>
        </div>
        <CardDescription className="text-slate-400">
          Gerencie suas cartelas de bingo on-chain
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoadingCards ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando suas cartelas da blockchain...</p>
          </div>
        ) : userCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCards.map((card) => (
              <BingoCard
                key={card.id}
                card={card}
                drawnNumbers={[]}
                onJoinRound={onJoinRound}
                onRegisterNumbers={onRegisterNumbers}
                canJoin={canJoin}
                isRegisteringNumbers={isRegisteringNumbers} 
                isParticipating={selectedCard === card.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">
              {isConnected 
                ? "Você ainda não tem cartelas on-chain" 
                : "Conecte sua carteira para ver suas cartelas"
              }
            </p>
            <Button
              onClick={onShowCreateModal}
              disabled={isCreatingCard || !isCorrectNetwork || !isConnected}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreatingCard ? "Criando..." : formatPrecoBaseFirstCard(precoBase)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}