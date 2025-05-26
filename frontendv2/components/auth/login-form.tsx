"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Github, Chrome, CheckCircle, Play } from "lucide-react"
import { useRouter } from "next/navigation"

// Instância única do Supabase para este componente
let supabaseClient: any = null

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar se o Supabase está configurado
    const checkSupabaseConfig = async () => {
      try {
        const { isSupabaseConfigured, createClient } = await import("@/lib/supabase/client")
        const configured = isSupabaseConfigured()
        setSupabaseConfigured(configured)

        // Criar instância única se configurado
        if (configured && !supabaseClient) {
          supabaseClient = createClient()
        }
      } catch (error) {
        setSupabaseConfigured(false)
      }
    }
    checkSupabaseConfig()
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    if (!supabaseConfigured) {
      // Modo demo - simular login
      if (email === "demo@chainplay.com" && password === "demo123") {
        localStorage.setItem(
          "demo_session",
          JSON.stringify({
            user: { id: "demo-user", email, name: "Demo User" },
            expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
          }),
        )
        router.push("/dashboard")
      } else {
        setMessage("Use: demo@chainplay.com / demo123 para o modo demo")
      }
      setLoading(false)
      return
    }

    try {
      if (!supabaseClient) {
        const { createClient } = await import("@/lib/supabase/client")
        supabaseClient = createClient()
      }

      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      setMessage("Erro ao conectar com o Supabase")
      console.error(error)
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    if (!supabaseConfigured) {
      // Modo demo - simular cadastro
      localStorage.setItem(
        "demo_session",
        JSON.stringify({
          user: { id: "demo-user", email, name: fullName || "Demo User" },
          expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
        }),
      )
      setMessage("Conta demo criada! Você já está logado.")
      setTimeout(() => router.push("/dashboard"), 1500)
      setLoading(false)
      return
    }

    try {
      if (!supabaseClient) {
        const { createClient } = await import("@/lib/supabase/client")
        supabaseClient = createClient()
      }

      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage("Verifique seu email para confirmar a conta!")
      }
    } catch (error) {
      setMessage("Erro ao conectar com o Supabase")
      console.error(error)
    }
    setLoading(false)
  }

  const handleSocialLogin = async (provider: "google" | "github") => {
    if (!supabaseConfigured) {
      setMessage("Login social disponível apenas com Supabase configurado")
      return
    }

    setLoading(true)
    try {
      if (!supabaseClient) {
        const { createClient } = await import("@/lib/supabase/client")
        supabaseClient = createClient()
      }

      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        setMessage(error.message)
      }
    } catch (error) {
      setMessage("Erro ao conectar com o Supabase")
      console.error(error)
    }
    setLoading(false)
  }

  const handleDemoAccess = () => {
    // Acesso direto ao demo
    localStorage.setItem(
      "demo_session",
      JSON.stringify({
        user: { id: "demo-user", email: "demo@chainplay.com", name: "Demo User" },
        expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
      }),
    )
    router.push("/dashboard")
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          {supabaseConfigured && <CheckCircle className="h-5 w-5 mr-2 text-green-400" />}
          Bem-vindo ao ChainPlayWeb3
        </CardTitle>
        <CardDescription className="text-slate-400">
          {supabaseConfigured ? "Entre ou crie sua conta para jogar" : "Teste a plataforma no modo demonstração"}
        </CardDescription>

        {supabaseConfigured && (
          <div className="bg-green-900/50 text-green-400 border border-green-700 p-3 rounded-md text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Supabase Conectado</span>
            </div>
            <p className="text-xs mt-1">Autenticação completa disponível com login social</p>
          </div>
        )}

        {!supabaseConfigured && (
          <div className="bg-blue-900/50 text-blue-400 border border-blue-700 p-3 rounded-md text-sm">
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-4 w-4" />
              <span className="font-medium">Modo Demonstração</span>
            </div>
            <p className="text-xs">
              O Supabase não está configurado. Você pode testar todas as funcionalidades Web3 no modo demo.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {supabaseConfigured ? (
          <>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                <TabsTrigger value="signin" className="text-white">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-white">
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    disabled={loading}
                  >
                    {loading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-800 px-2 text-slate-400">Ou continue com</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin("google")}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <Chrome className="h-4 w-4 mr-2" />
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSocialLogin("github")}
                  disabled={loading}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </Button>
              </div>
            </div>

            <div className="mt-4">
              <Button variant="ghost" onClick={handleDemoAccess} className="w-full text-slate-400 hover:text-white">
                Continuar sem login (Demo)
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-4">
              <h3 className="text-lg font-medium text-white mb-2">Experimente o ChainPlayWeb3</h3>
              <p className="text-sm text-slate-400 mb-4">
                Teste todas as funcionalidades Web3 sem necessidade de cadastro
              </p>
            </div>

            <Button
              onClick={handleDemoAccess}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Entrar no Modo Demo
            </Button>

            <div className="bg-blue-900/50 text-blue-400 border border-blue-700 p-3 rounded-md text-sm">
              <h4 className="font-medium mb-1">Funcionalidades disponíveis no demo:</h4>
              <ul className="text-xs space-y-1">
                <li>• Conexão de carteira Web3</li>
                <li>• Criação de cartelas on-chain</li>
                <li>• Participação em jogos de Bingo</li>
                <li>• Sorteios via Chainlink VRF</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-xs text-slate-500">Conecte sua carteira e comece a jogar imediatamente!</p>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`mt-4 p-3 rounded-md text-sm ${
              message.includes("Verifique") || message.includes("criada")
                ? "bg-green-900/50 text-green-400 border border-green-700"
                : "bg-red-900/50 text-red-400 border border-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
