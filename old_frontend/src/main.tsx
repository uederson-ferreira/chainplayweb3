import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App.js';
import './index.css';

// Importar WagmiProvider e createConfig
// import { createConfig, WagmiProvider } from '@wagmi/core'; // Removido ou comentado

// Importar a configuração do ethers do nosso hook
// import { ethersConfig } from './lib/hooks/useWeb3Auth'; // Não necessário se não usar createConfig aqui

// Criar a configuração do Wagmi (usando a configuração base do ethers que já fizemos)
// const wagmiConfig = createConfig(ethersConfig); // Removido ou comentado


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Envolver a aplicação com o WagmiProvider */}
    {/* <WagmiProvider config={wagmiConfig}> */}
      {/* O Web3AuthProvider ainda é necessário para o nosso contexto personalizado */} 
      {/* Note: Web3Modal itself doesn't strictly need a separate provider in the app tree if using global instance & hooks directly */}
      {/* Mas o nosso Web3AuthProvider encapsula nossa própria lógica e contexto derivedos */}
      {/* Vamos manter o Web3AuthProvider por enquanto, ele consome os hooks do modal global */}
      
      {/* A estrutura recomendada pode variar ligeiramente dependendo da versão e adapters */}
      {/* A combinação de WagmiProvider e Web3AuthProvider (que usa hooks do modal global) é comum */}
      
      {/* Seu componente App e todo o resto estarão dentro do provedor Wagmi */}
      <App />
      
    {/* </WagmiProvider> */}
  </React.StrictMode>,
); 