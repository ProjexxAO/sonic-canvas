// Atlas Sonic OS - Dashboard Agents Hook
// Loads only a small, recent subset of agents visible to the current user.
// RLS determines *which* agents are visible (assigned agents for most users; all agents for superadmin).

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { SonicAgent, AgentSector, AgentStatus, AgentClass } from "@/lib/agentTypes";
import type { WaveformType } from "@/lib/audioEngine";

// Map database types to our app types
const mapDbToAgent = (row: any): SonicAgent => ({
  id: row.id,
  name: row.name,
  designation: row.designation,
  sector: row.sector as AgentSector,
  status: row.status as AgentStatus,
  class: row.class as AgentClass,
  sonicDNA: {
    waveform: row.waveform as WaveformType,
    frequency: Number(row.frequency),
    color: row.color,
    modulation: Number(row.modulation),
    density: Number(row.density),
  },
  codeArtifact: row.code_artifact || "",
  createdAt: new Date(row.created_at),
  lastActive: new Date(row.last_active),
  metrics: {
    cycles: row.cycles,
    efficiency: Number(row.efficiency),
    stability: Number(row.stability),
  },
  linkedAgents: row.linked_agents || [],
  // Phase 1 & 2 metrics
  totalTasksCompleted: row.total_tasks_completed,
  successRate: row.success_rate,
  avgConfidence: row.avg_confidence,
  specializationLevel: row.specialization_level,
  taskSpecializations: row.task_specializations,
  preferredTaskTypes: row.preferred_task_types,
  learningVelocity: row.learning_velocity,
});

export function useDashboardAgents(options?: { limit?: number }) {
  const { user } = useAuth();
  const [agents, setAgents] = useState<SonicAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);

  const fetchAgents = useCallback(async () => {
    if (!user) {
      setAgents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Select only necessary columns to avoid timeout on large tables
      // Uses optimized indexes: idx_sonic_agents_last_active, idx_sonic_agents_status
      const { data, error: queryError } = await supabase
        .from("sonic_agents")
        .select(`
          id, name, designation, sector, status, class,
          waveform, frequency, color, modulation, density,
          code_artifact, created_at, last_active,
          cycles, efficiency, stability, linked_agents,
          total_tasks_completed, success_rate, avg_confidence,
          specialization_level, task_specializations, 
          preferred_task_types, learning_velocity
        `)
        .neq('status', 'DORMANT') // Skip dormant agents for faster queries
        .order("last_active", { ascending: false })
        .limit(limit);

      if (queryError) {
        // Don't throw on timeout - just log and use empty array
        if (queryError.code === '57014') {
          console.warn("[useDashboardAgents] Query timeout - using cached/empty result");
          setError("Agent query timed out - showing limited results");
        } else {
          throw queryError;
        }
      }
      
      setAgents((data ?? []).map(mapDbToAgent));
    } catch (e) {
      console.error("[useDashboardAgents] Failed to load agents", e);
      setError(e instanceof Error ? e.message : 'Failed to load agents');
      // Don't spam toasts on repeated failures
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Keep the dashboard list fresh without streaming the entire table.
  // Any relevant change triggers a refetch of the small subset.
  useEffect(() => {
    if (!user) return;

    const ch = supabase
      .channel("dashboard-agents")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sonic_agents" },
        () => {
          // Debounced-ish: refetch after a short delay to collapse bursts.
          window.setTimeout(() => void fetchAgents(), 250);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchAgents]);

  return { agents, loading, error, refetch: fetchAgents };
}
