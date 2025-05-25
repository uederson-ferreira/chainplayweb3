import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ParticipateForm from '../components/bingo/ParticipateForm';
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth';
import { useContracts } from '../lib/hooks/useContracts';
import Card from '../components/bingo/Card';
import Button from '../components/bingo/Button';
import { EstadoRodada } from '../lib/config';

const ParticipateRoundPage: React.FC = () => {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { isConnected, connect } = useWeb3Auth();
  const { bingoGameContract } = useContracts();
  
  const [roundInfo, setRoundInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoundInfo = async () => {
      if (!bingoGameContract || !roundId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const round = await bingoGameContract.rodadas(roundId);
        
        // Verificar se a rodada existe
        if (round.id.toString() !== roundId) {
          setError("Rodada não encontrada.");
          setIsLoading(false);
          return;
        }
        
        // Verificar se a rodada está aberta para participação
        if (round.estado !== EstadoRodada.Aberta) {
          setError("Esta rodada não está aberta para participação.");
          setIsLoading(false);
          return;
        }
        
        setRoundInfo({
          id: round.id.toNumber(),
          estado: round.estado,
          numeroMaximo: round.numeroMaximo,
        });
        
      } catch (err: any) {
        console.error("Erro ao carregar informações da rodada:", err);
        setError(`Erro ao carregar informações: ${err.message || "Erro desconhecido"}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isConnected && bingoGameContract) {
      loadRoundInfo();
    }
  }, [bingoGameContract, roundId, isConnected]);

  if (!isConnected) {
    return (
      <Card className="bg-yellow-50 max-w-lg mx-auto text-center p-8">
        <h2 className="text-xl font-bold mb-4">Conecte sua carteira</h2>
        <p className="text-yellow-800 mb-6">
          Por favor, conecte sua carteira para participar da rodada.
        </p>
        <Button variant="primary" onClick={connect}>
          Conectar Carteira
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="animate-pulse max-w-2xl mx-auto">
        <div className="h-8 bg-gray-200 rounded mb-4 w-1/2"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">Erro</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <Button variant="primary" onClick={() => navigate('/player')}>
          Voltar para Área do Jogador
        </Button>
      </Card>
    );
  }

  if (!roundInfo) {
    return (
      <Card className="bg-red-50 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">Rodada não encontrada</h2>
        <p className="text-red-600 mb-6">
          Não foi possível encontrar a rodada solicitada.
        </p>
        <Button variant="primary" onClick={() => navigate('/player')}>
          Voltar para Área do Jogador
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Participar da Rodada #{roundInfo.id}</h1>
      <ParticipateForm 
        rodadaId={roundInfo.id}
        onSuccess={() => navigate('/player')}
      />
    </div>
  );
};

export default ParticipateRoundPage;
