export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          operator_handle: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          operator_handle?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          operator_handle?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sonic_agents: {
        Row: {
          capabilities: string[] | null
          class: Database["public"]["Enums"]["agent_class"]
          code_artifact: string | null
          color: string
          created_at: string
          cycles: number
          density: number
          description: string | null
          designation: string
          efficiency: number
          embedding: string | null
          frequency: number
          id: string
          last_active: string
          linked_agents: string[] | null
          modulation: number
          name: string
          sector: Database["public"]["Enums"]["agent_sector"]
          stability: number
          status: Database["public"]["Enums"]["agent_status"]
          user_id: string
          waveform: Database["public"]["Enums"]["waveform_type"]
        }
        Insert: {
          capabilities?: string[] | null
          class?: Database["public"]["Enums"]["agent_class"]
          code_artifact?: string | null
          color?: string
          created_at?: string
          cycles?: number
          density?: number
          description?: string | null
          designation: string
          efficiency?: number
          embedding?: string | null
          frequency?: number
          id?: string
          last_active?: string
          linked_agents?: string[] | null
          modulation?: number
          name: string
          sector?: Database["public"]["Enums"]["agent_sector"]
          stability?: number
          status?: Database["public"]["Enums"]["agent_status"]
          user_id: string
          waveform?: Database["public"]["Enums"]["waveform_type"]
        }
        Update: {
          capabilities?: string[] | null
          class?: Database["public"]["Enums"]["agent_class"]
          code_artifact?: string | null
          color?: string
          created_at?: string
          cycles?: number
          density?: number
          description?: string | null
          designation?: string
          efficiency?: number
          embedding?: string | null
          frequency?: number
          id?: string
          last_active?: string
          linked_agents?: string[] | null
          modulation?: number
          name?: string
          sector?: Database["public"]["Enums"]["agent_sector"]
          stability?: number
          status?: Database["public"]["Enums"]["agent_status"]
          user_id?: string
          waveform?: Database["public"]["Enums"]["waveform_type"]
        }
        Relationships: []
      }
      user_agents: {
        Row: {
          agent_id: string
          assigned_at: string
          assigned_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          agent_id: string
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "sonic_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_agents_by_embedding: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          capabilities: string[]
          code_artifact: string
          description: string
          id: string
          name: string
          sector: string
          similarity: number
        }[]
      }
    }
    Enums: {
      agent_class: "BASIC" | "ADVANCED" | "ELITE" | "SINGULARITY"
      agent_sector:
        | "FINANCE"
        | "BIOTECH"
        | "SECURITY"
        | "DATA"
        | "CREATIVE"
        | "UTILITY"
      agent_status: "IDLE" | "ACTIVE" | "PROCESSING" | "ERROR" | "DORMANT"
      app_role: "superadmin" | "admin" | "user"
      waveform_type: "sine" | "square" | "sawtooth" | "triangle"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_class: ["BASIC", "ADVANCED", "ELITE", "SINGULARITY"],
      agent_sector: [
        "FINANCE",
        "BIOTECH",
        "SECURITY",
        "DATA",
        "CREATIVE",
        "UTILITY",
      ],
      agent_status: ["IDLE", "ACTIVE", "PROCESSING", "ERROR", "DORMANT"],
      app_role: ["superadmin", "admin", "user"],
      waveform_type: ["sine", "square", "sawtooth", "triangle"],
    },
  },
} as const
