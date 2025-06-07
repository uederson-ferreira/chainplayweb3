"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { isSupabaseConfigured, getSupabaseInstance, resetSupabaseInstance } from "@/lib/supabase/client"
import Link from 'next/link'
interface DashboardHeaderProps {
  user: any
  profile: any
}

export default function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      // Verificar se é sessão demo
      const demoSession = localStorage.getItem("demo_session")
      if (demoSession) {
        localStorage.removeItem("demo_session")
        router.push("/")
        return
      }

      // Verificar se Supabase está configurado
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseInstance()
        if (supabase) {
          await supabase.auth.signOut()
          // Resetar instância após logout
          resetSupabaseInstance()
        }
      }

      router.push("/")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      // Forçar logout mesmo com erro
      localStorage.removeItem("demo_session")
      resetSupabaseInstance()
      router.push("/")
    }
  }

  return (
    <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            ChainPlayWeb3
          </h1>
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
            BETA
          </span>
          <Link href="/debug/vrf">
          <Button variant="ghost" size="sm">
            🔧 VRF Debug
          </Button>
        </Link>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-slate-700 text-white">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white">{profile?.full_name || "Usuário"}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Settings className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-400 hover:text-white">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
