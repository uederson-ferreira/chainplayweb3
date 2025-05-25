import React from 'react';
import CreateCardForm from '../components/bingo/CreateCardForm';
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth';
import Card from '../components/base/Card';
import Button from '../components/base/Button';

const CreateCardPage: React.FC = () => {
  const { isConnected, connect } = useWeb3Auth();

  if (!isConnected) {
    return (
      <Card className="bg-yellow-50 max-w-lg mx-auto text-center p-8">
        <h2 className="text-xl font-bold mb-4">Conecte sua carteira</h2>
        <p className="text-yellow-800 mb-6">
          Por favor, conecte sua carteira para criar uma cartela de bingo.
        </p>
        <Button variant="primary" onClick={connect}>
          Conectar Carteira
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Criar Nova Cartela</h1>
      <CreateCardForm />
    </div>
  );
};

export default CreateCardPage;
