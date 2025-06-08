// components/bingo/BingoGameWrapper.tsx - WRAPPER COM SUSPENSE
"use client";

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { User } from "@supabase/supabase-js";

// 🔧 CORREÇÃO: Carregamento dinâmico para evitar problemas de hidratação
const BingoGameWeb3 = dynamic(
  () => import('./bingo-game-web3'),
  { 
    ssr: false, // 🔧 CRÍTICO: Desabilitar SSR para componentes com wagmi
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Carregando Bingo Web3...</h2>
          <p className="text-slate-400">Inicializando contratos e interface</p>
        </div>
      </div>
    )
  }
);

interface BingoGameWrapperProps {
  user: User;
}

export default function BingoGameWrapper({ user }: BingoGameWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  // 🔧 CORREÇÃO: Aguardar montagem do componente no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🔧 CORREÇÃO: Não renderizar até estar completamente montado
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-12 w-12 bg-cyan-400 rounded-full mx-auto mb-4"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Preparando Jogo...</h2>
          <p className="text-slate-400">Aguarde a inicialização</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Inicializando Web3...</h2>
          <p className="text-slate-400">Conectando com blockchain</p>
        </div>
      </div>
    }>
      <BingoGameWeb3 user={user} />
    </Suspense>
  );
}