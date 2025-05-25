import React from 'react';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth.js';
import Button from '../base/Button.js';
import { THEME_COLORS } from '../../lib/config.js';

const Header: React.FC = () => {
  const { address, accounts, selectedAccount, isConnected, connect, disconnect, isAdmin } = useWeb3Auth();

  // Formatar endereço para exibição
  const formatAddress = (address: string) => {
    if (!address) return '';
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
              {/* Exibição do Endereço */}
              {selectedAccount && (
                <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {formatAddress(selectedAccount)}
                </span>
              )}

              {/* Botão Desconectar */}
              <Button
                variant="secondary"
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
