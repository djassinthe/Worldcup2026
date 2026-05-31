export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          pseudo: string
          joined_at: string
        }
        Insert: {
          id?: string
          pseudo: string
          joined_at?: string
        }
        Update: {
          id?: string
          pseudo?: string
          joined_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          phase: string
          group_name: string | null
          team_home: string
          team_away: string
          flag_home: string
          flag_away: string
          score_home: number | null
          score_away: number | null
          kickoff_at: string
          is_locked: boolean
          venue: string | null
        }
        Insert: {
          id?: string
          phase: string
          group_name?: string | null
          team_home: string
          team_away: string
          flag_home?: string
          flag_away?: string
          score_home?: number | null
          score_away?: number | null
          kickoff_at: string
          is_locked?: boolean
          venue?: string | null
        }
        Update: {
          id?: string
          phase?: string
          group_name?: string | null
          team_home?: string
          team_away?: string
          flag_home?: string
          flag_away?: string
          score_home?: number | null
          score_away?: number | null
          kickoff_at?: string
          is_locked?: boolean
          venue?: string | null
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string
          player_id: string
          match_id: string
          pred_home: number
          pred_away: number
          points_earned: number | null
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          match_id: string
          pred_home: number
          pred_away: number
          points_earned?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          match_id?: string
          pred_home?: number
          pred_away?: number
          points_earned?: number | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_leaderboard: {
        Args: Record<string, never>
        Returns: {
          player_id: string
          pseudo: string
          total_points: number
          correct_results: number
          exact_scores: number
        }[]
      }
    }
  }
}
