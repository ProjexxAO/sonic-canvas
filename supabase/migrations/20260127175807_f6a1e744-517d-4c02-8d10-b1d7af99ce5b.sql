
-- Drop old constraint and add updated one with all evolution memory types
ALTER TABLE public.agent_memory DROP CONSTRAINT IF EXISTS valid_memory_type;

ALTER TABLE public.agent_memory ADD CONSTRAINT valid_memory_type CHECK (
  memory_type = ANY (ARRAY[
    'interaction'::text, 
    'preference'::text, 
    'learning'::text, 
    'feedback'::text, 
    'context'::text, 
    'insight'::text, 
    'error'::text, 
    'success'::text, 
    'collaboration'::text, 
    'task_result'::text, 
    'seraphim_broadcast'::text, 
    'web_knowledge'::text, 
    'swarm_insight'::text,
    -- NEW: Hyper-evolution memory types
    'crystallized'::text,
    'received_crystal'::text,
    'task_pattern_discovery'::text,
    'visual_pattern'::text,
    'benchmark_enhancement'::text,
    'synthetic_task'::text,
    'evolution_milestone'::text
  ])
);
