import React from 'react';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';
import Button from '../base/Button';
import { THEME_COLORS } from '../../lib/config';

const Header: React.FC = () => {
  const { address, isConnected, connect, disconnect, isAdmin } = useWeb3Auth();

  // Formatar endereço para exibição
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <header className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold" style={{ color: THEME_COLORS.primary }}>
            Bingo Web3
          </h1>
          {isAdmin && (
            <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
              Admin
            </span>
          )}
        </div>
        
        <div>
          {isConnected ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">
                {formatAddress(address || '')}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={disconnect}
              >
                Desconectar
              </Button>
            </div>
          ) : (
            <Button 
              variant="primary" 
              onClick={connect}
            >
              Conectar Carteira
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
