import '@testing-library/jest-dom';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ethers } from 'ethers';
import CreateCardForm from '../CreateCardForm.js';
import { useContracts } from '../../../lib/hooks/useContracts.js';
import { useWeb3Auth } from '../../../lib/hooks/useWeb3Auth.js';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';
import type { MockedFunction } from 'jest-mock';

interface MockTransactionResult {
  wait: () => Promise<Record<string, never>>;
}

// Definindo o tipo correto para o mock
type MockWaitFunction = jest.Mock<() => Promise<Record<string, never>>>;

// Mock dos hooks
jest.mock('../../../lib/hooks/useContracts');
jest.mock('../../../lib/hooks/useWeb3Auth');
jest.mock('@reown/appkit/react');

describe('CreateCardForm', () => {
  // Mock do contrato
  // @ts-ignore
  const mockCartelaContract = {
    criarCartela: jest.fn()
  };

  // Mock do hook useContracts
  const mockUseContracts = useContracts as jest.Mock;
  mockUseContracts.mockReturnValue({
    cartelaContract: mockCartelaContract,
    isLoading: false,
    error: null
  });

  // Mock do hook useWeb3Auth
  const mockUseWeb3Auth = useWeb3Auth as jest.Mock;
  mockUseWeb3Auth.mockReturnValue({
    isConnected: true,
    address: '0x123...',
  });

  // Mock do hook useAppKitAccount
  const mockUseAppKitAccount = useAppKitAccount as jest.Mock;
  mockUseAppKitAccount.mockReturnValue({
    isConnected: true,
    address: '0x123...',
  });

  // Mock do hook useAppKit
  const mockUseAppKit = useAppKit as jest.Mock;
  mockUseAppKit.mockReturnValue({
    open: jest.fn(),
  });

  beforeEach(() => {
    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('deve renderizar o formulário corretamente', () => {
    render(<CreateCardForm />);
    
    expect(screen.getByText('Criar Nova Cartela')).toBeInTheDocument();
    expect(screen.getByLabelText('Número de Linhas')).toBeInTheDocument();
    expect(screen.getByLabelText('Número de Colunas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar Cartela' })).toBeInTheDocument();
  });

  it('deve mostrar mensagem de conexão quando não conectado', () => {
    mockUseWeb3Auth.mockReturnValue({
      isConnected: false,
      address: undefined,
    });

    render(<CreateCardForm />);
    
    expect(screen.getByText('Conecte sua wallet para criar uma cartela')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conectar Wallet' })).toBeInTheDocument();
  });

  it('deve chamar o contrato ao submeter o formulário', async () => {
    // @ts-expect-error - Mock do contrato para teste
    const mockWait = jest.fn().mockResolvedValue({}) as jest.MockedFunction<() => Promise<Record<string, never>>>;
    const mockTransaction: MockTransactionResult = {
      wait: mockWait
    };
    // @ts-ignore
    mockCartelaContract.criarCartela.mockResolvedValue(mockTransaction);

    render(<CreateCardForm />);
    
    // Preencher o formulário
    fireEvent.change(screen.getByLabelText('Número de Linhas'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Número de Colunas'), { target: { value: '5' } });
    
    // Submeter o formulário
    fireEvent.click(screen.getByRole('button', { name: 'Criar Cartela' }));
    
    await waitFor(() => {
      expect(mockCartelaContract.criarCartela).toHaveBeenCalledWith(5, 5);
      expect(screen.getByText('Cartela criada com sucesso! Aguarde a confirmação da transação.')).toBeInTheDocument();
    });
  });

  it('deve mostrar erro quando o contrato falhar', async () => {
    const errorMessage = 'Erro ao criar cartela';
    // @ts-ignore
    mockCartelaContract.criarCartela.mockRejectedValue(new Error(errorMessage));

    render(<CreateCardForm />);
    
    // Preencher e submeter o formulário
    fireEvent.change(screen.getByLabelText('Número de Linhas'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Número de Colunas'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Cartela' }));
    
    await waitFor(() => {
      expect(screen.getByText(`Erro ao criar cartela: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('deve abrir o modal de conexão quando não conectado e tentar criar cartela', async () => {
    mockUseWeb3Auth.mockReturnValue({
      isConnected: false,
      address: undefined,
    });

    const mockOpen = jest.fn();
    mockUseAppKit.mockReturnValue({
      open: mockOpen,
    });

    render(<CreateCardForm />);
    
    // Tentar criar cartela sem estar conectado
    fireEvent.click(screen.getByRole('button', { name: 'Conectar Wallet' }));
    
    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect', namespace: 'eip155' });
  });

  it('deve validar os limites dos campos de linhas e colunas', async () => {
    render(<CreateCardForm />);
    
    const inputLinhas = screen.getByLabelText('Número de Linhas');
    const inputColunas = screen.getByLabelText('Número de Colunas');
    
    // Testar valor mínimo
    fireEvent.change(inputLinhas, { target: { value: '0' } });
    fireEvent.change(inputColunas, { target: { value: '0' } });
    expect(inputLinhas).toBeInvalid();
    expect(inputColunas).toBeInvalid();
    
    // Testar valor máximo
    fireEvent.change(inputLinhas, { target: { value: '11' } });
    fireEvent.change(inputColunas, { target: { value: '11' } });
    expect(inputLinhas).toBeInvalid();
    expect(inputColunas).toBeInvalid();
    
    // Testar valores válidos
    fireEvent.change(inputLinhas, { target: { value: '5' } });
    fireEvent.change(inputColunas, { target: { value: '5' } });
    expect(inputLinhas).toBeValid();
    expect(inputColunas).toBeValid();
  });

  it('deve mostrar estado de carregamento durante a criação da cartela', async () => {
    const mockWait = jest.fn<() => Promise<Record<string, never>>>(() => 
      Promise.resolve({} as Record<string, never>)
    );
    const mockTransaction: MockTransactionResult = {
      wait: mockWait
    };
    // @ts-ignore
    mockCartelaContract.criarCartela.mockResolvedValue(mockTransaction);

    render(<CreateCardForm />);
    
    // Preencher o formulário
    fireEvent.change(screen.getByLabelText('Número de Linhas'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Número de Colunas'), { target: { value: '5' } });
    
    // Submeter o formulário
    fireEvent.click(screen.getByRole('button', { name: 'Criar Cartela' }));
    
    // Verificar estado de carregamento
    expect(screen.getByRole('button', { name: 'Criando...' })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Criar Cartela' })).toBeInTheDocument();
    });
  });

  it('deve resetar o formulário após criar cartela com sucesso', async () => {
    const mockWait = jest.fn<() => Promise<Record<string, never>>>(() => 
      Promise.resolve({} as Record<string, never>)
    );
    const mockTransaction: MockTransactionResult = {
      wait: mockWait
    };
    // @ts-ignore
    mockCartelaContract.criarCartela.mockResolvedValue(mockTransaction);

    render(<CreateCardForm />);
    
    // Preencher o formulário com valores diferentes dos padrões
    fireEvent.change(screen.getByLabelText('Número de Linhas'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Número de Colunas'), { target: { value: '8' } });
    
    // Submeter o formulário
    fireEvent.click(screen.getByRole('button', { name: 'Criar Cartela' }));
    
    await waitFor(() => {
      // Verificar se os campos voltaram aos valores padrão
      expect(screen.getByLabelText('Número de Linhas')).toHaveValue(5);
      expect(screen.getByLabelText('Número de Colunas')).toHaveValue(5);
    });
  });

  it('deve mostrar erro quando o contrato não está inicializado', async () => {
    mockUseContracts.mockReturnValue({
      cartelaContract: null,
      isLoading: false,
      error: null
    });

    render(<CreateCardForm />);
    
    // Preencher e submeter o formulário
    fireEvent.change(screen.getByLabelText('Número de Linhas'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Número de Colunas'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Cartela' }));
    
    await waitFor(() => {
      expect(screen.getByText('Contrato não inicializado. Verifique sua conexão.')).toBeInTheDocument();
    });
  });

  it('deve mostrar erro do contrato quando disponível', () => {
    const contractError = 'Erro de conexão com o contrato';
    mockUseContracts.mockReturnValue({
      cartelaContract: mockCartelaContract,
      isLoading: false,
      error: contractError
    });

    render(<CreateCardForm />);
    
    expect(screen.getByText(contractError)).toBeInTheDocument();
  });
}); 