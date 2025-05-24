import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useContracts } from '../../lib/hooks/useContracts';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';
import { EstadoRodada } from '../../lib/config';
import CreateRoundForm from './CreateRoundForm';
import RoundCard from './RoundCard';

const AdminPanel: React.FC = () => {
  const [rounds, setRounds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  
  const { isAdmin } = useWeb3Auth();
  const { bingoGameContract } = useContracts();

  // Carregar rodadas existentes
  useEffect(() => {
    const loadRounds = async () => {
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
        setRounds(roundIds);
        
      } catch (err) {
        console.error("Erro ao carregar rodadas:", err);
        setError(`Erro ao carregar rodadas: ${err.message || "Erro desconhecido"}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRounds();
  }, [bingoGameContract]);

  const handleDrawNumber = async (rodadaId: number) => {
    if (!bingoGameContract) return;
    
    try {
      setActionInProgress(`draw-${rodadaId}`);
      setError(null);
      
      // Chamar o contrato para sortear um número
      const tx = await bingoGameContract.sortearNumero(rodadaId);
      await tx.wait();
      
      // Atualizar a interface após o sorteio
      // Idealmente, escutaríamos eventos aqui
      
    } catch (err) {
      console.error("Erro ao sortear número:", err);
      setError(`Erro ao sortear número: ${err.message || "Erro desconhecido"}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDistributePrizes = async (rodadaId: number) => {
    if (!bingoGameContract) return;
    
    try {
      setActionInProgress(`prize-${rodadaId}`);
      setError(null);
      
      // Chamar o contrato para distribuir prêmios
      const tx = await bingoGameContract.distribuirPremios(rodadaId);
      await tx.wait();
      
      // Atualizar a interface após a distribuição
      // Idealmente, escutaríamos eventos aqui
      
    } catch (err) {
      console.error("Erro ao distribuir prêmios:", err);
      setError(`Erro ao distribuir prêmios: ${err.message || "Erro desconhecido"}`);
    } finally {
      setActionInProgress(null);
    }
  };

  if (!isAdmin) {
    return (
      <Card className="bg-red-50">
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-red-600">
          Esta área é restrita a administradores.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Painel de Administração</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}
      
      <section>
        <h2 className="text-xl font-bold mb-4">Criar Nova Rodada</h2>
        <CreateRoundForm />
      </section>
      
      <section>
        <h2 className="text-xl font-bold mb-4">Gerenciar Rodadas</h2>
        
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : rounds.length === 0 ? (
          <Card>
            <p className="text-gray-600">
              Nenhuma rodada encontrada. Crie uma nova rodada para começar.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rounds.map(roundId => (
              <RoundCard
                key={roundId}
                rodadaId={roundId}
                onDrawNumber={() => handleDrawNumber(roundId)}
                onDistributePrizes={() => handleDistributePrizes(roundId)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPanel;
