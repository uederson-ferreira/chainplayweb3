import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth.js';
import { useContracts } from '../lib/hooks/useContracts.js';
import Card from '../components/bingo/Card.js';
import Button from '../components/bingo/Button.js';
import { EstadoRodada, ESTADO_RODADA_TEXT } from '../lib/config.js';
import BingoCard from '../components/bingo/BingoCard.js';
import { ethers } from 'ethers';

interface RoundInfo {
  id: number;
  estado: EstadoRodada;
  numeroMaximo: number;
  premiosDistribuidos: boolean;
}

interface Participant {
  cartelaId: number;
  jogador: string;
  rows: number;
  columns: number;
  numbers: number[];
  isWinner: boolean;
}

interface Winner {
  cartelaId: number;
  address: string;
}

const RoundDetailsPage: React.FC = () => {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { isConnected, connect } = useWeb3Auth();
  const { bingoGameContract, cartelaContract } = useContracts();
  
  const [roundInfo, setRoundInfo] = useState<RoundInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoundDetails = async () => {
      if (!bingoGameContract || !cartelaContract || !roundId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Carregar informações básicas da rodada
        const round = await bingoGameContract.rodadas(roundId);
        
        // Verificar se a rodada existe
        if (round.id.toString() !== roundId) {
          setError("Rodada não encontrada.");
          setIsLoading(false);
          return;
        }
        
        setRoundInfo({
          id: round.id.toNumber(),
          estado: round.estado,
          numeroMaximo: round.numeroMaximo,
          premiosDistribuidos: round.premiosDistribuidos,
        });
        
        // Carregar participantes (via eventos)
        const participantFilter = bingoGameContract.filters.JogadorEntrou(roundId);
        const participantEvents = await bingoGameContract.queryFilter(participantFilter);
        
        // Carregar vencedores (via eventos)
        const winnerFilter = bingoGameContract.filters.VencedorEncontrado(roundId);
        const winnerEvents = await bingoGameContract.queryFilter(winnerFilter);
        
        // Carregar números sorteados (via eventos)
        const numberFilter = bingoGameContract.filters.NumeroSorteado(roundId);
        const numberEvents = await bingoGameContract.queryFilter(numberFilter);
        
        // Processar participantes
        const participantPromises = participantEvents.map(async (event) => {
          // Assert event is EventLog to access args
          const eventLog = event as unknown as ethers.EventLog;
          const cartelaId = eventLog.args?.cartelaId.toNumber();
          const jogador = eventLog.args?.jogador;
          
          // Obter detalhes da cartela
          const cartela = await cartelaContract.cartelas(cartelaId);
          const numeros = await cartelaContract.getNumerosCartela(cartelaId);
          
          return {
            cartelaId,
            jogador,
            rows: cartela.linhas,
            columns: cartela.colunas,
            numbers: numeros.map((n: any) => n.toNumber()),
            isWinner: winnerEvents.some(e => {
              // Assert event is EventLog to access args
              const winnerEventLog = e as unknown as ethers.EventLog;
              return winnerEventLog.args?.cartelaId.toString() === cartelaId.toString() &&
                     winnerEventLog.args?.vencedor.toLowerCase() === jogador.toLowerCase();
            }),
          };
        });
        
        const participantsData = await Promise.all(participantPromises);
        setParticipants(participantsData);
        
        // Processar vencedores
        const winnersData = winnerEvents.map(event => {
          // Assert event is EventLog to access args
          const eventLog = event as unknown as ethers.EventLog;
          return {
            cartelaId: eventLog.args?.cartelaId.toNumber(),
            address: eventLog.args?.vencedor,
          };
        });
        setWinners(winnersData);
        
        // Processar números sorteados
        const drawnNumbersData = numberEvents.map(event => 
          // Assert event is EventLog to access args
          (event as unknown as ethers.EventLog).args?.numeroSorteado.toNumber()
        );
        setDrawnNumbers(drawnNumbersData);
        
      } catch (err: any) {
        console.error("Erro ao carregar detalhes da rodada:", err);
        setError(`Erro ao carregar detalhes: ${err.message || "Erro desconhecido"}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isConnected && bingoGameContract && cartelaContract) {
      loadRoundDetails();
    }
  }, [bingoGameContract, cartelaContract, roundId, isConnected]);

  if (!isConnected) {
    return (
      <Card className="bg-yellow-50 max-w-lg mx-auto text-center p-8">
        <h2 className="text-xl font-bold mb-4">Conecte sua carteira</h2>
        <p className="text-yellow-800 mb-6">
          Por favor, conecte sua carteira para ver os detalhes da rodada.
        </p>
        <Button variant="primary" onClick={connect}>
          Conectar Carteira
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="animate-pulse max-w-4xl mx-auto">
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
        <Button variant="primary" onClick={() => navigate(-1)}>
          Voltar
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
        <Button variant="primary" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalhes da Rodada #{roundInfo.id}</h1>
        <span 
          className={`px-3 py-1 text-sm font-medium rounded-full ${
            roundInfo.estado === EstadoRodada.Aberta 
              ? 'bg-green-100 text-green-800' 
              : roundInfo.estado === EstadoRodada.Sorteando 
                ? 'bg-amber-100 text-amber-800'
                : roundInfo.estado === EstadoRodada.Finalizada
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
          }`}
        >
          {ESTADO_RODADA_TEXT[roundInfo.estado]}
        </span>
      </div>
      
      <Card className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-bold mb-2">Informações da Rodada</h2>
            <p><span className="font-medium">Número máximo:</span> {roundInfo.numeroMaximo}</p>
            <p><span className="font-medium">Estado:</span> {ESTADO_RODADA_TEXT[roundInfo.estado]}</p>
            <p><span className="font-medium">Prêmios distribuídos:</span> {roundInfo.premiosDistribuidos ? 'Sim' : 'Não'}</p>
            <p><span className="font-medium">Participantes:</span> {participants.length}</p>
            <p><span className="font-medium">Vencedores:</span> {winners.length}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-bold mb-2">Números Sorteados</h2>
            {drawnNumbers.length === 0 ? (
              <p className="text-gray-500">Nenhum número sorteado ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {drawnNumbers.map((number, index) => (
                  <span 
                    key={index}
                    className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full font-medium"
                  >
                    {number}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {winners.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Vencedores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {participants
              .filter(p => p.isWinner)
              .map(winner => (
                <Card key={winner.cartelaId} className="border-2 border-green-500">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Cartela #{winner.cartelaId}</h3>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Vencedor
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Jogador: {`${winner.jogador.substring(0, 6)}...${winner.jogador.substring(winner.jogador.length - 4)}`}
                  </p>
                  <div 
                    className="grid gap-2"
                    style={{ 
                      gridTemplateColumns: `repeat(${winner.columns}, 1fr)`,
                      gridTemplateRows: `repeat(${winner.rows}, 1fr)`
                    }}
                  >
                    {winner.numbers.map((number: number, index: number) => {
                      const isDrawn = drawnNumbers.includes(number);
                      
                      return (
                        <div 
                          key={index}
                          className={`
                            flex items-center justify-center 
                            w-8 h-8 rounded-full 
                            ${isDrawn ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-800'}
                            font-bold text-sm
                          `}
                        >
                          {number}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
          </div>
        </section>
      )}
      
      <section>
        <h2 className="text-xl font-bold mb-4">Participantes</h2>
        {participants.length === 0 ? (
          <Card>
            <p className="text-gray-500">Nenhum participante nesta rodada.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participants.map(participant => (
              <BingoCard
                key={participant.cartelaId}
                id={participant.cartelaId}
                rows={participant.rows}
                columns={participant.columns}
                numbers={participant.numbers}
                drawnNumbers={drawnNumbers}
                owner={participant.jogador}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RoundDetailsPage;
