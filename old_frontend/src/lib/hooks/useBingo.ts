import { useState, useEffect } from 'react';
import { useContracts } from './useContracts.js';
import { useWeb3Auth } from './useWeb3Auth.js';

interface BingoState {
  currentRound: number | null;
  drawnNumbers: number[];
  isLoading: boolean;
  error: string | null;
}

export const useBingo = () => {
  const { bingoGameContract } = useContracts();
  const { isConnected } = useWeb3Auth();
  const [state, setState] = useState<BingoState>({
    currentRound: null,
    drawnNumbers: [],
    isLoading: false,
    error: null,
  });

  // Carregar estado atual do jogo
  useEffect(() => {
    const loadGameState = async () => {
      if (!bingoGameContract || !isConnected) return;

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // TODO: Implementar lógica para carregar estado do jogo
        // - Obter rodada atual
        // - Obter números sorteados
        // - Verificar vencedores
        
      } catch (error) {
        console.error("Erro ao carregar estado do jogo:", error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: `Erro ao carregar estado do jogo: ${error.message || "Erro desconhecido"}`
        }));
      }
    };

    loadGameState();
  }, [bingoGameContract, isConnected]);

  return state;
}; 