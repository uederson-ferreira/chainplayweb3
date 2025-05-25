import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3Auth } from './useWeb3Auth';

interface Web3State {
  network: string | null;
  balance: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useWeb3 = () => {
  const { provider, address, isConnected } = useWeb3Auth();
  const [state, setState] = useState<Web3State>({
    network: null,
    balance: null,
    isLoading: false,
    error: null,
  });

  // Carregar informações da rede e saldo
  useEffect(() => {
    const loadWeb3Info = async () => {
      if (!provider || !isConnected || !address) return;

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Obter rede atual
        const network = await provider.getNetwork();
        
        // Obter saldo
        const balance = await provider.getBalance(address);
        const formattedBalance = ethers.formatEther(balance);
        
        setState({
          network: network.name,
          balance: formattedBalance,
          isLoading: false,
          error: null,
        });
        
      } catch (error) {
        console.error("Erro ao carregar informações Web3:", error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: `Erro ao carregar informações Web3: ${error.message || "Erro desconhecido"}`
        }));
      }
    };

    loadWeb3Info();
  }, [provider, address, isConnected]);

  return state;
}; 