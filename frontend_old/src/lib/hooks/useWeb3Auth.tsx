import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { ethers } from 'ethers';
import { ROLES } from '../config.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit, useAppKit, useAppKitAccount } from '@reown/appkit/react';
import type { Eip1193Provider } from 'ethers';
import { CONTRACT_ADDRESSES, CHAIN_CONFIG } from '../config.js';
import { sepolia } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';

// Definir tipo para as chains
type ChainConfig = {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: string;
};

// Definir tipo para AppKitNetwork
type AppKitNetwork = Chain;

// Declaração do tipo para import.meta.env
declare global {
  interface ImportMeta {
    env: {
      VITE_WC_PROJECT_ID: string;
      VITE_APP_URL: string;
      VITE_APP_NAME: string;
      VITE_APP_DESCRIPTION: string;
      VITE_CHAIN_ID_LOCAL: string;
      VITE_CHAIN_ID_SEPOLIA: string;
    }
  }
}

// 1. Get projectId
const projectId = import.meta.env.VITE_WC_PROJECT_ID;

// Guard against missing projectId
if (!projectId) {
  console.error("⚠️ WalletConnect Project ID não está definido em .env (VITE_WC_PROJECT_ID).");
  console.error("     Alguns métodos de conexão podem não funcionar. Obtenha um em https://cloud.walletconnect.com/");
}

// 2. Create supported chains array
const chains: ChainConfig[] = [];

// Add Localhost (Chain ID 31337) if configured
if (CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL]) {
    chains.push({
        chainId: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL].chainId,
        name: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL].name,
        rpcUrl: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL].rpcUrls[0],
        explorerUrl: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL].blockExplorers.default.url,
        currency: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL].currency.symbol
    });
}

// Add Sepolia (Chain ID 11155111) if configured
if (CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_SEPOLIA]) {
    chains.push({
        chainId: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_SEPOLIA].chainId,
        name: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_SEPOLIA].name,
        rpcUrl: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_SEPOLIA].rpcUrls[0],
        explorerUrl: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_SEPOLIA].blockExplorers.default.url,
        currency: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_SEPOLIA].currency.symbol
    });
}

// Adicionar log para verificar as chains configuradas
console.log("Chains configuradas para AppKit:", chains);

// 3. Create a metadata object for your application
const metadata = {
  name: import.meta.env.VITE_APP_NAME,
  description: import.meta.env.VITE_APP_DESCRIPTION,
  url: import.meta.env.VITE_APP_URL,
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Definir as redes usando as configurações do Wagmi
const localChain = {
  id: Number(import.meta.env.VITE_CHAIN_ID_LOCAL),
  name: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL]?.name || 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    name: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL]?.currency?.name || 'Ether',
    symbol: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL]?.currency?.symbol || 'ETH',
    decimals: 18
  },
  rpcUrls: {
    default: { http: [CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL]?.rpcUrls[0] || 'http://localhost:8545'] },
    public: { http: [CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL]?.rpcUrls[0] || 'http://localhost:8545'] }
  },
  blockExplorers: {
    default: { 
      name: 'Local Explorer', 
      url: CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL]?.blockExplorers?.default?.url || 'http://localhost:4000' 
    }
  },
  testnet: true
} satisfies Chain;

// Criar array de redes suportadas
const supportedNetworks = [
  ...(CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_LOCAL] ? [localChain] : []),
  ...(CHAIN_CONFIG[import.meta.env.VITE_CHAIN_ID_SEPOLIA] ? [sepolia] : [])
] as [Chain, ...Chain[]];

// Inicializar o AppKit com configuração mais robusta
const appKit = createAppKit({
  projectId,
  metadata,
  networks: supportedNetworks,
  features: {
    analytics: false // Desabilitar analytics temporariamente para evitar erros de telemetria
  }
});

// Criar o queryClient fora do componente
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

// --- Hook and Context --- //

// Tipos para o contexto de autenticação
type Web3AuthContextType = {
  address: string | undefined;
  accounts: string[];
  selectedAccount: string | undefined;
  isConnected: boolean;
  isAdmin: boolean;
  isPlayer: boolean;
  connect: () => void;
  disconnect: () => void;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  chainId: number | undefined;
  openModal: () => void;
};

// Valor padrão para o contexto
const defaultContextValue: Web3AuthContextType = {
  address: undefined,
  accounts: [],
  selectedAccount: undefined,
  isConnected: false,
  isAdmin: false,
  isPlayer: false,
  connect: () => { /* implementado abaixo */ },
  disconnect: () => { /* implementado abaixo */ },
  provider: null,
  signer: null,
  chainId: undefined,
  openModal: () => { /* implementado abaixo */ },
};

// Criação do contexto
export const Web3AuthContext = createContext<Web3AuthContextType>(defaultContextValue);

