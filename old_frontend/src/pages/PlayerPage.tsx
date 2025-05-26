import React from 'react';
import PlayerPanel from '../components/bingo/PlayerPanel.js';
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth.js';
import Card from '../components/bingo/Card.js';
import Button from '../components/bingo/Button.js';

const PlayerPage: React.FC = () => {
  const { isConnected, connect } = useWeb3Auth();

  if (!isConnected) {
    return (
      <Card className="bg-yellow-50 max-w-lg mx-auto text-center p-8">
        <h2 className="text-xl font-bold mb-4">Conecte sua carteira</h2>
        <p className="text-yellow-800 mb-6">
          Por favor, conecte sua carteira para acessar a área do jogador.
        </p>
        <Button variant="primary" onClick={connect}>
          Conectar Carteira
        </Button>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PlayerPanel />
    </div>
  );
};

export default PlayerPage;
