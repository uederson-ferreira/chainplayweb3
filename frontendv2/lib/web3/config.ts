import { createConfig, http } from "wagmi"
import { localhost, mainnet, sepolia } from "wagmi/chains"
import { injected, walletConnect } from "wagmi/connectors"

// Configuração da rede local
export const localChain = {
  ...localhost,
  id: 31337,
  name: "Local Network",
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"],
    },
  },
}

// Configuração Wagmi independente
export const config = createConfig({
  chains: [localChain, sepolia, mainnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "fallback-project-id",
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
