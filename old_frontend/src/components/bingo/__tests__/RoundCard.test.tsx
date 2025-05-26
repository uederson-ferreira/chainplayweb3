import '@testing-library/jest-dom';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoundCard from '../RoundCard.js';
import { useContracts } from '../../../lib/hooks/useContracts.js';
import { EstadoRodada } from '../../../lib/config.js';

// Mock dos hooks
jest.mock('../../../lib/hooks/useContracts');

describe('RoundCard', () => {
  // Mock do contrato
  type RodadaInfo = {
    id: number;
    estado: EstadoRodada;
    numeroMaximo: number;
    ultimoRequestId: number;
    pedidoVrfPendente: boolean;
    premiosDistribuidos: boolean;
  };
  const mockBingoGameContract = {
    rodadas: jest.fn() as jest.Mock<(rodadaId: number) => Promise<RodadaInfo>>
  };

  // Mock do hook useContracts
  const mockUseContracts = useContracts as jest.Mock;
  mockUseContracts.mockReturnValue({
    bingoGameContract: mockBingoGameContract,
    isLoading: false,
    error: null
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o card corretamente com informações básicas', async () => {
    // Mock dos dados da rodada
    mockBingoGameContract.rodadas.mockResolvedValue({
      id: 1,
      estado: EstadoRodada.Aberta,
      numeroMaximo: 99,
      ultimoRequestId: 0,
      pedidoVrfPendente: false,
      premiosDistribuidos: false
    });

    render(<RoundCard rodadaId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Rodada #1')).toBeInTheDocument();
      expect(screen.getByText('Número máximo: 99')).toBeInTheDocument();
      expect(screen.getByText('Aberta')).toBeInTheDocument();
    });
  });

  it('deve mostrar estado de carregamento', () => {
    mockUseContracts.mockReturnValue({
      bingoGameContract: mockBingoGameContract,
      isLoading: true,
      error: null
    });

    render(<RoundCard rodadaId={1} />);
    
    expect(screen.getByTestId('loading-card')).toBeInTheDocument();
  });

  it('deve mostrar erro quando falhar ao carregar dados', async () => {
    const errorMessage = 'Erro ao carregar rodada';
    mockBingoGameContract.rodadas.mockRejectedValue(new Error(errorMessage));

    render(<RoundCard rodadaId={1} />);

    await waitFor(() => {
      expect(screen.getByText(`Erro ao carregar informações: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('deve mostrar botão de participar quando rodada está aberta', async () => {
    mockBingoGameContract.rodadas.mockResolvedValue({
      id: 1,
      estado: EstadoRodada.Aberta,
      numeroMaximo: 99,
      ultimoRequestId: 0,
      pedidoVrfPendente: false,
      premiosDistribuidos: false
    });

    const onParticipate = jest.fn();
    render(<RoundCard rodadaId={1} onParticipate={onParticipate} />);

    await waitFor(() => {
      const participarButton = screen.getByRole('button', { name: 'Participar' });
      expect(participarButton).toBeInTheDocument();
      
      fireEvent.click(participarButton);
      expect(onParticipate).toHaveBeenCalled();
    });
  });

  it('deve mostrar botão de sortear quando rodada está aberta e sem sorteio pendente', async () => {
    mockBingoGameContract.rodadas.mockResolvedValue({
      id: 1,
      estado: EstadoRodada.Aberta,
      numeroMaximo: 99,
      ultimoRequestId: 0,
      pedidoVrfPendente: false,
      premiosDistribuidos: false
    });

    const onDrawNumber = jest.fn();
    render(<RoundCard rodadaId={1} onDrawNumber={onDrawNumber} />);

    await waitFor(() => {
      const sortearButton = screen.getByRole('button', { name: 'Sortear Número' });
      expect(sortearButton).toBeInTheDocument();
      
      fireEvent.click(sortearButton);
      expect(onDrawNumber).toHaveBeenCalled();
    });
  });

  it('deve mostrar botão de distribuir prêmios quando rodada está finalizada', async () => {
    mockBingoGameContract.rodadas.mockResolvedValue({
      id: 1,
      estado: EstadoRodada.Finalizada,
      numeroMaximo: 99,
      ultimoRequestId: 0,
      pedidoVrfPendente: false,
      premiosDistribuidos: false
    });

    const onDistributePrizes = jest.fn();
    render(<RoundCard rodadaId={1} onDistributePrizes={onDistributePrizes} />);

    await waitFor(() => {
      const distribuirButton = screen.getByRole('button', { name: 'Distribuir Prêmios' });
      expect(distribuirButton).toBeInTheDocument();
      
      fireEvent.click(distribuirButton);
      expect(onDistributePrizes).toHaveBeenCalled();
    });
  });

  it('deve mostrar mensagem de sorteio em andamento', async () => {
    mockBingoGameContract.rodadas.mockResolvedValue({
      id: 1,
      estado: EstadoRodada.Sorteando,
      numeroMaximo: 99,
      ultimoRequestId: 1,
      pedidoVrfPendente: true,
      premiosDistribuidos: false
    });

    render(<RoundCard rodadaId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Sorteio em andamento...')).toBeInTheDocument();
    });
  });

  it('deve mostrar mensagem de prêmios distribuídos', async () => {
    mockBingoGameContract.rodadas.mockResolvedValue({
      id: 1,
      estado: EstadoRodada.Finalizada,
      numeroMaximo: 99,
      ultimoRequestId: 0,
      pedidoVrfPendente: false,
      premiosDistribuidos: true
    });

    render(<RoundCard rodadaId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Prêmios distribuídos')).toBeInTheDocument();
    });
  });
}); 