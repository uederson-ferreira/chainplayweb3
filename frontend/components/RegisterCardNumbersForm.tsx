import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useContracts } from '../../lib/hooks/useContracts';

interface RegisterCardNumbersFormProps {
  cartelaId: number;
  rows: number;
  columns: number;
}

const RegisterCardNumbersForm: React.FC<RegisterCardNumbersFormProps> = ({
  cartelaId,
  rows,
  columns,
}) => {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { cartelaContract, isLoading, error: contractError } = useContracts();

  // Inicializar array de números
  useEffect(() => {
    const totalCells = rows * columns;
    const initialNumbers = Array(totalCells).fill(0);
    setNumbers(initialNumbers);
  }, [rows, columns]);

  const handleNumberChange = (index: number, value: number) => {
    const newNumbers = [...numbers];
    newNumbers[index] = value;
    setNumbers(newNumbers);
  };

  const handleRandomize = () => {
    const totalCells = rows * columns;
    const newNumbers = [];
    const usedNumbers = new Set();
    
    for (let i = 0; i < totalCells; i++) {
      let randomNum;
      do {
        randomNum = Math.floor(Math.random() * 99) + 1; // 1-99
      } while (usedNumbers.has(randomNum));
      
      usedNumbers.add(randomNum);
      newNumbers.push(randomNum);
    }
    
    setNumbers(newNumbers);
  };

  const handleRegisterNumbers = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cartelaContract) {
      setError("Contrato não inicializado. Verifique sua conexão.");
      return;
    }
    
    // Validar números
    if (numbers.some(num => num <= 0 || num > 99)) {
      setError("Todos os números devem estar entre 1 e 99.");
      return;
    }
    
    // Verificar duplicatas
    const uniqueNumbers = new Set(numbers);
    if (uniqueNumbers.size !== numbers.length) {
      setError("Não pode haver números duplicados na cartela.");
      return;
    }
    
    try {
      setIsRegistering(true);
      setError(null);
      setSuccess(null);
      
      // Chamar o contrato para registrar os números
      const tx = await cartelaContract.registrarNumerosCartela(cartelaId, numbers);
      await tx.wait();
      
      setSuccess(`Números registrados com sucesso para a cartela #${cartelaId}!`);
    } catch (err) {
      console.error("Erro ao registrar números:", err);
      setError(`Erro ao registrar números: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Registrar Números da Cartela #{cartelaId}</h2>
      
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
      
      <div className="mb-4 flex justify-end">
        <Button 
          variant="secondary" 
          onClick={handleRandomize}
          disabled={isLoading || isRegistering}
        >
          Gerar Números Aleatórios
        </Button>
      </div>
      
      <form onSubmit={handleRegisterNumbers}>
        <div 
          className="grid gap-2 mb-6"
          style={{ 
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`
          }}
        >
          {numbers.map((number, index) => (
            <input
              key={index}
              type="number"
              min="1"
              max="99"
              value={number || ''}
              onChange={(e) => handleNumberChange(index, parseInt(e.target.value) || 0)}
              className="w-12 h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          ))}
        </div>
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isLoading || isRegistering}
        >
          {isRegistering ? 'Registrando...' : 'Registrar Números'}
        </Button>
      </form>
    </Card>
  );
};

export default RegisterCardNumbersForm;
