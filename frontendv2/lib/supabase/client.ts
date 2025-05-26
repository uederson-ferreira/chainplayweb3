import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// Singleton instance
let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

export const createClient = () => {
  // Se já existe uma instância, retorna ela
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validar se as variáveis existem e são URLs válidas
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials not found, some features may not work")
    throw new Error("Supabase URL e Anon Key são obrigatórios")
  }

  // Validar formato da URL
  try {
    new URL(supabaseUrl)
  } catch {
    console.error("Invalid Supabase URL format")
    throw new Error("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida")
  }

  if (supabaseAnonKey.length < 10) {
    console.error("Invalid Supabase anon key")
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY parece inválida")
  }

  try {
    // Criar nova instância apenas se não existir
    supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "x-application-name": "chainplay-web3",
        },
      },
      // Configurações para evitar múltiplas instâncias
      db: {
        schema: "public",
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })

    return supabaseInstance
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    throw error
  }
}

export const isSupabaseConfigured = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return false
  }

  // Verificar se a URL é válida
  try {
    new URL(supabaseUrl)
    return supabaseAnonKey.length > 10
  } catch {
    return false
  }
}

// Função para resetar a instância (útil para testes ou logout completo)
export const resetSupabaseInstance = () => {
  supabaseInstance = null
}

// Função para obter a instância atual (se existir)
export const getSupabaseInstance = () => {
  return supabaseInstance
}
