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
      // NOTE: do NOT filter by user_id here.
      // RLS enforces access (assigned agents for most users; all agents for superadmin).
      const { data, error } = await supabase
        .from("sonic_agents")
        .select("*")
        .order("last_active", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setAgents((data ?? []).map(mapDbToAgent));
    } catch (e) {
      console.error("[useDashboardAgents] Failed to load agents", e);
      toast.error("Failed to load agents");
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
