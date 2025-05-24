import React, { useState } from 'react';
import { ethers } from 'ethers';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useContracts } from '../../lib/hooks/useContracts';
import { DEFAULT_CARD_CONFIG } from '../../lib/config';

const CreateRoundForm: React.FC = () => {
  const [numeroMaximo, setNumeroMaximo] = useState(DEFAULT_CARD_CONFIG.MAX_NUMBER);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { bingoGameContract, isLoading, error: contractError } = useContracts();

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bingoGameContract) {
      setError("Contrato não inicializado. Verifique sua conexão.");
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      setSuccess(null);
      
      // Chamar o contrato para iniciar uma rodada
      const tx = await bingoGameContract.iniciarRodada(numeroMaximo);
      await tx.wait();
      
      setSuccess(`Rodada criada com sucesso! Aguarde a confirmação da transação.`);
      
      // Resetar o formulário
      setNumeroMaximo(DEFAULT_CARD_CONFIG.MAX_NUMBER);
    } catch (err) {
      console.error("Erro ao criar rodada:", err);
      setError(`Erro ao criar rodada: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Iniciar Nova Rodada</h2>
      
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
      
      <form onSubmit={handleCreateRound}>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="numeroMaximo">
            Número Máximo (10-99)
          </label>
          <input
            id="numeroMaximo"
            type="number"
            min="10"
            max="99"
            value={numeroMaximo}
            onChange={(e) => setNumeroMaximo(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Define o intervalo de números possíveis (1 até o valor escolhido).
          </p>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isLoading || isCreating}
        >
          {isCreating ? 'Criando...' : 'Iniciar Rodada'}
        </Button>
      </form>
    </Card>
  );
};

export default CreateRoundForm;