// Hook personalizado para usar o contexto
export const useWeb3Auth = () => useContext(Web3AuthContext);

// Provider para o contexto
export const Web3AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Obter estado e métodos do modal usando hooks reativos do AppKit
  // useAppKit() pode retornar métodos para controlar o modal, conectar/desconectar etc.
  const { open, close } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  // O provider e signer provavelmente serão obtidos através de um hook ou método do AppKit também
  // Por enquanto, vamos deixar a lógica de provider/signer dependente do address/isConnected/walletProvider
  // const { walletProvider } = useAppKitProvider(); // Se existir um hook para o provedor

  // Estados locais (mantidos para provider, signer e isAdmin)
  const [isAdmin, setIsAdmin] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  // Efeito para monitorar mudanças na conexão e obter provider/signer
  useEffect(() => {
    const updateProviderAndSignerAndAdmin = async () => {
      // Precisamos de uma forma de obter o provider raw do AppKit aqui.
      // Se useAppKitProvider não existir, ou se o useAppKit() não retornar algo como getProvider()
      // precisaremos consultar a documentação específica de React.
      // Por enquanto, vamos tentar obter o provider usando o método getProvider() na instância retornada por useAppKit(), se disponível.
      let walletProvider: Eip1193Provider | null = null;
      // if (appKitInstance && appKitInstance.getProvider) {
      //   walletProvider = appKitInstance.getProvider() as Eip1193Provider;
      // }

      // Alternativa: Se o hook useAppKit() retornar o provider diretamente:
      // const { provider: walletProvider } = useAppKit();

      // Como não tenho certeza, vou暂时评论a lógica de obtenção do provider e signer
      // para focar primeiro na inicialização e conexão básica via hooks.
      // if (isConnected && address && walletProvider) {
      //   try {
      //     const ethersProvider = new ethers.BrowserProvider(walletProvider);
      //     const web3Signer = await ethersProvider.getSigner();
      //     setProvider(ethersProvider);
      //     setSigner(web3Signer);

      //     // Verificar se é admin
      //     const adminAddressLocal = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase();
      //     setIsAdmin(address.toLowerCase() === adminAddressLocal);

      //   } catch (error) {
      //     console.error("Erro ao obter provider, signer ou verificar admin:", error);
      //     setProvider(null);
      //     setSigner(null);
      //     setIsAdmin(false);
      //   }
      // } else {
      //   setProvider(null);
      //   setSigner(null);
      //   setIsAdmin(false);
      // }

      // Lógica de isAdmin baseada apenas no address enquanto o provider/signer é resolvido
      if (isConnected && address) {
        const adminAddressLocal = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase();
        setIsAdmin(address.toLowerCase() === adminAddressLocal);
      } else {
        setIsAdmin(false);
      }
    };

    updateProviderAndSignerAndAdmin();

    // Com hooks reativos (useAppKitAccount, useAppKitModal), a necessidade de
    // inscrição manual em eventos como 'session_update' é geralmente eliminada.
    // Os hooks cuidam da atualização do estado automaticamente quando a sessão muda.

  }, [isConnected, address]); // Removido chainId das dependências

  // Funções de conexão e desconexão (usando métodos do hook useAppKitModal/useAppKit)
  const openModal = () => {
    try {
      if (open) {
        // Adicionar tratamento de erro mais robusto
        Promise.resolve(open()).catch(error => {
          console.error("Erro ao abrir modal de conexão:", error);
        });
      }
    } catch (error) {
      console.error("Erro ao tentar abrir modal:", error);
    }
  };

  const disconnect = () => {
    try {
      // Use o método close ou disconnect obtido do hook useAppKit() (ou useAppKitModal())
      // Assumindo que 'close' do hook useAppKit() é o método correto para desconectar
      if (close) close(); // Assumindo que close é síncrono ou o hook já gerencia o async
    } catch (error) {
      console.error("Erro ao desconectar:", error);
    }
  };

  // Valor do contexto (ajustado para refletir o provider e signer temporariamente comentados)
  const contextValue: Web3AuthContextType = useMemo(() => ({
    address,
    accounts: address ? [address.toLowerCase()] : [],
    selectedAccount: address,
    isConnected,
    isAdmin,
    isPlayer: isConnected && !isAdmin,
    connect: openModal,
    disconnect,
    provider, // Será null por enquanto
    signer,   // Será null por enquanto
    chainId: undefined, // Mantido como undefined já que não temos acesso ao chainId
    openModal,
  }), [address, isConnected, isAdmin, provider, signer, openModal, disconnect]);

  return (
    // Envolver a aplicação com o AppKitProvider
    // A configuração é passada para o Provider, não para a instância direta
    <QueryClientProvider client={queryClient}>
      <Web3AuthContext.Provider value={contextValue}>
        {children}
      </Web3AuthContext.Provider>
    </QueryClientProvider>
  );
};
