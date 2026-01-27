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

  const limit = Math.min(Math.max(options?.limit ?? 200, 1), 500);

  const fetchAgents = useCallback(async () => {
    if (!user) {
      setAgents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Select only necessary columns to avoid timeout on large tables
      const { data, error } = await supabase
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
        .order("last_active", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setAgents((data ?? []).map(mapDbToAgent));
    } catch (e) {
      console.error("[useDashboardAgents] Failed to load agents", e);
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

  return { agents, loading, refetch: fetchAgents };
}
