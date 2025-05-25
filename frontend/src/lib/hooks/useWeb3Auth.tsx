import { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';
import { ROLES } from '../config';

// Tipo para o contexto de autenticação
type Web3AuthContextType = {
  address: string | null;
  isConnected: boolean;
  isAdmin: boolean;
  isPlayer: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
};

// Valor padrão para o contexto
const defaultContextValue: Web3AuthContextType = {
  address: null,
  isConnected: false,
  isAdmin: false,
  isPlayer: false,
  connect: async () => {},
  disconnect: () => {},
  provider: null,
  signer: null,
};

// Criação do contexto
export const Web3AuthContext = createContext<Web3AuthContextType>(defaultContextValue);

// Hook personalizado para usar o contexto
export const useWeb3Auth = () => useContext(Web3AuthContext);

// Provider para o contexto
export const Web3AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se o usuário já está conectado ao carregar a página
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const web3Signer = web3Provider.getSigner();
            const connectedAddress = await web3Signer.getAddress();
            
            setAddress(connectedAddress);
            setProvider(web3Provider);
            setSigner(web3Signer);
            
            // Verificar se é admin (simplificado - em produção usaria um contrato ou lista)
            // Para fins de demonstração, consideramos o primeiro endereço como admin
            setIsAdmin(connectedAddress.toLowerCase() === '0x0000000000000000000000000000000000000000'.toLowerCase());
          }
        } catch (error) {
          console.error("Erro ao verificar conexão:", error);
        }
      }
    };

    checkConnection();

    // Listener para mudanças de conta
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          checkConnection();
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  // Função para conectar carteira
  const connect = async () => {
    if (!window.ethereum) {
      alert("Por favor, instale o MetaMask ou outro provedor Web3 compatível!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      const connectedAddress = await web3Signer.getAddress();
      
      setAddress(connectedAddress);
      setProvider(web3Provider);
      setSigner(web3Signer);
      
      // Verificar se é admin (simplificado - em produção usaria um contrato ou lista)
      setIsAdmin(connectedAddress.toLowerCase() === '0x0000000000000000000000000000000000000000'.toLowerCase());
    } catch (error) {
      console.error("Erro ao conectar:", error);
    }
  };

  // Função para desconectar
  const disconnect = () => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setIsAdmin(false);
  };

  // Valor do contexto
  const contextValue: Web3AuthContextType = {
    address,
    isConnected: !!address,
    isAdmin,
    isPlayer: !!address && !isAdmin,
    connect,
    disconnect,
    provider,
    signer,
  };

  return (
    <Web3AuthContext.Provider value={contextValue}>
      {children}
    </Web3AuthContext.Provider>
  );
};
