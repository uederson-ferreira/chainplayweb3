"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import BingoGameWeb3 from "@/components/bingo/bingo-game-web3"
import { isSupabaseConfigured } from "@/lib/supabase/client"

export default function BingoPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar sessão demo primeiro
        const demoSession = localStorage.getItem("demo_session")
        if (demoSession) {
          const session = JSON.parse(demoSession)
          if (session.expires_at > Date.now()) {
            setUser(session.user)
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
          } else {
            router.push("/")
          }
        } else {
          // Sem Supabase e sem sessão demo
          router.push("/")
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push("/")
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <BingoGameWeb3 user={user} />
}
