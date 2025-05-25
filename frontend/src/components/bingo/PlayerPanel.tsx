import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useContracts } from '../../lib/hooks/useContracts';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';
import { EstadoRodada } from '../../lib/config';
import RoundCard from './RoundCard';
import BingoCard from './BingoCard';

const PlayerPanel: React.FC = () => {
  const [userCards, setUserCards] = useState<any[]>([]);
  const [activeRounds, setActiveRounds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isPlayer } = useWeb3Auth();
  const { cartelaContract, bingoGameContract } = useContracts();

  // Carregar cartelas do usuário
  useEffect(() => {
    const loadUserCards = async () => {
      if (!cartelaContract || !address) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Obter o próximo ID de cartela (total de cartelas criadas)
        const nextCardId = await cartelaContract.proximoCartelaId();
        const totalCards = nextCardId.toNumber();
        
        // Verificar cada cartela para encontrar as do usuário atual
        const userCardsPromises = [];
        for (let i = 0; i < totalCards; i++) {
          userCardsPromises.push(cartelaContract.cartelas(i));
        }
        
        const cardsData = await Promise.all(userCardsPromises);
        const userCardsData = cardsData.filter(card => 
          card.dono.toLowerCase() === address.toLowerCase()
        );
        
        // Obter os números de cada cartela
        const userCardsWithNumbers = await Promise.all(
          userCardsData.map(async (card) => {
            const numbers = card.numerosRegistrados 
              ? await cartelaContract.getNumerosCartela(card.id)
              : [];
            
            return {
              id: card.id.toNumber(),
              rows: card.linhas,
              columns: card.colunas,
              owner: card.dono,
              numbers: numbers.map(n => n.toNumber()),
              isRegistered: card.numerosRegistrados,
            };
          })
        );
        
        setUserCards(userCardsWithNumbers);
      } catch (err) {
        console.error("Erro ao carregar cartelas do usuário:", err);
        setError(`Erro ao carregar cartelas: ${err.message || "Erro desconhecido"}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserCards();
  }, [cartelaContract, address]);

  // Carregar rodadas ativas
  useEffect(() => {
    const loadActiveRounds = async () => {
      if (!bingoGameContract) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Não há um método direto para obter todas as rodadas
        // Vamos usar eventos para tentar encontrar rodadas criadas
        const filter = bingoGameContract.filters.RodadaIniciada();
        const events = await bingoGameContract.queryFilter(filter);
        
        // Extrair IDs das rodadas dos eventos
        const roundIds = events.map(event => event.args?.rodadaId.toNumber());
        
        // Verificar quais rodadas estão ativas (estado Aberta)
        const activeRoundIds = [];
        for (const id of roundIds) {
          const roundInfo = await bingoGameContract.rodadas(id);
          if (roundInfo.estado === EstadoRodada.Aberta) {
            activeRoundIds.push(id);
          }
        }
        
        setActiveRounds(activeRoundIds);
        
      } catch (err) {
        console.error("Erro ao carregar rodadas ativas:", err);
        setError(`Erro ao carregar rodadas: ${err.message || "Erro desconhecido"}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadActiveRounds();
  }, [bingoGameContract]);

  const handleParticipate = (rodadaId: number) => {
    // Redirecionar para a página de participação
    window.location.href = `/participate/${rodadaId}`;
  };

  if (!isPlayer) {
    return (
      <Card className="bg-yellow-50">
        <h2 className="text-xl font-bold mb-2">Conecte sua carteira</h2>
        <p className="text-yellow-800">
          Conecte sua carteira para ver suas cartelas e participar de rodadas.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Painel do Jogador</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}
      
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Minhas Cartelas</h2>
          <Button 
            variant="primary" 
            onClick={() => window.location.href = '/create-card'}
          >
            Criar Nova Cartela
          </Button>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : userCards.length === 0 ? (
          <Card>
            <p className="text-gray-600">
              Você ainda não possui cartelas. Crie uma nova cartela para começar.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCards.map(card => (
              <BingoCard
                key={card.id}
                id={card.id}
                rows={card.rows}
                columns={card.columns}
                numbers={card.numbers}
                owner={card.owner}
                onClick={() => card.isRegistered ? null : window.location.href = `/register-numbers/${card.id}`}
              />
            ))}
          </div>
        )}
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-4">Rodadas Ativas</h2>
        
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : activeRounds.length === 0 ? (
          <Card>
            <p className="text-gray-600">
              Não há rodadas ativas no momento. Aguarde o administrador criar uma nova rodada.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRounds.map(roundId => (
              <RoundCard
                key={roundId}
                rodadaId={roundId}
                onParticipate={() => handleParticipate(roundId)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PlayerPanel;
