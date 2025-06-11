"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Zap, Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { BINGO_ABI } from "@/lib/web3/contracts/abis";
import deployment from "@/lib/web3/contracts/deployment.json";
import {
  useBingoContract,
  useIsOperator,
} from "@/lib/web3/hooks/use-bingo-contract";

// ===== ADICIONAR IMPORT DO publicClient =====
import { createPublicClient, http } from "viem";
import { CONTRACTS, localChain } from "@/lib/web3/config";

// ===== CRIAR publicClient =====
const publicClient = createPublicClient({
  chain: localChain,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL!),
});

const bingoContractConfig = {
  address: CONTRACTS.BINGO,
  abi: BINGO_ABI,
};

export default function AdminRoundsPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { isOperator, isLoading: isLoadingOperator } = useIsOperator();

  // Hook customizado para ações do Bingo
  const { iniciarRodada, hash, isPending, isConfirming, isConfirmed, error } =
    useBingoContract();

  // Estados do formulário
  const [formData, setFormData] = useState({
    numeroMaximo: "75",
    taxaEntrada: "0.01",
    timeoutHoras: "1",
    padroesVitoria: {
      linha: true,
      coluna: true,
      diagonal: true,
      cartelaCompleta: false,
    },
  });

  // Estados para buscar rodadas
  const [activeRounds, setActiveRounds] = useState<any[]>([]);
  const [isLoadingRounds, setIsLoadingRounds] = useState(true);

  // Buscar total de rodadas
  const { data: totalRodadas, isLoading: isLoadingTotal } = useReadContract({
    ...bingoContractConfig,
    functionName: "getTotalRodadas",
  });

  // Buscar rodadas ativas
  const fetchActiveRounds = async () => {
    if (!isConnected || !totalRodadas) return;

    setIsLoadingRounds(true);
    try {
      const total = Number(totalRodadas);
      console.log("🔍 Total de rodadas:", total);

      if (total === 0) {
        setActiveRounds([]);
        setIsLoadingRounds(false);
        return;
      }

      // Buscar dados de todas as rodadas
      const rounds = [];
      for (let i = 0; i < total; i++) {
        try {
          const roundData = await publicClient.readContract({
            ...bingoContractConfig,
            functionName: "rodadas",
            args: [BigInt(i)],
          });

          if (roundData && roundData[1] === 1) {
            // Estado ABERTA
            rounds.push({
              id: roundData[0],
              estado: roundData[1],
              numeroMaximo: roundData[2],
              taxaEntrada: roundData[6],
              premioTotal: roundData[7],
              timestampInicio: roundData[8],
              timeoutRodada: roundData[9],
            });
          }
        } catch (error) {
          console.error(`Erro ao buscar rodada ${i}:`, error);
        }
      }

      console.log("🎯 Rodadas ativas encontradas:", rounds);
      setActiveRounds(rounds);
    } catch (error) {
      console.error("Erro ao buscar rodadas:", error);
      toast({
        title: "Erro ao buscar rodadas",
        description: "Não foi possível carregar as rodadas ativas",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRounds(false);
    }
  };

  // Carregar rodadas quando conectar
  useEffect(() => {
    if (isConnected && totalRodadas !== undefined) {
      fetchActiveRounds();
    }
  }, [isConnected, totalRodadas]);

  // Monitorar transações confirmadas
  useEffect(() => {
    if (isConfirmed) {
      toast({
        title: "✅ Rodada criada com sucesso!",
        description: "A nova rodada está ativa para participações",
      });

      // Recarregar rodadas após 3 segundos
      setTimeout(() => {
        fetchActiveRounds();
      }, 3000);
    }
  }, [isConfirmed]);

  // Criar nova rodada
  const handleCreateRound = async () => {
    if (!isConnected) {
      toast({
        title: "Carteira não conectada",
        description: "Conecte sua carteira primeiro",
        variant: "destructive",
      });
      return;
    }

    if (!isOperator) {
      toast({
        title: "Sem permissão",
        description: "Você precisa ser operador para criar rodadas",
        variant: "destructive",
      });
      return;
    }

    try {
      const numeroMaximo = parseInt(formData.numeroMaximo);
      const taxaEntrada = parseEther(formData.taxaEntrada);
      const timeoutRodada = BigInt(parseInt(formData.timeoutHoras) * 3600);
      const padroesVitoria = [
        formData.padroesVitoria.linha,
        formData.padroesVitoria.coluna,
        formData.padroesVitoria.diagonal,
        formData.padroesVitoria.cartelaCompleta,
      ];

      console.log("🚀 Criando rodada com parâmetros:", {
        numeroMaximo,
        taxaEntrada: formData.taxaEntrada + " ETH",
        timeoutHoras: formData.timeoutHoras + "h",
        padroesVitoria,
      });

      await iniciarRodada(
        numeroMaximo,
        taxaEntrada,
        timeoutRodada,
        padroesVitoria
      );

      toast({
        title: "Criando rodada...",
        description: "Transação enviada. Aguarde confirmação.",
      });
    } catch (error: any) {
      console.error("Erro ao criar rodada:", error);
      toast({
        title: "Erro ao criar rodada",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // Sortear número
  const handleDrawNumber = async (roundId: string) => {
    if (!isOperator) {
      toast({
        title: "Sem permissão",
        description: "Você precisa ser operador para sortear números",
        variant: "destructive",
      });
      return;
    }

    try {
      // Aqui você chamaria sortearNumero do hook
      toast({
        title: "Sorteando número...",
        description: `Solicitando sorteio para rodada #${roundId}`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sortear",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Carteira Necessária
            </h2>
            <p className="text-slate-400 mb-4">
              Conecte sua carteira para acessar a administração
            </p>
            <Link href="/bingo">
              <Button variant="outline">Voltar ao Jogo</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/bingo">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Jogo
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Administração de Rodadas
            </h1>
            {isLoadingOperator ? (
              <Badge variant="outline">Verificando...</Badge>
            ) : isOperator ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Operador
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                Sem Permissão
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Criação */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Nova Rodada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isOperator && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-200 text-sm">
                      ⚠️ Você não tem permissão de operador. Apenas visualização
                      disponível.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Número Máximo</Label>
                    <Input
                      type="number"
                      min="10"
                      max="99"
                      value={formData.numeroMaximo}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          numeroMaximo: e.target.value,
                        }))
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={!isOperator}
                    />
                    <p className="text-xs text-slate-400">
                      Números de 1 a {formData.numeroMaximo}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Taxa de Entrada (ETH)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={formData.taxaEntrada}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          taxaEntrada: e.target.value,
                        }))
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={!isOperator}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Duração (horas)</Label>
                  <Input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={formData.timeoutHoras}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        timeoutHoras: e.target.value,
                      }))
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={!isOperator}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-white">Padrões de Vitória</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: "linha", label: "Linha Completa" },
                      { key: "coluna", label: "Coluna Completa" },
                      { key: "diagonal", label: "Diagonal Completa" },
                      { key: "cartelaCompleta", label: "Cartela Completa" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          id={key}
                          checked={
                            formData.padroesVitoria[
                              key as keyof typeof formData.padroesVitoria
                            ]
                          }
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              padroesVitoria: {
                                ...prev.padroesVitoria,
                                [key]: checked,
                              },
                            }))
                          }
                          disabled={!isOperator}
                        />
                        <Label htmlFor={key} className="text-sm text-slate-300">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCreateRound}
                  disabled={!isOperator || isPending || isConfirming}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                >
                  {isPending
                    ? "Enviando..."
                    : isConfirming
                    ? "Confirmando..."
                    : "Criar Rodada"}
                </Button>

                {hash && (
                  <p className="text-xs text-slate-400 break-all">
                    Transação: {hash}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Rodadas Ativas */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Rodadas Ativas ({activeRounds.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRounds ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
                    <p className="text-slate-400 text-sm mt-2">Carregando...</p>
                  </div>
                ) : activeRounds.length > 0 ? (
                  <div className="space-y-3">
                    {activeRounds.map((round) => (
                      <div
                        key={round.id.toString()}
                        className="p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            Rodada #{round.id.toString()}
                          </span>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Ativa
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400 space-y-1">
                          <p>Taxa: {formatEther(round.taxaEntrada)} ETH</p>
                          <p>Números: 1-{round.numeroMaximo}</p>
                          <p>Prêmio: {formatEther(round.premioTotal)} ETH</p>
                        </div>
                        {isOperator && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleDrawNumber(round.id.toString())
                            }
                            className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-orange-500"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Sortear Número
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">
                      Nenhuma rodada ativa
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total de Rodadas:</span>
                  <span className="text-white">
                    {totalRodadas?.toString() || "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rodadas Ativas:</span>
                  <span className="text-white">{activeRounds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sua Permissão:</span>
                  <span
                    className={isOperator ? "text-green-400" : "text-red-400"}
                  >
                    {isOperator ? "Operador" : "Usuário"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
