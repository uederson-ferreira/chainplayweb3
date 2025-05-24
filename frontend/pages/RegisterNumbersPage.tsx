import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RegisterCardNumbersForm from '../components/bingo/RegisterCardNumbersForm';
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth';
import { useContracts } from '../lib/hooks/useContracts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const RegisterNumbersPage: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const { isConnected, connect, address } = useWeb3Auth();
  const { cartelaContract } = useContracts();
  
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCardInfo = async () => {
      if (!cartelaContract || !cardId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const card = await cartelaContract.cartelas(cardId);
        
        // Verificar se a cartela existe
        if (card.id.toString() !== cardId) {
          setError("Cartela não encontrada.");
          setIsLoading(false);
          return;
        }
        
        // Verificar se o usuário é o dono da cartela
        if (card.dono.toLowerCase() !== address?.toLowerCase()) {
          setError("Você não tem permissão para registrar números nesta cartela.");
          setIsLoading(false);
          return;
        }
        
        // Verificar se os números já foram registrados
        if (card.numerosRegistrados) {
          setError("Os números desta cartela já foram registrados.");
          setIsLoading(false);
          return;
        }
        
        setCardInfo({
          id: card.id.toNumber(),
          rows: card.linhas,
          columns: card.colunas,
          owner: card.dono,
          isRegistered: card.numerosRegistrados,
        });
        
      } catch (err: any) {
        console.error("Erro ao carregar informações da cartela:", err);
        setError(`Erro ao carregar informações: ${err.message || "Erro desconhecido"}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isConnected && cartelaContract) {
      loadCardInfo();
    }
  }, [cartelaContract, cardId, isConnected, address]);

  if (!isConnected) {
    return (
      <Card className="bg-yellow-50 max-w-lg mx-auto text-center p-8">
        <h2 className="text-xl font-bold mb-4">Conecte sua carteira</h2>
        <p className="text-yellow-800 mb-6">
          Por favor, conecte sua carteira para registrar números na cartela.
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
          Voltar para Minhas Cartelas
        </Button>
      </Card>
    );
  }

  if (!cardInfo) {
    return (
      <Card className="bg-red-50 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">Cartela não encontrada</h2>
        <p className="text-red-600 mb-6">
          Não foi possível encontrar a cartela solicitada.
        </p>
        <Button variant="primary" onClick={() => navigate('/player')}>
          Voltar para Minhas Cartelas
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Registrar Números da Cartela #{cardInfo.id}</h1>
      <RegisterCardNumbersForm 
        cartelaId={cardInfo.id} 
        rows={cardInfo.rows} 
        columns={cardInfo.columns} 
      />
    </div>
  );
};

export default RegisterNumbersPage;
