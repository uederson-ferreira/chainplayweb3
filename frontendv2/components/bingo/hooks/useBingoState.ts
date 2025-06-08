// components/bingo/hooks/useBingoState.ts - CORREÇÃO DO LOOP INFINITO
"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function useBingoState() {
  // ========================================
  // DADOS DO WAGMI (CARTEIRA)
  // ========================================
  const { address, isConnected, chainId, isConnecting, isReconnecting } = useAccount();

  // ========================================
  // ESTADOS LOCAIS DA UI
  // ========================================
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [currentRoundId, setCurrentRoundId] = useState<bigint>(BigInt(0));
  const [showConnectingState, setShowConnectingState] = useState(false);

  // ========================================
  // REFERÊNCIAS PARA TIMEOUTS E CONTROLE
  // ========================================
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false); // 🔧 NOVO: Evitar re-inicializações
  const lastConnectionState = useRef<boolean>(false); // 🔧 NOVO: Controlar mudanças de estado

  // ========================================
  // VARIÁVEIS COMPUTADAS
  // ========================================
  const isCorrectNetwork = chainId === 1;

  // ========================================
  // FUNÇÃO PARA LIMPAR TIMEOUTS (OTIMIZADA)
  // ========================================
  const clearExistingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []); // 🔧 CORRIGIDO: Array vazio para evitar recriação

  // ========================================
  // EFEITO: DETECTAR INÍCIO DE CONEXÃO (CORRIGIDO)
  // ========================================
  useEffect(() => {
    // 🔧 NOVO: Só processar se houve mudança real de estado
    const currentConnectionState = isConnecting || isReconnecting;
    
    if (currentConnectionState && !lastConnectionState.current) {
      console.log('🔄 Detectado início de conexão...');
      setShowConnectingState(true);
      
      clearExistingTimeout();
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ Timeout de conexão - resetando estado');
        setShowConnectingState(false);
      }, 15000);
    }
    
    // 🔧 NOVO: Atualizar referência do último estado
    lastConnectionState.current = currentConnectionState;
    
  }, [isConnecting, isReconnecting]); // 🔧 CORRIGIDO: Remover clearExistingTimeout das deps

  // ========================================
  // EFEITO: DETECTAR SUCESSO DE CONEXÃO (CORRIGIDO) 
  // ========================================
  useEffect(() => {
    // 🔧 NOVO: Só processar se houve mudança real para conectado
    if (isConnected && showConnectingState && !hasInitialized.current) {
      console.log('✅ Carteira conectada com sucesso!');
      clearExistingTimeout();
      
      timeoutRef.current = setTimeout(() => {
        setShowConnectingState(false);
        hasInitialized.current = true; // 🔧 NOVO: Marcar como inicializado
      }, 1000);
    }
    
    // 🔧 NOVO: Reset da inicialização se desconectar
    if (!isConnected) {
      hasInitialized.current = false;
    }
    
  }, [isConnected, showConnectingState]); // 🔧 CORRIGIDO: Remover clearExistingTimeout das deps

  // ========================================
  // CLEANUP NA DESMONTAGEM (SIMPLIFICADO)
  // ========================================
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []); // 🔧 CORRIGIDO: Array vazio, sem dependências

  // ========================================
  // RETORNO DO HOOK COM TODAS AS PROPRIEDADES
  // ========================================
  return {
    // Dados da carteira (do wagmi)
    address,
    isConnected,
    chainId,
    isConnecting,
    isReconnecting,
    isCorrectNetwork,
    
    // Estados locais da UI
    showCreateModal,
    setShowCreateModal,
    selectedCard,
    setSelectedCard,
    currentRoundId,
    setCurrentRoundId,
    showConnectingState,
    setShowConnectingState,
    
    // Utilitários
    clearExistingTimeout,
  };
}