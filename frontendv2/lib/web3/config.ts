import { createConfig, http } from "wagmi"
import { localhost, mainnet, sepolia } from "wagmi/chains"
import { injected, walletConnect } from "wagmi/connectors"
import type { Chain } from "wagmi/chains"

// Configuração da rede local COMPLETA
export const localChain: Chain = {
  id: 1,
  name: "Local Anvil Fork",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "Local Explorer",
      url: "http://localhost:8545",
    },
  },
  testnet: true,
}

// Configuração Wagmi
export const config = createConfig({
  chains: [localChain, sepolia, mainnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "fallback-project-id",
      showQrModal: false, // ← ADICIONE ISSO
      qrModalOptions: {
        themeMode: 'dark'
      }
    }),
  ],
  transports: {
    [localChain.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
})

// Endereços dos contratos
export const CONTRACTS = {
  CARTELA: process.env.NEXT_PUBLIC_CARTELA_CONTRACT_ADDRESS as `0x${string}`,
  BINGO: process.env.NEXT_PUBLIC_BINGO_CONTRACT_ADDRESS as `0x${string}`,
}