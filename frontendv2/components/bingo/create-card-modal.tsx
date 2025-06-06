"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, Info } from "lucide-react"

interface CreateCardModalProps {
  onClose: () => void
  onCreateCard: (rows: number, columns: number) => void
}

export default function CreateCardModal({ onClose, onCreateCard }: CreateCardModalProps) {
  const [rows, setRows] = useState(5)
  const [columns, setColumns] = useState(5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateCard(rows, columns)
  }

  const totalNumbers = rows * columns

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Nova Cartela</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-slate-400">
            Configure as dimensões da sua cartela de bingo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rows" className="text-white">
                  Linhas
                </Label>
                <Input
                  id="rows"
                  type="number"
                  min="3"
                  max="10"
                  value={rows}
                  onChange={(e) => setRows(Number.parseInt(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="columns" className="text-white">
                  Colunas
                </Label>
                <Input
                  id="columns"
                  type="number"
                  min="3"
                  max="10"
                  value={columns}
                  onChange={(e) => setColumns(Number.parseInt(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* Informações da cartela */}
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
              <div className="text-sm text-blue-200 space-y-1">
                <p><strong>Dimensões:</strong> {rows} × {columns}</p>
                <p><strong>Total de números:</strong> {totalNumbers}</p>
                <p><strong>Preço:</strong> ~0.01 ETH + gas</p>
              </div>
            </div>

            {/* Aviso importante */}
            <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-200">
                  <p className="font-medium mb-1">Processo de criação:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Pagar taxa de criação (~0.01 ETH)</li>
                    <li>Aguardar confirmação da blockchain</li>
                    <li><strong>Clicar em "Registrar Números"</strong> na cartela criada</li>
                    <li>Pagar gas para registrar {totalNumbers} números únicos</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Cartela
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}