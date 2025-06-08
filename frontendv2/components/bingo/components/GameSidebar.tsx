// Arquivo: components/bingo/components/GameSidebar.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WalletConnect from "@/components/web3/wallet-connect";
import GameStats from "../game-stats";
import { CONTRACTS } from "@/lib/web3/config";

interface GameSidebarProps {
  userCards: any[];
  precoBase?: bigint;
}

/**
 * Sidebar do jogo com informações do contrato e instruções
 */
export default function GameSidebar({ userCards, precoBase }: GameSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Wallet Connect Card */}
      <WalletConnect />
      
      {/* Game Stats */}
      <GameStats userCards={userCards} activeRound={null} />

      {/* Informações do Contrato */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Contratos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div>
            <p className="text-slate-400">Cartela:</p>
            <p className="text-slate-300 font-mono break-all">
              {CONTRACTS.CARTELA}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Bingo:</p>
            <p className="text-slate-300 font-mono break-all">
              {CONTRACTS.BINGO}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Rede:</p>
            <p className="text-slate-300">Local Network (Chain ID: 1)</p>
          </div>
          {precoBase && (
            <div>
              <p className="text-slate-400">Preço da Cartela:</p>
              <p className="text-slate-300">
                {(Number(precoBase) / 1e18).toFixed(4)} ETH
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Como Jogar */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Como Jogar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-400">
          <p>1. Conecte sua carteira à rede local</p>
          <p>2. Crie uma cartela on-chain</p>
          <p>3. <strong>Clique "Registrar Números"</strong> na cartela</p>
          <p>4. Participe de uma rodada ativa</p>
          <p>5. Aguarde sorteios via Chainlink VRF</p>
          <p>6. Complete padrões para ganhar!</p>
        </CardContent>
      </Card>
    </div>
  );
}