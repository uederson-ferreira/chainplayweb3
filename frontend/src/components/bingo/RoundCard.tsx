import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useContracts } from '../../lib/hooks/useContracts';
import { EstadoRodada, ESTADO_RODADA_TEXT } from '../../lib/config';

interface RoundCardProps {
  rodadaId: number;
  onParticipate?: () => void;
  onDrawNumber?: () => void;
  onDistributePrizes?: () => void;
}

const RoundCard: React.FC<RoundCardProps> = ({
  rodadaId,
  onParticipate,
  onDrawNumber,
  onDistributePrizes,
}) => {
  const [roundInfo, setRoundInfo] = useState<{
    id: number;
    estado: EstadoRodada;
    numeroMaximo: number;
    ultimoRequestId: number;
    pedidoVrfPendente: boolean;
    premiosDistribuidos: boolean;
  } | null>(null);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { bingoGameContract } = useContracts();

  // Carregar informações da rodada
  useEffect(() => {
    const loadRoundInfo = async () => {
      if (!bingoGameContract) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Obter informações básicas da rodada
        const info = await bingoGameContract.rodadas(rodadaId);
        
        setRoundInfo({
          id: info.id.toNumber(),
          estado: info.estado,
          numeroMaximo: info.numeroMaximo,
          ultimoRequestId: info.ultimoRequestId.toNumber(),
          pedidoVrfPendente: info.pedidoVrfPendente,
          premiosDistribuidos: info.premiosDistribuidos,
        });
        
        // TODO: Obter números sorteados (precisaria de um getter no contrato)
        // Por enquanto, deixamos vazio
        setDrawnNumbers([]);
        
      } catch (err) {
        console.error("Erro ao carregar informações da rodada:", err);
        setError(`Erro ao carregar informações: ${err.message || "Erro desconhecido"}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRoundInfo();
  }, [bingoGameContract, rodadaId]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="h-24 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  if (error || !roundInfo) {
    return (
      <Card className="bg-red-50">
        <p className="text-red-600">
          {error || "Não foi possível carregar as informações da rodada."}
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Rodada #{roundInfo.id}</h3>
        <span 
          className={`px-2 py-1 text-xs font-medium rounded-full ${
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
      
      <div className="mb-4">
        <p className="text-gray-600">
          <span className="font-medium">Número máximo:</span> {roundInfo.numeroMaximo}
        </p>
        {roundInfo.pedidoVrfPendente && (
          <p className="text-amber-600 mt-1">
            Sorteio em andamento...
          </p>
        )}
        {roundInfo.premiosDistribuidos && (
          <p className="text-green-600 mt-1">
            Prêmios distribuídos
          </p>
        )}
      </div>
      
      {drawnNumbers.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Números sorteados:</h4>
          <div className="flex flex-wrap gap-2">
            {drawnNumbers.map((number, index) => (
              <span 
                key={index}
                className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full font-medium"
              >
                {number}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mt-4">
        {roundInfo.estado === EstadoRodada.Aberta && onParticipate && (
          <Button variant="primary" onClick={onParticipate}>
            Participar
          </Button>
        )}
        
        {(roundInfo.estado === EstadoRodada.Aberta || roundInfo.estado === EstadoRodada.Sorteando) && 
         !roundInfo.pedidoVrfPendente && 
         onDrawNumber && (
          <Button variant="secondary" onClick={onDrawNumber}>
            Sortear Número
          </Button>
        )}
        
        {roundInfo.estado === EstadoRodada.Finalizada && 
         !roundInfo.premiosDistribuidos && 
         onDistributePrizes && (
          <Button variant="success" onClick={onDistributePrizes}>
            Distribuir Prêmios
          </Button>
        )}
      </div>
    </Card>
  );
};

export default RoundCard;
