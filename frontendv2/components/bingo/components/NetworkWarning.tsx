// Arquivo: components/bingo/components/NetworkWarning.tsx

import { AlertCircle } from "lucide-react";

interface NetworkWarningProps {
  isCorrectNetwork: boolean;
}

/**
 * Componente que exibe aviso quando o usuário está na rede incorreta
 */
export default function NetworkWarning({ isCorrectNetwork }: NetworkWarningProps) {
  if (isCorrectNetwork) return null;

  return (
    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-4 w-4" />
        <span className="font-medium">Rede Incorreta</span>
      </div>
      <p className="text-sm">
        Você precisa estar conectado à rede local (localhost:8545) para jogar. 
        Use sua carteira para trocar de rede.
      </p>
    </div>
  );
}