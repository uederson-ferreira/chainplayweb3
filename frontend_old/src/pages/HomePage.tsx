import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth.js';
import Button from '../components/base/Button.js';
import Card from '../components/base/Card.js';
import { THEME_COLORS } from '../lib/config.js';

const HomePage: React.FC = () => {
  const { isConnected, isAdmin, isPlayer, connect } = useWeb3Auth();

  // Adicionar log para verificar o estado de conexão
  console.log('HomePage - isConnected:', isConnected);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4" style={{ color: THEME_COLORS.primary }}>
          Bingo Web3
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Jogue bingo na blockchain com cartelas personalizáveis e sorteio transparente via Chainlink VRF
        </p>
        
        {!isConnected ? (
          <Button variant="primary" size="lg" onClick={connect}>
            Conectar Carteira para Começar
          </Button>
        ) : (
          <div className="flex justify-center gap-4">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="primary" size="lg">
                  Painel de Administração
                </Button>
              </Link>
            )}
            {isPlayer && (
              <Link to="/player">
                <Button variant="secondary" size="lg">
                  Área do Jogador
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="text-center p-6">
          <div className="text-4xl mb-4" style={{ color: THEME_COLORS.primary }}>🎮</div>
          <h3 className="text-xl font-bold mb-2">Cartelas Personalizáveis</h3>
          <p className="text-gray-600">
            Crie cartelas com dimensões personalizadas e escolha seus números favoritos
          </p>
        </Card>
        
        <Card className="text-center p-6">
          <div className="text-4xl mb-4" style={{ color: THEME_COLORS.secondary }}>🔄</div>
          <h3 className="text-xl font-bold mb-2">Sorteio Transparente</h3>
          <p className="text-gray-600">
            Números sorteados via Chainlink VRF, garantindo aleatoriedade verificável
          </p>
        </Card>
        
        <Card className="text-center p-6">
          <div className="text-4xl mb-4" style={{ color: THEME_COLORS.accent }}>🏆</div>
          <h3 className="text-xl font-bold mb-2">Prêmios On-Chain</h3>
          <p className="text-gray-600">
            Vencedores determinados automaticamente e prêmios distribuídos na blockchain
          </p>
        </Card>
      </div>
      
      <div className="bg-gray-100 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold mb-4">Como Jogar</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Conecte sua carteira MetaMask ou compatível</li>
          <li>Crie uma cartela personalizada com suas dimensões preferidas</li>
          <li>Registre os números da sua cartela (ou gere aleatoriamente)</li>
          <li>Participe de uma rodada ativa</li>
          <li>Acompanhe os sorteios em tempo real</li>
          <li>Se ganhar, os prêmios serão enviados automaticamente para sua carteira</li>
        </ol>
      </div>
    </div>
  );
};

export default HomePage;
