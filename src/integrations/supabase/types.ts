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
      agent_capabilities: {
        Row: {
          agent_id: string
          capability_name: string
          capability_type: string
          cooldown_seconds: number | null
          created_at: string
          description: string | null
          id: string
          invocation_count: number | null
          is_active: boolean | null
          last_invoked_at: string | null
          max_autonomous_actions: number | null
          requires_approval: boolean | null
          trigger_conditions: Json | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          capability_name: string
          capability_type: string
          cooldown_seconds?: number | null
          created_at?: string
          description?: string | null
          id?: string
          invocation_count?: number | null
          is_active?: boolean | null
          last_invoked_at?: string | null
          max_autonomous_actions?: number | null
          requires_approval?: boolean | null
          trigger_conditions?: Json | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          capability_name?: string
          capability_type?: string
          cooldown_seconds?: number | null
          created_at?: string
          description?: string | null
          id?: string
          invocation_count?: number | null
          is_active?: boolean | null
          last_invoked_at?: string | null
          max_autonomous_actions?: number | null
          requires_approval?: boolean | null
          trigger_conditions?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_capabilities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "sonic_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_notifications: {
        Row: {
          action_items: Json | null
          created_at: string
          expires_at: string | null
          id: string
          is_actioned: boolean | null
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          source_agent_id: string | null
          source_agent_name: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_actioned?: boolean | null
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          source_agent_id?: string | null
          source_agent_name?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_items?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_actioned?: boolean | null
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          source_agent_id?: string | null
          source_agent_name?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_task_queue: {
        Row: {
          agent_suggestions: Json | null
          assigned_agents: string[] | null
          completed_at: string | null
          created_at: string
          id: string
          input_data: Json | null
          orchestration_mode: string | null
          output_data: Json | null
          progress: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          task_description: string | null
          task_priority: string | null
          task_title: string
          task_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_suggestions?: Json | null
          assigned_agents?: string[] | null
          completed_at?: string | null
          created_at?: string
          id?: string
          input_data?: Json | null
          orchestration_mode?: string | null
          output_data?: Json | null
          progress?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          task_description?: string | null
          task_priority?: string | null
          task_title: string
          task_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_suggestions?: Json | null
          assigned_agents?: string[] | null
          completed_at?: string | null
          created_at?: string
          id?: string
          input_data?: Json | null
          orchestration_mode?: string | null
          output_data?: Json | null
          progress?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          task_description?: string | null
          task_priority?: string | null
          task_title?: string
          task_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      atlas_workflow_runs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          result_data: Json | null
          started_at: string
          status: string
          trigger_data: Json | null
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          result_data?: Json | null
          started_at?: string
          status?: string
          trigger_data?: Json | null
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          result_data?: Json | null
          started_at?: string
          status?: string
          trigger_data?: Json | null
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atlas_workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "atlas_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      atlas_workflows: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          trigger_config: Json | null
          trigger_count: number
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          trigger_config?: Json | null
          trigger_count?: number
          trigger_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          trigger_config?: Json | null
          trigger_count?: number
          trigger_type?: string
          updated_at?: string
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
      organization_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          agent_cluster_id: string | null
          compliance_mode: Database["public"]["Enums"]["compliance_mode"]
          created_at: string
          data_retention_days: number
          domain: string | null
          id: string
          industry: string | null
          name: string
          orchestrator_tenant_id: string | null
          owner_user_id: string
          plan: Database["public"]["Enums"]["org_plan"]
          size: number | null
          sso_enabled: boolean
          updated_at: string
          workspace_visibility: string
        }
        Insert: {
          agent_cluster_id?: string | null
          compliance_mode?: Database["public"]["Enums"]["compliance_mode"]
          created_at?: string
          data_retention_days?: number
          domain?: string | null
          id?: string
          industry?: string | null
          name: string
          orchestrator_tenant_id?: string | null
          owner_user_id: string
          plan?: Database["public"]["Enums"]["org_plan"]
          size?: number | null
          sso_enabled?: boolean
          updated_at?: string
          workspace_visibility?: string
        }
        Update: {
          agent_cluster_id?: string | null
          compliance_mode?: Database["public"]["Enums"]["compliance_mode"]
          created_at?: string
          data_retention_days?: number
          domain?: string | null
          id?: string
          industry?: string | null
          name?: string
          orchestrator_tenant_id?: string | null
          owner_user_id?: string
          plan?: Database["public"]["Enums"]["org_plan"]
          size?: number | null
          sso_enabled?: boolean
          updated_at?: string
          workspace_visibility?: string
        }
        Relationships: []
      }
      persona_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          created_by: string | null
          domain: string
          id: string
          persona_id: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          created_by?: string | null
          domain: string
          id?: string
          persona_id: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          created_by?: string | null
          domain?: string
          id?: string
          persona_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          atlas_agent_profile_id: string | null
          atlas_voice_profile_id: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          last_active_at: string | null
          locale: string | null
          operator_handle: string | null
          preferred_persona: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          atlas_agent_profile_id?: string | null
          atlas_voice_profile_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_active_at?: string | null
          locale?: string | null
          operator_handle?: string | null
          preferred_persona?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          atlas_agent_profile_id?: string | null
          atlas_voice_profile_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_active_at?: string | null
          locale?: string | null
          operator_handle?: string | null
          preferred_persona?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          timezone?: string | null
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
      tool_catalog: {
        Row: {
          auto_invokable: boolean | null
          capabilities: string[] | null
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          tool_id: string
        }
        Insert: {
          auto_invokable?: boolean | null
          capabilities?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          tool_id: string
        }
        Update: {
          auto_invokable?: boolean | null
          capabilities?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          tool_id?: string
        }
        Relationships: []
      }
      tool_governance: {
        Row: {
          boost: number | null
          created_at: string
          created_by: string | null
          id: string
          level: Database["public"]["Enums"]["governance_level"]
          level_id: string
          reason: string | null
          status: Database["public"]["Enums"]["tool_permission_status"]
          tool_id: string
          updated_at: string
        }
        Insert: {
          boost?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          level: Database["public"]["Enums"]["governance_level"]
          level_id: string
          reason?: string | null
          status?: Database["public"]["Enums"]["tool_permission_status"]
          tool_id: string
          updated_at?: string
        }
        Update: {
          boost?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          level?: Database["public"]["Enums"]["governance_level"]
          level_id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["tool_permission_status"]
          tool_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_governance_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tool_catalog"
            referencedColumns: ["tool_id"]
          },
        ]
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
      user_ui_preferences: {
        Row: {
          created_at: string
          defaults_config: Json | null
          id: string
          layout_config: Json | null
          shortcuts_config: Json | null
          theme_config: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          defaults_config?: Json | null
          id?: string
          layout_config?: Json | null
          shortcuts_config?: Json | null
          theme_config?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          defaults_config?: Json | null
          id?: string
          layout_config?: Json | null
          shortcuts_config?: Json | null
          theme_config?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          assigned_agent_cluster_id: string | null
          assigned_persona: string | null
          can_delete_workspace: boolean
          can_export_reports: boolean
          can_issue_voice_commands: boolean
          can_manage_connectors: boolean
          can_manage_members: boolean
          can_manage_personas: boolean
          can_merge_agents: boolean
          can_retire_agents: boolean
          can_spawn_agents: boolean
          can_view_data: boolean
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          assigned_agent_cluster_id?: string | null
          assigned_persona?: string | null
          can_delete_workspace?: boolean
          can_export_reports?: boolean
          can_issue_voice_commands?: boolean
          can_manage_connectors?: boolean
          can_manage_members?: boolean
          can_manage_personas?: boolean
          can_merge_agents?: boolean
          can_retire_agents?: boolean
          can_spawn_agents?: boolean
          can_view_data?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          assigned_agent_cluster_id?: string | null
          assigned_persona?: string | null
          can_delete_workspace?: boolean
          can_export_reports?: boolean
          can_issue_voice_commands?: boolean
          can_manage_connectors?: boolean
          can_manage_members?: boolean
          can_manage_personas?: boolean
          can_merge_agents?: boolean
          can_retire_agents?: boolean
          can_spawn_agents?: boolean
          can_view_data?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_tool_permissions: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          section: string
          tool_id: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          section: string
          tool_id: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          section?: string
          tool_id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_tool_permissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          agent_cluster_id: string | null
          created_at: string
          created_by: string
          data_domains_enabled: string[] | null
          data_scope: string
          default_persona: string | null
          id: string
          insight_cadence: Database["public"]["Enums"]["insight_cadence"]
          name: string
          org_id: string | null
          type: Database["public"]["Enums"]["workspace_type"]
          updated_at: string
          visibility: string
        }
        Insert: {
          agent_cluster_id?: string | null
          created_at?: string
          created_by: string
          data_domains_enabled?: string[] | null
          data_scope?: string
          default_persona?: string | null
          id?: string
          insight_cadence?: Database["public"]["Enums"]["insight_cadence"]
          name: string
          org_id?: string | null
          type?: Database["public"]["Enums"]["workspace_type"]
          updated_at?: string
          visibility?: string
        }
        Update: {
          agent_cluster_id?: string | null
          created_at?: string
          created_by?: string
          data_domains_enabled?: string[] | null
          data_scope?: string
          default_persona?: string | null
          id?: string
          insight_cadence?: Database["public"]["Enums"]["insight_cadence"]
          name?: string
          org_id?: string | null
          type?: Database["public"]["Enums"]["workspace_type"]
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_agent_tool_permissions: {
        Args: { _agent_id: string; _user_id?: string; _workspace_id?: string }
        Returns: {
          effective_boost: number
          final_status: Database["public"]["Enums"]["tool_permission_status"]
          source_level: Database["public"]["Enums"]["governance_level"]
          source_reason: string
          tool_id: string
          tool_name: string
        }[]
      }
      get_governance_rules_by_level: {
        Args: {
          _level: Database["public"]["Enums"]["governance_level"]
          _level_id: string
        }
        Returns: {
          boost: number
          created_at: string
          id: string
          reason: string
          status: Database["public"]["Enums"]["tool_permission_status"]
          tool_id: string
          tool_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_workspace_permission: {
        Args: { _permission: string; _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
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
      compliance_mode: "standard" | "gdpr" | "hipaa" | "enterprise"
      governance_level: "persona" | "industry" | "workspace" | "user" | "agent"
      insight_cadence: "daily" | "weekly" | "monthly" | "manual"
      org_plan: "free" | "personal" | "pro" | "team" | "enterprise"
      tool_permission_status: "allowed" | "blocked" | "preferred"
      user_status: "active" | "invited" | "disabled"
      waveform_type: "sine" | "square" | "sawtooth" | "triangle"
      workspace_role: "owner" | "admin" | "editor" | "viewer"
      workspace_type: "personal" | "team" | "department" | "client" | "project"
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
      compliance_mode: ["standard", "gdpr", "hipaa", "enterprise"],
      governance_level: ["persona", "industry", "workspace", "user", "agent"],
      insight_cadence: ["daily", "weekly", "monthly", "manual"],
      org_plan: ["free", "personal", "pro", "team", "enterprise"],
      tool_permission_status: ["allowed", "blocked", "preferred"],
      user_status: ["active", "invited", "disabled"],
      waveform_type: ["sine", "square", "sawtooth", "triangle"],
      workspace_role: ["owner", "admin", "editor", "viewer"],
      workspace_type: ["personal", "team", "department", "client", "project"],
    },
  },
} as const
