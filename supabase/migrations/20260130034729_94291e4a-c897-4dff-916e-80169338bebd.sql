-- ============================================================================
-- Service Logs Table (for ServiceLogger persistence)
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  service VARCHAR(50) NOT NULL,
  request_id UUID,
  user_id UUID,
  org_id UUID,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_logs_service ON service_logs(service);
CREATE INDEX IF NOT EXISTS idx_service_logs_level ON service_logs(level);
CREATE INDEX IF NOT EXISTS idx_service_logs_timestamp ON service_logs(timestamp DESC);

-- ============================================================================
-- Service Metrics Table (for performance tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  value DECIMAL NOT NULL,
  unit VARCHAR(20) DEFAULT 'ms',
  service VARCHAR(50) NOT NULL,
  request_id UUID,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_metrics_service ON service_metrics(service);
CREATE INDEX IF NOT EXISTS idx_service_metrics_name ON service_metrics(name);

-- ============================================================================
-- Task Assignments Table (for orchestration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES sonic_agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  confidence DECIMAL(3,2) DEFAULT 0.5,
  estimated_duration INTEGER,
  backup_agents UUID[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_assignment_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_agent ON task_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(user_id);

-- ============================================================================
-- Agent Swarms Table (for multi-agent coordination)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_swarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  task_id UUID,
  coordinator_id UUID REFERENCES sonic_agents(id),
  member_ids UUID[] NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  execution_plan JSONB,
  status VARCHAR(20) DEFAULT 'formed',
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_swarms_user ON agent_swarms(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_swarms_status ON agent_swarms(status);
CREATE INDEX IF NOT EXISTS idx_agent_swarms_coordinator ON agent_swarms(coordinator_id);

-- ============================================================================
-- User Achievements Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Service Logs: Allow insert from edge functions (no RLS needed for server-side)
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service logs are insertable by authenticated" ON service_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own logs" ON service_logs FOR SELECT USING (user_id = auth.uid());

-- Service Metrics: Allow insert from edge functions
ALTER TABLE service_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service metrics are insertable by authenticated" ON service_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own metrics" ON service_metrics FOR SELECT USING (user_id = auth.uid());

-- Task Assignments: Users can manage their own assignments
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own task assignments" ON task_assignments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own task assignments" ON task_assignments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own task assignments" ON task_assignments FOR UPDATE USING (user_id = auth.uid());

-- Agent Swarms: Users can manage their own swarms
ALTER TABLE agent_swarms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own swarms" ON agent_swarms FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own swarms" ON agent_swarms FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own swarms" ON agent_swarms FOR UPDATE USING (user_id = auth.uid());

-- User Achievements: Users can view their own achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (true);