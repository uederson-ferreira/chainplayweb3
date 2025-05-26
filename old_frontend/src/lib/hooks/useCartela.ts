import { useState, useEffect } from 'react';
import { useContracts } from './useContracts.js';
import { useWeb3Auth } from './useWeb3Auth.js';

interface Cartela {
  id: number;
  owner: string;
  rows: number;
  columns: number;
  numbers: number[];
}

interface CartelaState {
  cartelas: Cartela[];
  isLoading: boolean;
  error: string | null;
}

export const useCartela = () => {
  const { cartelaContract } = useContracts();
  const { address, isConnected } = useWeb3Auth();
  const [state, setState] = useState<CartelaState>({
    cartelas: [],
    isLoading: false,
    error: null,
  });

  // Carregar cartelas do usuário
  useEffect(() => {
    const loadCartelas = async () => {
      if (!cartelaContract || !isConnected || !address) return;

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // TODO: Implementar lógica para carregar cartelas
        // - Obter cartelas do usuário
        // - Obter detalhes de cada cartela
        
      } catch (error) {
        console.error("Erro ao carregar cartelas:", error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: `Erro ao carregar cartelas: ${error.message || "Erro desconhecido"}`
        }));
      }
    };

    loadCartelas();
  }, [cartelaContract, address, isConnected]);

  return state;
}; 