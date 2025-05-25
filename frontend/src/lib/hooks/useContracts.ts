import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3Auth } from './useWeb3Auth';
import { CONTRACT_ADDRESSES } from '../config';
import CartelaContractABI from '../abis/CartelaContract.json';
import BingoGameContractABI from '../abis/BingoGameContract.json';

// Tipos para os contratos
type ContractsType = {
  cartelaContract: ethers.Contract | null;
  bingoGameContract: ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
};

// Hook para acessar os contratos
export const useContracts = () => {
  const { provider, signer, isConnected } = useWeb3Auth();
  const [contracts, setContracts] = useState<ContractsType>({
    cartelaContract: null,
    bingoGameContract: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const initContracts = async () => {
      if (!isConnected || !provider || !signer) {
        setContracts({
          cartelaContract: null,
          bingoGameContract: null,
          isLoading: false,
          error: "Carteira não conectada",
        });
        return;
      }

      setContracts(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Obter a rede atual e seu Chain ID
        const network = await provider.getNetwork();
        const chainId = network.chainId.toString();

        // Verificar se temos endereços de contrato configurados para este Chain ID
        if (!CONTRACT_ADDRESSES[chainId]) {
          throw new Error(`Rede não suportada ou endereços de contrato não configurados para o Chain ID: ${chainId}`);
        }

        // Inicializar contratos com base no Chain ID
        const cartelaContract = new ethers.Contract(
          CONTRACT_ADDRESSES[chainId].CARTELA_CONTRACT,
          CartelaContractABI,
          signer
        );

        const bingoGameContract = new ethers.Contract(
          CONTRACT_ADDRESSES[chainId].BINGO_GAME_CONTRACT,
          BingoGameContractABI,
          signer
        );

        setContracts({
          cartelaContract,
          bingoGameContract,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Erro ao inicializar contratos:", error);
        setContracts({
          cartelaContract: null,
          bingoGameContract: null,
          isLoading: false,
          error: `Erro ao inicializar contratos: ${error.message || "Erro desconhecido"}`,
        });
      }
    };

    initContracts();
  }, [provider, signer, isConnected]);

  return contracts;
};
