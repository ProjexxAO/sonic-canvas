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
      atlas_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      csuite_communications: {
        Row: {
          cc_addresses: string[] | null
          content: string | null
          created_at: string
          embedding: string | null
          from_address: string | null
          id: string
          metadata: Json | null
          sent_at: string | null
          source: string
          source_id: string | null
          subject: string | null
          to_addresses: string[] | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cc_addresses?: string[] | null
          content?: string | null
          created_at?: string
          embedding?: string | null
          from_address?: string | null
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          source: string
          source_id?: string | null
          subject?: string | null
          to_addresses?: string[] | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cc_addresses?: string[] | null
          content?: string | null
          created_at?: string
          embedding?: string | null
          from_address?: string | null
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          source?: string
          source_id?: string | null
          subject?: string | null
          to_addresses?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      csuite_connectors: {
        Row: {
          access_token_encrypted: string | null
          created_at: string
          id: string
          last_sync_at: string | null
          metadata: Json | null
          provider: string
          refresh_token_encrypted: string | null
          status: string
          sync_cursor: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider: string
          refresh_token_encrypted?: string | null
          status?: string
          sync_cursor?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: string
          refresh_token_encrypted?: string | null
          status?: string
          sync_cursor?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      csuite_documents: {
        Row: {
          content: string | null
          created_at: string
          embedding: string | null
          file_path: string | null
          file_size: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          source: string
          source_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          embedding?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          source: string
          source_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          embedding?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          source?: string
          source_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      csuite_events: {
        Row: {
          attendees: string[] | null
          created_at: string
          description: string | null
          embedding: string | null
          end_at: string | null
          id: string
          location: string | null
          metadata: Json | null
          source: string
          source_id: string | null
          start_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendees?: string[] | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          source: string
          source_id?: string | null
          start_at?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendees?: string[] | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          source?: string
          source_id?: string | null
          start_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      csuite_financials: {
        Row: {
          amount: number | null
          category: string | null
          counterparty: string | null
          created_at: string
          currency: string | null
          description: string | null
          due_date: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source: string
          source_id: string | null
          status: string | null
          title: string
          transaction_date: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          category?: string | null
          counterparty?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source: string
          source_id?: string | null
          status?: string | null
          title: string
          transaction_date?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          category?: string | null
          counterparty?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          source_id?: string | null
          status?: string | null
          title?: string
          transaction_date?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      csuite_knowledge: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          effective_date: string | null
          embedding: string | null
          expiry_date: string | null
          id: string
          metadata: Json | null
          source: string
          source_id: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
          version: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          effective_date?: string | null
          embedding?: string | null
          expiry_date?: string | null
          id?: string
          metadata?: Json | null
          source: string
          source_id?: string | null
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
          version?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          effective_date?: string | null
          embedding?: string | null
          expiry_date?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          source_id?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      csuite_reports: {
        Row: {
          content: string
          created_at: string
          data_sources: string[] | null
          generated_at: string
          id: string
          metadata: Json | null
          persona: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          data_sources?: string[] | null
          generated_at?: string
          id?: string
          metadata?: Json | null
          persona: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          data_sources?: string[] | null
          generated_at?: string
          id?: string
          metadata?: Json | null
          persona?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      csuite_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          priority: string | null
          project: string | null
          source: string
          source_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          project?: string | null
          source: string
          source_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          project?: string | null
          source?: string
          source_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
