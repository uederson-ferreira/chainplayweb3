import React, { useState } from 'react';
import { ethers } from 'ethers';
import Button from '../base/Button.js';
import Card from '../base/Card.js';
import { useContracts } from '../../lib/hooks/useContracts.js';
import { DEFAULT_CARD_CONFIG } from '../../lib/config.js';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';

const CreateCardForm: React.FC = () => {
  const [rows, setRows] = useState(DEFAULT_CARD_CONFIG.ROWS);
  const [columns, setColumns] = useState(DEFAULT_CARD_CONFIG.COLUMNS);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { cartelaContract, isLoading, error: contractError } = useContracts();
  const { isConnected, address } = useAppKitAccount();
  const { open } = useAppKit();

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      open({ view: 'Connect', namespace: 'eip155' });
      return;
    }
    
    if (!cartelaContract) {
      setError("Contrato não inicializado. Verifique sua conexão.");
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      setSuccess(null);
      
      const tx = await cartelaContract.criarCartela(rows, columns);
      await tx.wait();
      
      setSuccess(`Cartela criada com sucesso! Aguarde a confirmação da transação.`);
      
      setRows(DEFAULT_CARD_CONFIG.ROWS);
      setColumns(DEFAULT_CARD_CONFIG.COLUMNS);
    } catch (err) {
      console.error("Erro ao criar cartela:", err);
      setError(`Erro ao criar cartela: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Criar Nova Cartela</h2>
      
      {!isConnected && (
        <div className="bg-yellow-100 text-yellow-700 p-3 rounded-md mb-4">
          Conecte sua wallet para criar uma cartela
        </div>
      )}
      
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
      
      <form onSubmit={handleCreateCard}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="rows">
            Número de Linhas
          </label>
          <input
            id="rows"
            type="number"
            min="1"
            max="10"
            value={rows}
            onChange={(e) => setRows(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="columns">
            Número de Colunas
          </label>
          <input
            id="columns"
            type="number"
            min="1"
            max="10"
            value={columns}
            onChange={(e) => setColumns(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading || isCreating || !isConnected}
        >
          {!isConnected ? 'Conectar Wallet' : isCreating ? 'Criando...' : 'Criar Cartela'}
        </Button>
      </form>
    </Card>
  );
};

export default CreateCardForm;
