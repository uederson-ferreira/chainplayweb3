export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      bingo_cards: {
        Row: {
          id: string
          user_id: string | null
          card_data: any
          rows: number
          columns: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          card_data: any
          rows: number
          columns: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          card_data?: any
          rows?: number
          columns?: number
        }
      }
      game_rounds: {
        Row: {
          id: string
          round_number: number
          max_number: number
          drawn_numbers: number[]
          status: "waiting" | "active" | "finished"
          winner_id: string | null
          created_at: string
          finished_at: string | null
        }
        Insert: {
          id?: string
          round_number: number
          max_number: number
          drawn_numbers?: number[]
          status?: "waiting" | "active" | "finished"
          winner_id?: string | null
          created_at?: string
          finished_at?: string | null
        }
        Update: {
          id?: string
          round_number?: number
          max_number?: number
          drawn_numbers?: number[]
          status?: "waiting" | "active" | "finished"
          winner_id?: string | null
          finished_at?: string | null
        }
      }
      game_participations: {
        Row: {
          id: string
          round_id: string | null
          user_id: string | null
          card_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          round_id?: string | null
          user_id?: string | null
          card_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          round_id?: string | null
          user_id?: string | null
          card_id?: string | null
        }
      }
    }
  }
}
