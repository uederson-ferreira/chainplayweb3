import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Button from '../base/Button';
import Card from '../base/Card';
import { useContracts } from '../../lib/hooks/useContracts';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';
import BingoCard from './BingoCard';

interface ParticipateFormProps {
  rodadaId: number;
  onSuccess?: () => void;
}

interface UserCard {
  id: number;
  rows: number;
  columns: numbers;
  owner: string;
  numbers: number[];
  isRegistered: boolean;
}

const ParticipateForm: React.FC<ParticipateFormProps> = ({
  rodadaId,
  onSuccess,
}) => {
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { address } = useWeb3Auth();
  const { cartelaContract, bingoGameContract, error: contractError } = useContracts();

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
          card.dono.toLowerCase() === address.toLowerCase() && card.numerosRegistrados
        );
        
        // Obter os números de cada cartela
        const userCardsWithNumbers = await Promise.all(
          userCardsData.map(async (card) => {
            const numbers = await cartelaContract.getNumerosCartela(card.id);
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

  const handleParticipate = async () => {
    if (!bingoGameContract || !selectedCardId) {
      setError("Selecione uma cartela para participar.");
      return;
    }
    
    try {
      setIsParticipating(true);
      setError(null);
      setSuccess(null);
      
      // Chamar o contrato para participar da rodada
      const tx = await bingoGameContract.participar(rodadaId, selectedCardId);
      await tx.wait();
      
      setSuccess(`Participação confirmada na rodada #${rodadaId} com a cartela #${selectedCardId}!`);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Erro ao participar da rodada:", err);
      setError(`Erro ao participar: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsParticipating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  if (userCards.length === 0) {
    return (
      <Card>
        <h2 className="text-xl font-bold mb-4">Participar da Rodada #{rodadaId}</h2>
        <p className="text-gray-600 mb-4">
          Você não possui cartelas registradas. Crie uma cartela primeiro para poder participar.
        </p>
        <Button variant="primary" onClick={() => window.location.href = '/create-card'}>
          Criar Cartela
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Participar da Rodada #{rodadaId}</h2>
      
      {contractError && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {contractError}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">
          {success}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Selecione uma cartela:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userCards.map(card => (
            <div key={card.id} onClick={() => setSelectedCardId(card.id)}>
              <BingoCard
                id={card.id}
                rows={card.rows}
                columns={card.columns}
                numbers={card.numbers}
                owner={card.owner}
                selected={selectedCardId === card.id}
              />
            </div>
          ))}
        </div>
      </div>
      
      <Button
        variant="primary"
        fullWidth
        disabled={!selectedCardId || isParticipating}
        onClick={handleParticipate}
      >
        {isParticipating ? 'Participando...' : 'Participar da Rodada'}
      </Button>
    </Card>
  );
};

export default ParticipateForm;
