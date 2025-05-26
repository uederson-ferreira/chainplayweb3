import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./types"

// Cache para instância do servidor (por request)
const serverInstances = new Map<string, ReturnType<typeof createSupabaseServerClient<Database>>>()

export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL e Anon Key são obrigatórios")
  }

  // Validar formato da URL
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida")
  }

  // Criar chave única para este request
  const requestKey = `${supabaseUrl}-${supabaseAnonKey}`

  // Verificar se já existe instância para este request
  if (serverInstances.has(requestKey)) {
    return serverInstances.get(requestKey)!
  }

  const cookieStore = cookies()

  const client = createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Ignorar erros de cookie em contexto de servidor
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // Ignorar erros de cookie em contexto de servidor
        }
      },
    },
    auth: {
      persistSession: false, // No servidor não persistimos sessão
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  // Armazenar instância no cache
  serverInstances.set(requestKey, client)

  return client
}

export const isSupabaseConfigured = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return false
  }

  try {
    new URL(supabaseUrl)
    return supabaseAnonKey.length > 10
  } catch {
    return false
  }
}

// Limpar cache de instâncias (útil para testes)
export const clearServerInstances = () => {
  serverInstances.clear()
}
