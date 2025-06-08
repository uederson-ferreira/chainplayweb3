// components/bingo/hooks/useTransactionMonitor.ts - VERSÃO ANTI-LOOP
"use client";

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseTransactionMonitorProps {
  hash?: `0x${string}`;
  isConfirmed: boolean;
  isConfirming: boolean;
  onConfirmed?: () => void;
  onPending?: () => void;
}

export function useTransactionMonitor({
  hash,
  isConfirmed,
  isConfirming,
  onConfirmed,
  onPending
}: UseTransactionMonitorProps) {
  const { toast } = useToast();
  
  // 🔧 CORREÇÃO: Usar refs para evitar loops infinitos
  const lastHashRef = useRef<string | undefined>(undefined);
  const hasConfirmedRef = useRef<boolean>(false);
  const hasPendingRef = useRef<boolean>(false);

  // ========================================
  // MONITORAR HASH DA TRANSAÇÃO (ANTI-LOOP)
  // ========================================
  useEffect(() => {
    if (hash && hash !== lastHashRef.current && !isConfirming && !isConfirmed) {
      console.log('📤 Nova transação enviada:', hash);
      
      toast({
        title: "📤 Transação enviada!",
        description: `Hash: ${hash.slice(0, 10)}...${hash.slice(-6)}`,
      });
      
      // 🔧 NOVO: Atualizar refs para evitar re-execução
      lastHashRef.current = hash;
      hasPendingRef.current = true;
      hasConfirmedRef.current = false;
      
      // Callback opcional quando transação é enviada
      if (onPending && !hasPendingRef.current) {
        onPending();
      }
    }
  }, [hash, isConfirming, isConfirmed, toast, onPending]);

  // ========================================
  // MONITORAR CONFIRMAÇÃO DA TRANSAÇÃO (ANTI-LOOP)
  // ========================================
  useEffect(() => {
    if (isConfirming && hash && !hasConfirmedRef.current) {
      console.log('⏳ Transação confirmando...');
      
      toast({
        title: "⏳ Confirmando transação...",
        description: "Aguarde a confirmação na blockchain.",
      });
    }
  }, [isConfirming, hash, toast]);

  // ========================================
  // MONITORAR SUCESSO DA TRANSAÇÃO (ANTI-LOOP)
  // ========================================
  useEffect(() => {
    if (isConfirmed && hash && !hasConfirmedRef.current) {
      console.log('✅ Transação confirmada! Hash:', hash);
      
      toast({
        title: "✅ Transação confirmada!",
        description: "Atualizando dados da interface...",
      });
      
      // 🔧 NOVO: Marcar como confirmado para evitar re-execução
      hasConfirmedRef.current = true;
      
      // Callback opcional quando transação é confirmada
      if (onConfirmed) {
        // 🔧 CORREÇÃO: Aguardar um pouco mais para evitar setState durante render
        setTimeout(() => {
          onConfirmed();
        }, 2000); // 🔧 AUMENTADO: Mais tempo para evitar problemas
      }
    }
  }, [isConfirmed, hash, toast, onConfirmed]);

  // ========================================
  // RESET QUANDO NOVA TRANSAÇÃO INICIA
  // ========================================
  useEffect(() => {
    if (!hash) {
      // 🔧 NOVO: Reset dos refs quando não há transação
      lastHashRef.current = undefined;
      hasConfirmedRef.current = false;
      hasPendingRef.current = false;
    }
  }, [hash]);

  return {
    hasTransaction: !!hash,
    isPending: !!hash && !isConfirming && !isConfirmed,
    isConfirming,
    isConfirmed,
  };
}