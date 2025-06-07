// frontendv2/components/dashboard/AdminRoundManager.tsx
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useWriteContract } from "wagmi";
import { parseEther } from "viem";

import { BINGO_ABI } from "@/lib/web3/contracts/abis";
import deployment from "@/lib/web3/contracts/deployment.json";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const bingoContractConfig = {
  address: deployment.bingoContract as `0x${string}`,
  abi: BINGO_ABI,
};

export function AdminRoundManager() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  
  const { data: hash, isPending, writeContract } = useWriteContract({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "🎉 Transação Enviada!", description: `Hash: ${data}` });
      },
      onError: (error) => {
        toast({ title: "❌ Erro na Transação", description: error.message, variant: "destructive" });
      },
    },
  });

  // Estado do formulário para criar uma nova rodada
  const [roundParams, setRoundParams] = useState({
    maxNumbers: "75",
    entryFee: "0.01",
    timeoutHours: "1",
    winPatterns: [true, true, true, false], // [Linha, Coluna, Diagonal, Cartela]
  });
  
  const handleCreateRound = () => {
    if (!isConnected) {
      toast({ title: "❌ Carteira não conectada", variant: "destructive" });
      return;
    }

    const [linha, coluna, diagonal, cartela] = roundParams.winPatterns;
    
    writeContract({
      ...bingoContractConfig,
      functionName: "iniciarRodada",
      args: [
        Number(roundParams.maxNumbers),
        parseEther(roundParams.entryFee),
        BigInt(Number(roundParams.timeoutHours) * 3600),
        [linha, coluna, diagonal, cartela],
      ],
    });
  };
  
  // (Opcional) Lógica para sortear número
  const [roundIdToSort, setRoundIdToSort] = useState("0");
  const handleDrawNumber = () => {
    writeContract({
        ...bingoContractConfig,
        functionName: "sortearNumero",
        args: [BigInt(roundIdToSort)]
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Rodadas (Admin)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário para criar rodada */}
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Nova Rodada</h3>
            <div>
                <Label>Taxa de Entrada (ETH)</Label>
                <Input value={roundParams.entryFee} onChange={e => setRoundParams(p => ({...p, entryFee: e.target.value}))} />
            </div>
            <Button onClick={handleCreateRound} disabled={isPending} className="w-full">
                {isPending ? "Criando..." : "🚀 Iniciar Nova Rodada"}
            </Button>
        </div>
        
        {/* Formulário para sortear número */}
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Sortear Número</h3>
            <div>
                <Label>ID da Rodada</Label>
                <Input value={roundIdToSort} onChange={e => setRoundIdToSort(e.target.value)} />
            </div>
            <Button onClick={handleDrawNumber} disabled={isPending} className="w-full">
                {isPending ? "Sorteando..." : "🎲 Sortear Número"}
            </Button>
        </div>

        {hash && <p className="text-xs break-all">Último Hash: {hash}</p>}
      </CardContent>
    </Card>
  );
}