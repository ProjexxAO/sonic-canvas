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
      automation_webhooks: {
        Row: {
          created_at: string
          description: string | null
          error_count: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_triggered_at: string | null
          metadata: Json | null
          name: string
          provider: string
          trigger_conditions: Json | null
          trigger_count: number | null
          trigger_type: string
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          error_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_triggered_at?: string | null
          metadata?: Json | null
          name: string
          provider?: string
          trigger_conditions?: Json | null
          trigger_count?: number | null
          trigger_type: string
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          error_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_triggered_at?: string | null
          metadata?: Json | null
          name?: string
          provider?: string
          trigger_conditions?: Json | null
          trigger_count?: number | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          access_token_encrypted: string | null
          account_name: string
          account_number_masked: string | null
          account_type: string
          available_balance: number | null
          connection_id: string | null
          connection_provider: string | null
          created_at: string
          currency: string
          current_balance: number | null
          id: string
          institution_logo_url: string | null
          institution_name: string
          is_active: boolean | null
          is_primary: boolean | null
          last_sync_at: string | null
          metadata: Json | null
          sync_error: string | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_name: string
          account_number_masked?: string | null
          account_type?: string
          available_balance?: number | null
          connection_id?: string | null
          connection_provider?: string | null
          created_at?: string
          currency?: string
          current_balance?: number | null
          id?: string
          institution_logo_url?: string | null
          institution_name: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_name?: string
          account_number_masked?: string | null
          account_type?: string
          available_balance?: number | null
          connection_id?: string | null
          connection_provider?: string | null
          created_at?: string
          currency?: string
          current_balance?: number | null
          id?: string
          institution_logo_url?: string | null
          institution_name?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          category: string | null
          created_at: string
          currency: string
          description: string
          external_id: string | null
          id: string
          is_pending: boolean | null
          merchant_category: string | null
          merchant_name: string | null
          metadata: Json | null
          posted_date: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          category?: string | null
          created_at?: string
          currency?: string
          description: string
          external_id?: string | null
          id?: string
          is_pending?: boolean | null
          merchant_category?: string | null
          merchant_name?: string | null
          metadata?: Json | null
          posted_date?: string | null
          transaction_date: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          category?: string | null
          created_at?: string
          currency?: string
          description?: string
          external_id?: string | null
          id?: string
          is_pending?: boolean | null
          merchant_category?: string | null
          merchant_name?: string | null
          metadata?: Json | null
          posted_date?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          id: string
          is_muted: boolean | null
          joined_at: string
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "communication_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      code_evolutions: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          compatibility_score: number | null
          created_at: string
          entity_id: string | null
          entity_name: string
          entity_type: string
          evolution_status: string
          evolution_type: string
          evolved_code: string | null
          id: string
          improvement_analysis: Json | null
          integration_plan: Json | null
          performance_impact: Json | null
          risk_assessment: Json | null
          rollback_available: boolean | null
          rollback_data: Json | null
          sonic_signature: Json
          source_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          compatibility_score?: number | null
          created_at?: string
          entity_id?: string | null
          entity_name: string
          entity_type?: string
          evolution_status?: string
          evolution_type?: string
          evolved_code?: string | null
          id?: string
          improvement_analysis?: Json | null
          integration_plan?: Json | null
          performance_impact?: Json | null
          risk_assessment?: Json | null
          rollback_available?: boolean | null
          rollback_data?: Json | null
          sonic_signature?: Json
          source_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          compatibility_score?: number | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string
          entity_type?: string
          evolution_status?: string
          evolution_type?: string
          evolved_code?: string | null
          id?: string
          improvement_analysis?: Json | null
          integration_plan?: Json | null
          performance_impact?: Json | null
          risk_assessment?: Json | null
          rollback_available?: boolean | null
          rollback_data?: Json | null
          sonic_signature?: Json
          source_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      communication_channels: {
        Row: {
          avatar_url: string | null
          channel_type: Database["public"]["Enums"]["channel_type"]
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_archived: boolean | null
          metadata: Json | null
          name: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          channel_type?: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          channel_type?: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_messages: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          atlas_draft_context: Json | null
          attachments: Json | null
          bcc_addresses: string[] | null
          cc_addresses: string[] | null
          channel_id: string | null
          content: string
          content_html: string | null
          created_at: string
          drafted_by_atlas: boolean | null
          embedding: string | null
          external_id: string | null
          from_address: string | null
          id: string
          is_incoming: boolean | null
          is_pinned: boolean | null
          is_starred: boolean | null
          metadata: Json | null
          parent_message_id: string | null
          platform: Database["public"]["Enums"]["communication_platform"]
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          subject: string | null
          thread_root_id: string | null
          to_addresses: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          atlas_draft_context?: Json | null
          attachments?: Json | null
          bcc_addresses?: string[] | null
          cc_addresses?: string[] | null
          channel_id?: string | null
          content: string
          content_html?: string | null
          created_at?: string
          drafted_by_atlas?: boolean | null
          embedding?: string | null
          external_id?: string | null
          from_address?: string | null
          id?: string
          is_incoming?: boolean | null
          is_pinned?: boolean | null
          is_starred?: boolean | null
          metadata?: Json | null
          parent_message_id?: string | null
          platform?: Database["public"]["Enums"]["communication_platform"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          thread_root_id?: string | null
          to_addresses?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          atlas_draft_context?: Json | null
          attachments?: Json | null
          bcc_addresses?: string[] | null
          cc_addresses?: string[] | null
          channel_id?: string | null
          content?: string
          content_html?: string | null
          created_at?: string
          drafted_by_atlas?: boolean | null
          embedding?: string | null
          external_id?: string | null
          from_address?: string | null
          id?: string
          is_incoming?: boolean | null
          is_pinned?: boolean | null
          is_starred?: boolean | null
          metadata?: Json | null
          parent_message_id?: string | null
          platform?: Database["public"]["Enums"]["communication_platform"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          thread_root_id?: string | null
          to_addresses?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "communication_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "communication_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_messages_thread_root_id_fkey"
            columns: ["thread_root_id"]
            isOneToOne: false
            referencedRelation: "communication_messages"
            referencedColumns: ["id"]
          },
        ]
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
          current_version_id: string | null
          embedding: string | null
          file_path: string | null
          file_size: number | null
          id: string
          last_versioned_at: string | null
          metadata: Json | null
          mime_type: string | null
          source: string
          source_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          version: string | null
          version_count: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          current_version_id?: string | null
          embedding?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          last_versioned_at?: string | null
          metadata?: Json | null
          mime_type?: string | null
          source: string
          source_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
          version?: string | null
          version_count?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          current_version_id?: string | null
          embedding?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          last_versioned_at?: string | null
          metadata?: Json | null
          mime_type?: string | null
          source?: string
          source_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          version?: string | null
          version_count?: number | null
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
          current_version_id: string | null
          effective_date: string | null
          embedding: string | null
          expiry_date: string | null
          id: string
          last_versioned_at: string | null
          metadata: Json | null
          source: string
          source_id: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
          version: string | null
          version_count: number | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          current_version_id?: string | null
          effective_date?: string | null
          embedding?: string | null
          expiry_date?: string | null
          id?: string
          last_versioned_at?: string | null
          metadata?: Json | null
          source: string
          source_id?: string | null
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
          version?: string | null
          version_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          current_version_id?: string | null
          effective_date?: string | null
          embedding?: string | null
          expiry_date?: string | null
          id?: string
          last_versioned_at?: string | null
          metadata?: Json | null
          source?: string
          source_id?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          version?: string | null
          version_count?: number | null
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
      dashboard_activity: {
        Row: {
          action: string
          created_at: string | null
          dashboard_id: string
          id: string
          item_id: string | null
          item_type: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          dashboard_id: string
          id?: string
          item_id?: string | null
          item_type?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          dashboard_id?: string
          id?: string
          item_id?: string | null
          item_type?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_activity_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "shared_dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_files: {
        Row: {
          created_at: string | null
          dashboard_id: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          dashboard_id: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          dashboard_id?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_files_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "shared_dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          dashboard_id: string
          id: string
          is_edited: boolean | null
          mentions: string[] | null
          reply_to_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          dashboard_id: string
          id?: string
          is_edited?: boolean | null
          mentions?: string[] | null
          reply_to_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          dashboard_id?: string
          id?: string
          is_edited?: boolean | null
          mentions?: string[] | null
          reply_to_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_messages_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "shared_dashboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "dashboard_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_notifications: {
        Row: {
          actor_id: string
          created_at: string | null
          dashboard_id: string
          id: string
          is_read: boolean | null
          message: string | null
          notification_type: string
          reference_id: string | null
          reference_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          dashboard_id: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          dashboard_id?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_notifications_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "shared_dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          content: string | null
          created_at: string
          document_id: string
          document_type: string
          id: string
          is_current: boolean
          is_enhanced: boolean
          is_summary: boolean
          metadata: Json | null
          parent_version_id: string | null
          title: string
          version_number: string
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          content?: string | null
          created_at?: string
          document_id: string
          document_type?: string
          id?: string
          is_current?: boolean
          is_enhanced?: boolean
          is_summary?: boolean
          metadata?: Json | null
          parent_version_id?: string | null
          title: string
          version_number: string
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          content?: string | null
          created_at?: string
          document_id?: string
          document_type?: string
          id?: string
          is_current?: boolean
          is_enhanced?: boolean
          is_summary?: boolean
          metadata?: Json | null
          parent_version_id?: string | null
          title?: string
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sync_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_count: number | null
          id: string
          job_type: string
          last_error: string | null
          metadata: Json | null
          platform: string
          platform_connection_id: string | null
          priority: number | null
          processed_items: number | null
          progress: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          sync_cursor: string | null
          total_items: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          id?: string
          job_type: string
          last_error?: string | null
          metadata?: Json | null
          platform: string
          platform_connection_id?: string | null
          priority?: number | null
          processed_items?: number | null
          progress?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          sync_cursor?: string | null
          total_items?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          id?: string
          job_type?: string
          last_error?: string | null
          metadata?: Json | null
          platform?: string
          platform_connection_id?: string | null
          priority?: number | null
          processed_items?: number | null
          progress?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          sync_cursor?: string | null
          total_items?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sync_jobs_platform_connection_id_fkey"
            columns: ["platform_connection_id"]
            isOneToOne: false
            referencedRelation: "platform_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      email_tracking_aggregates: {
        Row: {
          bounce_rate: number | null
          click_rate: number | null
          created_at: string
          id: string
          metadata: Json | null
          open_rate: number | null
          period_end: string
          period_start: string
          period_type: string
          total_bounced: number | null
          total_clicked: number | null
          total_delivered: number | null
          total_opened: number | null
          total_sent: number | null
          unique_clicks: number | null
          unique_opens: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bounce_rate?: number | null
          click_rate?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          open_rate?: number | null
          period_end: string
          period_start: string
          period_type: string
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          unique_clicks?: number | null
          unique_opens?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bounce_rate?: number | null
          click_rate?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          open_rate?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          unique_clicks?: number | null
          unique_opens?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_tracking_events: {
        Row: {
          created_at: string
          event_type: string
          geo_location: Json | null
          id: string
          ip_address: string | null
          link_id: string | null
          link_url: string | null
          message_id: string | null
          metadata: Json | null
          recipient_email: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          geo_location?: Json | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          link_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          geo_location?: Json | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          link_url?: string | null
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "communication_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_insights: {
        Row: {
          actioned_at: string | null
          created_at: string
          data: Json | null
          description: string
          expires_at: string | null
          id: string
          impact_amount: number | null
          impact_currency: string | null
          insight_type: string
          is_actioned: boolean | null
          is_read: boolean | null
          priority: string
          recommendation: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          actioned_at?: string | null
          created_at?: string
          data?: Json | null
          description: string
          expires_at?: string | null
          id?: string
          impact_amount?: number | null
          impact_currency?: string | null
          insight_type: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          priority?: string
          recommendation?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          actioned_at?: string | null
          created_at?: string
          data?: Json | null
          description?: string
          expires_at?: string | null
          id?: string
          impact_amount?: number | null
          impact_currency?: string | null
          insight_type?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          priority?: string
          recommendation?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_at: string
          habit_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          habit_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          habit_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "personal_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_access: {
        Row: {
          access_level: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          hub_type: Database["public"]["Enums"]["hub_type"]
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          access_level?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          hub_type: Database["public"]["Enums"]["hub_type"]
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          access_level?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          hub_type?: Database["public"]["Enums"]["hub_type"]
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      item_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_edited: boolean | null
          mentions: string[] | null
          shared_item_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentions?: string[] | null
          shared_item_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          mentions?: string[] | null
          shared_item_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_comments_shared_item_id_fkey"
            columns: ["shared_item_id"]
            isOneToOne: false
            referencedRelation: "shared_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_discoveries: {
        Row: {
          application_areas: string[] | null
          applied_at: string | null
          applied_to: string[] | null
          confidence_score: number | null
          created_at: string
          detailed_content: string | null
          domain: string
          id: string
          is_applied: boolean | null
          metadata: Json | null
          source_query: string | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          application_areas?: string[] | null
          applied_at?: string | null
          applied_to?: string[] | null
          confidence_score?: number | null
          created_at?: string
          detailed_content?: string | null
          domain: string
          id?: string
          is_applied?: boolean | null
          metadata?: Json | null
          source_query?: string | null
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          application_areas?: string[] | null
          applied_at?: string | null
          applied_to?: string[] | null
          confidence_score?: number | null
          created_at?: string
          detailed_content?: string | null
          domain?: string
          id?: string
          is_applied?: boolean | null
          metadata?: Json | null
          source_query?: string | null
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mail_merge_campaigns: {
        Row: {
          body_html_template: string | null
          body_template: string
          completed_at: string | null
          created_at: string
          description: string | null
          failed_count: number | null
          from_address: string | null
          id: string
          merge_fields: string[] | null
          metadata: Json | null
          name: string
          platform: string | null
          scheduled_at: string | null
          sent_count: number | null
          settings: Json | null
          started_at: string | null
          status: string
          subject_template: string
          total_recipients: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_html_template?: string | null
          body_template: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          failed_count?: number | null
          from_address?: string | null
          id?: string
          merge_fields?: string[] | null
          metadata?: Json | null
          name: string
          platform?: string | null
          scheduled_at?: string | null
          sent_count?: number | null
          settings?: Json | null
          started_at?: string | null
          status?: string
          subject_template: string
          total_recipients?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_html_template?: string | null
          body_template?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          failed_count?: number | null
          from_address?: string | null
          id?: string
          merge_fields?: string[] | null
          metadata?: Json | null
          name?: string
          platform?: string | null
          scheduled_at?: string | null
          sent_count?: number | null
          settings?: Json | null
          started_at?: string | null
          status?: string
          subject_template?: string
          total_recipients?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mail_merge_recipients: {
        Row: {
          campaign_id: string
          created_at: string
          email: string
          error_message: string | null
          id: string
          merge_data: Json | null
          message_id: string | null
          sent_at: string | null
          status: string
          tracking_events: Json | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          merge_data?: Json | null
          message_id?: string | null
          sent_at?: string | null
          status?: string
          tracking_events?: Json | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          merge_data?: Json | null
          message_id?: string | null
          sent_at?: string | null
          status?: string
          tracking_events?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_merge_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mail_merge_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_merge_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "communication_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "communication_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "communication_messages"
            referencedColumns: ["id"]
          },
        ]
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
      personal_goals: {
        Row: {
          category: string | null
          created_at: string
          current_value: number | null
          description: string | null
          id: string
          start_date: string
          status: string | null
          target_date: string | null
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          start_date?: string
          status?: string | null
          target_date?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          start_date?: string
          status?: string | null
          target_date?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_habits: {
        Row: {
          created_at: string
          current_streak: number | null
          description: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_completed_at: string | null
          longest_streak: number | null
          name: string
          reminder_time: string | null
          target_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          description?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          longest_streak?: number | null
          name: string
          reminder_time?: string | null
          target_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          longest_streak?: number | null
          name?: string
          reminder_time?: string | null
          target_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_items: {
        Row: {
          ai_summary: string | null
          ai_tags: string[] | null
          completed_at: string | null
          content: string | null
          created_at: string
          due_date: string | null
          embedding: string | null
          id: string
          item_type: string
          metadata: Json | null
          parent_item_id: string | null
          priority: string | null
          recurrence_rule: string | null
          reminder_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          completed_at?: string | null
          content?: string | null
          created_at?: string
          due_date?: string | null
          embedding?: string | null
          id?: string
          item_type: string
          metadata?: Json | null
          parent_item_id?: string | null
          priority?: string | null
          recurrence_rule?: string | null
          reminder_at?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          ai_tags?: string[] | null
          completed_at?: string | null
          content?: string | null
          created_at?: string
          due_date?: string | null
          embedding?: string | null
          id?: string
          item_type?: string
          metadata?: Json | null
          parent_item_id?: string | null
          priority?: string | null
          recurrence_rule?: string | null
          reminder_at?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_items_parent_item_id_fkey"
            columns: ["parent_item_id"]
            isOneToOne: false
            referencedRelation: "personal_items"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_connections: {
        Row: {
          access_token_encrypted: string | null
          account_email: string | null
          account_name: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          metadata: Json | null
          platform: Database["public"]["Enums"]["communication_platform"]
          refresh_token_encrypted: string | null
          settings: Json | null
          sync_cursor: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_email?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          platform: Database["public"]["Enums"]["communication_platform"]
          refresh_token_encrypted?: string | null
          settings?: Json | null
          sync_cursor?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_email?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          platform?: Database["public"]["Enums"]["communication_platform"]
          refresh_token_encrypted?: string | null
          settings?: Json | null
          sync_cursor?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
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
      recurring_patterns: {
        Row: {
          amount_max: number | null
          amount_min: number | null
          category: string | null
          confidence_score: number | null
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          description: string
          frequency: string
          id: string
          is_active: boolean | null
          is_essential: boolean | null
          last_occurrence: string | null
          merchant_pattern: string | null
          metadata: Json | null
          next_expected: string | null
          pattern_type: string
          typical_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_max?: number | null
          amount_min?: number | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description: string
          frequency: string
          id?: string
          is_active?: boolean | null
          is_essential?: boolean | null
          last_occurrence?: string | null
          merchant_pattern?: string | null
          metadata?: Json | null
          next_expected?: string | null
          pattern_type: string
          typical_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_max?: number | null
          amount_min?: number | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          is_essential?: boolean | null
          last_occurrence?: string | null
          merchant_pattern?: string | null
          metadata?: Json | null
          next_expected?: string | null
          pattern_type?: string
          typical_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_dashboard_members: {
        Row: {
          can_comment: boolean | null
          can_share: boolean | null
          can_upload: boolean | null
          dashboard_id: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          can_comment?: boolean | null
          can_share?: boolean | null
          can_upload?: boolean | null
          dashboard_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          can_comment?: boolean | null
          can_share?: boolean | null
          can_upload?: boolean | null
          dashboard_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_dashboard_members_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "shared_dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_dashboards: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          updated_at: string | null
          visibility: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          updated_at?: string | null
          visibility?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
          visibility?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_dashboards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_items: {
        Row: {
          created_at: string | null
          dashboard_id: string
          id: string
          item_id: string
          item_type: string
          note: string | null
          pin_position: number | null
          shared_by: string
        }
        Insert: {
          created_at?: string | null
          dashboard_id: string
          id?: string
          item_id: string
          item_type: string
          note?: string | null
          pin_position?: number | null
          shared_by: string
        }
        Update: {
          created_at?: string | null
          dashboard_id?: string
          id?: string
          item_id?: string
          item_type?: string
          note?: string | null
          pin_position?: number | null
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_items_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "shared_dashboards"
            referencedColumns: ["id"]
          },
        ]
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
      subscriptions: {
        Row: {
          ai_credits_monthly: number | null
          ai_credits_used: number | null
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          group_memberships_limit: number | null
          id: string
          personal_items_limit: number | null
          status: string
          storage_mb_limit: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_credits_monthly?: number | null
          ai_credits_used?: number | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          group_memberships_limit?: number | null
          id?: string
          personal_items_limit?: number | null
          status?: string
          storage_mb_limit?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_credits_monthly?: number | null
          ai_credits_used?: number | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          group_memberships_limit?: number | null
          id?: string
          personal_items_limit?: number | null
          status?: string
          storage_mb_limit?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_configurations: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          effective_from: string
          effective_to: string | null
          filing_frequency: string | null
          id: string
          is_active: boolean | null
          reduced_rates: Json | null
          rules: Json | null
          standard_rate: number
          tax_name: string
          tax_type: string
          tax_year_start: string | null
          threshold_amount: number | null
          threshold_currency: string | null
          updated_at: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          effective_from: string
          effective_to?: string | null
          filing_frequency?: string | null
          id?: string
          is_active?: boolean | null
          reduced_rates?: Json | null
          rules?: Json | null
          standard_rate: number
          tax_name: string
          tax_type: string
          tax_year_start?: string | null
          threshold_amount?: number | null
          threshold_currency?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          filing_frequency?: string | null
          id?: string
          is_active?: boolean | null
          reduced_rates?: Json | null
          rules?: Json | null
          standard_rate?: number
          tax_name?: string
          tax_type?: string
          tax_year_start?: string | null
          threshold_amount?: number | null
          threshold_currency?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tier_features: {
        Row: {
          description: string | null
          feature_key: string
          hub_type: Database["public"]["Enums"]["hub_type"]
          id: string
          is_enabled: boolean | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          usage_limit: number | null
        }
        Insert: {
          description?: string | null
          feature_key: string
          hub_type: Database["public"]["Enums"]["hub_type"]
          id?: string
          is_enabled?: boolean | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          usage_limit?: number | null
        }
        Update: {
          description?: string | null
          feature_key?: string
          hub_type?: Database["public"]["Enums"]["hub_type"]
          id?: string
          is_enabled?: boolean | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          usage_limit?: number | null
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
      transaction_reconciliations: {
        Row: {
          bank_transaction_id: string
          created_at: string
          financial_record_id: string | null
          id: string
          match_confidence: number | null
          match_notes: string | null
          match_status: string
          match_type: string
          matched_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          split_details: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_transaction_id: string
          created_at?: string
          financial_record_id?: string | null
          id?: string
          match_confidence?: number | null
          match_notes?: string | null
          match_status?: string
          match_type: string
          matched_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          split_details?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_transaction_id?: string
          created_at?: string
          financial_record_id?: string | null
          id?: string
          match_confidence?: number | null
          match_notes?: string | null
          match_status?: string
          match_type?: string
          matched_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          split_details?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_reconciliations_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_reconciliations_financial_record_id_fkey"
            columns: ["financial_record_id"]
            isOneToOne: false
            referencedRelation: "csuite_financials"
            referencedColumns: ["id"]
          },
        ]
      }
      user_accessibility_settings: {
        Row: {
          audio_feedback_enabled: boolean
          audio_volume: number
          color_blind_mode: string | null
          created_at: string
          dyslexia_friendly: boolean
          font_size: string
          high_contrast: boolean
          id: string
          keyboard_navigation_hints: boolean
          reduced_motion: boolean
          screen_reader_optimized: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_feedback_enabled?: boolean
          audio_volume?: number
          color_blind_mode?: string | null
          created_at?: string
          dyslexia_friendly?: boolean
          font_size?: string
          high_contrast?: boolean
          id?: string
          keyboard_navigation_hints?: boolean
          reduced_motion?: boolean
          screen_reader_optimized?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_feedback_enabled?: boolean
          audio_volume?: number
          color_blind_mode?: string | null
          created_at?: string
          dyslexia_friendly?: boolean
          font_size?: string
          high_contrast?: boolean
          id?: string
          keyboard_navigation_hints?: boolean
          reduced_motion?: boolean
          screen_reader_optimized?: boolean
          updated_at?: string
          user_id?: string
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
      user_difficulty_preferences: {
        Row: {
          agent_autonomy_preference: string
          auto_adjust_enabled: boolean
          created_at: string
          domain_difficulties: Json
          global_difficulty: string
          id: string
          report_complexity: string
          show_advanced_features: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_autonomy_preference?: string
          auto_adjust_enabled?: boolean
          created_at?: string
          domain_difficulties?: Json
          global_difficulty?: string
          id?: string
          report_complexity?: string
          show_advanced_features?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_autonomy_preference?: string
          auto_adjust_enabled?: boolean
          created_at?: string
          domain_difficulties?: Json
          global_difficulty?: string
          id?: string
          report_complexity?: string
          show_advanced_features?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_progress: {
        Row: {
          achievements: string[] | null
          created_at: string
          id: string
          last_activity_at: string | null
          skill_category: string
          skill_level: number
          total_actions: number
          unlocked_features: string[] | null
          updated_at: string
          user_id: string
          xp_points: number
        }
        Insert: {
          achievements?: string[] | null
          created_at?: string
          id?: string
          last_activity_at?: string | null
          skill_category: string
          skill_level?: number
          total_actions?: number
          unlocked_features?: string[] | null
          updated_at?: string
          user_id: string
          xp_points?: number
        }
        Update: {
          achievements?: string[] | null
          created_at?: string
          id?: string
          last_activity_at?: string | null
          skill_category?: string
          skill_level?: number
          total_actions?: number
          unlocked_features?: string[] | null
          updated_at?: string
          user_id?: string
          xp_points?: number
        }
        Relationships: []
      }
      user_memory_messages: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          agent_id?: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_memory_summaries: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          message_count: number | null
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string
          created_at?: string
          id?: string
          message_count?: number | null
          summary: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          message_count?: number | null
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preference_surveys: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          question_id: string
          response: Json
          survey_type: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          question_id: string
          response: Json
          survey_type: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          question_id?: string
          response?: Json
          survey_type?: string
          user_id?: string
        }
        Relationships: []
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
      user_tax_settings: {
        Row: {
          accounting_method: string | null
          auto_calculate_tax: boolean | null
          created_at: string
          filing_frequency: string | null
          id: string
          include_tax_in_prices: boolean | null
          is_registered_for_tax: boolean | null
          metadata: Json | null
          primary_country_code: string
          registration_date: string | null
          tax_registration_number: string | null
          tax_year_end_month: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accounting_method?: string | null
          auto_calculate_tax?: boolean | null
          created_at?: string
          filing_frequency?: string | null
          id?: string
          include_tax_in_prices?: boolean | null
          is_registered_for_tax?: boolean | null
          metadata?: Json | null
          primary_country_code: string
          registration_date?: string | null
          tax_registration_number?: string | null
          tax_year_end_month?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accounting_method?: string | null
          auto_calculate_tax?: boolean | null
          created_at?: string
          filing_frequency?: string | null
          id?: string
          include_tax_in_prices?: boolean | null
          is_registered_for_tax?: boolean | null
          metadata?: Json | null
          primary_country_code?: string
          registration_date?: string | null
          tax_registration_number?: string | null
          tax_year_end_month?: number | null
          updated_at?: string
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
      veracity_evaluations: {
        Row: {
          citations: string[] | null
          confidence_level: string | null
          context: string | null
          contextual_fit_score: number | null
          contradicting_evidence: Json | null
          created_at: string
          evaluated_by: string | null
          evaluation_summary: string | null
          id: string
          knowledge_alignment_score: number | null
          metadata: Json | null
          plausibility_factors: Json | null
          related_discovery_id: string | null
          source_reliability_score: number | null
          statement: string
          supporting_evidence: Json | null
          updated_at: string
          user_id: string | null
          veracity_score: number | null
        }
        Insert: {
          citations?: string[] | null
          confidence_level?: string | null
          context?: string | null
          contextual_fit_score?: number | null
          contradicting_evidence?: Json | null
          created_at?: string
          evaluated_by?: string | null
          evaluation_summary?: string | null
          id?: string
          knowledge_alignment_score?: number | null
          metadata?: Json | null
          plausibility_factors?: Json | null
          related_discovery_id?: string | null
          source_reliability_score?: number | null
          statement: string
          supporting_evidence?: Json | null
          updated_at?: string
          user_id?: string | null
          veracity_score?: number | null
        }
        Update: {
          citations?: string[] | null
          confidence_level?: string | null
          context?: string | null
          contextual_fit_score?: number | null
          contradicting_evidence?: Json | null
          created_at?: string
          evaluated_by?: string | null
          evaluation_summary?: string | null
          id?: string
          knowledge_alignment_score?: number | null
          metadata?: Json | null
          plausibility_factors?: Json | null
          related_discovery_id?: string | null
          source_reliability_score?: number | null
          statement?: string
          supporting_evidence?: Json | null
          updated_at?: string
          user_id?: string | null
          veracity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "veracity_evaluations_related_discovery_id_fkey"
            columns: ["related_discovery_id"]
            isOneToOne: false
            referencedRelation: "knowledge_discoveries"
            referencedColumns: ["id"]
          },
        ]
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
      can_access_hub: {
        Args: {
          p_hub: Database["public"]["Enums"]["hub_type"]
          p_user_id: string
        }
        Returns: boolean
      }
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
      create_document_version: {
        Args: {
          p_change_summary?: string
          p_content: string
          p_document_id: string
          p_document_type: string
          p_is_enhanced?: boolean
          p_is_summary?: boolean
          p_metadata?: Json
          p_title: string
        }
        Returns: string
      }
      detect_document_references: {
        Args: {
          p_document_id: string
          p_document_type?: string
          p_search_text?: string
        }
        Returns: number
      }
      get_document_insights: {
        Args: { p_document_id: string; p_document_type?: string }
        Returns: Json
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
      get_user_tier: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
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
      is_channel_admin: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_channel_creator: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_channel_member: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_dashboard_admin: {
        Args: { _dashboard_id: string; _user_id: string }
        Returns: boolean
      }
      is_dashboard_member: {
        Args: { _dashboard_id: string; _user_id: string }
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
      restore_document_version: {
        Args: { p_version_id: string }
        Returns: string
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
      channel_type: "direct" | "private" | "public" | "announcement"
      communication_platform:
        | "internal"
        | "gmail"
        | "outlook"
        | "slack"
        | "teams"
        | "whatsapp"
        | "sms"
        | "messenger"
        | "other"
      compliance_mode: "standard" | "gdpr" | "hipaa" | "enterprise"
      governance_level: "persona" | "industry" | "workspace" | "user" | "agent"
      hub_type: "personal" | "group" | "csuite"
      insight_cadence: "daily" | "weekly" | "monthly" | "manual"
      message_status:
        | "draft"
        | "pending_approval"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
      org_plan: "free" | "personal" | "pro" | "team" | "enterprise"
      subscription_tier:
        | "free"
        | "personal"
        | "team"
        | "business"
        | "enterprise"
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
      channel_type: ["direct", "private", "public", "announcement"],
      communication_platform: [
        "internal",
        "gmail",
        "outlook",
        "slack",
        "teams",
        "whatsapp",
        "sms",
        "messenger",
        "other",
      ],
      compliance_mode: ["standard", "gdpr", "hipaa", "enterprise"],
      governance_level: ["persona", "industry", "workspace", "user", "agent"],
      hub_type: ["personal", "group", "csuite"],
      insight_cadence: ["daily", "weekly", "monthly", "manual"],
      message_status: [
        "draft",
        "pending_approval",
        "sent",
        "delivered",
        "read",
        "failed",
      ],
      org_plan: ["free", "personal", "pro", "team", "enterprise"],
      subscription_tier: ["free", "personal", "team", "business", "enterprise"],
      tool_permission_status: ["allowed", "blocked", "preferred"],
      user_status: ["active", "invited", "disabled"],
      waveform_type: ["sine", "square", "sawtooth", "triangle"],
      workspace_role: ["owner", "admin", "editor", "viewer"],
      workspace_type: ["personal", "team", "department", "client", "project"],
    },
  },
} as const
