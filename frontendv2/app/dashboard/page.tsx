"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import GameCard from "@/components/dashboard/game-card"
//import WalletConnect from "@/components/web3/wallet-connect"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Wallet } from "lucide-react"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  
  // Mova o useAccount para o nível superior do componente
  const { isConnected, address } = useAccount()
  const [accountData, setAccountData] = useState<{ isConnected: boolean; address?: string }>({
    isConnected: false,
  })

  useEffect(() => {
    setMounted(true)
    // Atualize os dados da conta quando o useAccount mudar
    setAccountData({ isConnected, address })
  }, [isConnected, address])

  useEffect(() => {
    if (!mounted) return

    const checkAuth = async () => {
      try {
        // Verificar sessão demo primeiro
        const demoSession = localStorage.getItem("demo_session")
        if (demoSession) {
          const session = JSON.parse(demoSession)
          if (session.expires_at > Date.now()) {
            setUser(session.user)
            setProfile({ full_name: session.user.name })
            setLoading(false)
            return
          } else {
            localStorage.removeItem("demo_session")
          }
        }

        // Verificar se Supabase está configurado
        if (isSupabaseConfigured()) {
          const { createClient } = await import("@/lib/supabase/client")
          const supabase = createClient()

          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session) {
            setUser(session.user)
            // Buscar perfil
            try {
              const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
              setProfile(data)
            } catch (error) {
              console.error("Erro ao buscar perfil:", error)
              // Criar perfil se não existir
              try {
                const { data: newProfile } = await supabase
                  .from("profiles")
                  .insert({
                    id: session.user.id,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0],
                  })
                  .select()
                  .single()
                setProfile(newProfile)
              } catch (insertError) {
                console.error("Erro ao criar perfil:", insertError)
              }
            }
          } else {
            // Se não tem sessão Supabase, criar sessão demo
            createDemoSession()
          }
        } else {
          // Sem Supabase, criar sessão demo
          createDemoSession()
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        createDemoSession()
      }

      setLoading(false)
    }

    const createDemoSession = () => {
      const demoUser = {
        id: "demo-user",
        email: "demo@chainplay.com",
        name: accountData.isConnected
          ? `Wallet User (${accountData.address?.slice(0, 6)}...${accountData.address?.slice(-4)})`
          : "Demo User",
      }

      localStorage.setItem(
        "demo_session",
        JSON.stringify({
          user: demoUser,
          expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
        }),
      )

      setUser(demoUser)
      setProfile({ full_name: demoUser.name })
    }

    checkAuth()
  }, [router, mounted, accountData.isConnected, accountData.address])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Carregando dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <DashboardHeader user={{ email: "guest@chainplay.com" }} profile={{ full_name: "Guest" }} />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-yellow-400" />
                  Acesso Necessário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400">
                  Para acessar o dashboard, você precisa estar autenticado ou ter uma carteira conectada.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/")}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white py-2 px-4 rounded-md"
                  >
                    Voltar ao Início
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Bem-vindo, {profile?.full_name || user.name || user.email}!
          </h1>
          <p className="text-slate-400">Escolha um jogo para começar a jogar</p>
          {accountData.isConnected && (
            <div className="mt-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-400" />
              <span className="text-green-400 text-sm">
                Carteira conectada: {accountData.address?.slice(0, 6)}...{accountData.address?.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {!accountData.isConnected && (
          <div className="mb-8">
            <Card className="bg-blue-900/50 border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-blue-200 font-medium">Conecte sua carteira para funcionalidades Web3</p>
                    <p className="text-blue-300 text-sm">
                      Para jogar Bingo Web3 e interagir com contratos, conecte uma carteira
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GameCard
            title="Bingo Web3"
            description="Jogo de bingo descentralizado com números sorteados via Chainlink VRF"
            image="/placeholder.svg?height=200&width=300"
            href="/bingo"
            status="Disponível"
            players={42}
          />

          <GameCard
            title="Loteria Web3"
            description="Em breve - Sistema de loteria descentralizada"
            image="/placeholder.svg?height=200&width=300"
            href="#"
            status="Em breve"
            players={0}
            disabled
          />

          <GameCard
            title="Cassino Web3"
            description="Em breve - Jogos de cassino descentralizados"
            image="/placeholder.svg?height=200&width=300"
            href="#"
            status="Em breve"
            players={0}
            disabled
          />
        </div>

     {!accountData.isConnected && (
        <div className="mt-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Conectar Carteira</CardTitle>
            </CardHeader>
            <CardContent>
              {/* <WalletConnect /> */}
            </CardContent>
          </Card>
        </div>
      )}
      </main>
    </div>
  )
}