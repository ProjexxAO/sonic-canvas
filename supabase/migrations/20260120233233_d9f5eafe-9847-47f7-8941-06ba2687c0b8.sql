-- ============================================================
-- ATLAS SUBSCRIPTION TIER SYSTEM
-- Enables Personal, Group, and Enterprise hub access control
-- ============================================================

-- Subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM (
  'free',           -- Limited Personal Hub access
  'personal',       -- Full Personal Hub
  'team',           -- Personal + Group Hub
  'business',       -- Personal + Group + limited C-Suite
  'enterprise'      -- Full access to all hubs
);

-- Hub type enum
CREATE TYPE public.hub_type AS ENUM (
  'personal',
  'group',
  'csuite'
);

-- ============================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  
  -- Billing info
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Usage limits
  personal_items_limit INTEGER DEFAULT 100,
  group_memberships_limit INTEGER DEFAULT 1,
  storage_mb_limit INTEGER DEFAULT 500,
  ai_credits_monthly INTEGER DEFAULT 50,
  ai_credits_used INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- ============================================================
-- HUB ACCESS TABLE
-- Tracks which hubs each user can access
-- ============================================================
CREATE TABLE public.hub_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hub_type hub_type NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'editor', 'admin', 'owner')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  UNIQUE(user_id, hub_type)
);

-- ============================================================
-- TIER FEATURES TABLE
-- Defines what each tier can access
-- ============================================================
CREATE TABLE public.tier_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier subscription_tier NOT NULL,
  hub_type hub_type NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  usage_limit INTEGER,
  description TEXT,
  
  UNIQUE(tier, hub_type, feature_key)
);

-- Insert default tier features
INSERT INTO public.tier_features (tier, hub_type, feature_key, is_enabled, usage_limit, description) VALUES
  -- Free tier
  ('free', 'personal', 'basic_tasks', TRUE, 50, 'Basic task management'),
  ('free', 'personal', 'basic_notes', TRUE, 25, 'Basic notes'),
  ('free', 'personal', 'basic_calendar', TRUE, NULL, 'Calendar view only'),
  ('free', 'personal', 'ai_assistant', TRUE, 10, 'Limited AI queries per month'),
  
  -- Personal tier
  ('personal', 'personal', 'unlimited_tasks', TRUE, NULL, 'Unlimited tasks'),
  ('personal', 'personal', 'unlimited_notes', TRUE, NULL, 'Unlimited notes'),
  ('personal', 'personal', 'full_calendar', TRUE, NULL, 'Full calendar with reminders'),
  ('personal', 'personal', 'ai_assistant', TRUE, 100, 'Enhanced AI queries'),
  ('personal', 'personal', 'file_storage', TRUE, 2048, '2GB file storage'),
  ('personal', 'personal', 'integrations', TRUE, 3, 'Up to 3 integrations'),
  
  -- Team tier
  ('team', 'personal', 'unlimited_all', TRUE, NULL, 'All personal features'),
  ('team', 'group', 'create_groups', TRUE, 3, 'Create up to 3 groups'),
  ('team', 'group', 'group_members', TRUE, 10, 'Up to 10 members per group'),
  ('team', 'group', 'shared_workspace', TRUE, NULL, 'Shared task boards and docs'),
  ('team', 'group', 'ai_assistant', TRUE, 250, 'Team AI queries'),
  
  -- Business tier
  ('business', 'personal', 'unlimited_all', TRUE, NULL, 'All personal features'),
  ('business', 'group', 'unlimited_groups', TRUE, NULL, 'Unlimited groups'),
  ('business', 'group', 'group_members', TRUE, 50, 'Up to 50 members per group'),
  ('business', 'csuite', 'basic_dashboards', TRUE, 3, 'Basic executive dashboards'),
  ('business', 'csuite', 'reports', TRUE, 10, 'Monthly executive reports'),
  ('business', 'csuite', 'ai_assistant', TRUE, 500, 'Business AI queries'),
  
  -- Enterprise tier
  ('enterprise', 'personal', 'unlimited_all', TRUE, NULL, 'All personal features'),
  ('enterprise', 'group', 'unlimited_all', TRUE, NULL, 'All group features'),
  ('enterprise', 'csuite', 'unlimited_all', TRUE, NULL, 'Full C-Suite access'),
  ('enterprise', 'csuite', 'custom_personas', TRUE, NULL, 'Custom executive personas'),
  ('enterprise', 'csuite', 'api_access', TRUE, NULL, 'API access'),
  ('enterprise', 'csuite', 'sso', TRUE, NULL, 'Single sign-on'),
  ('enterprise', 'csuite', 'audit_logs', TRUE, NULL, 'Full audit logging');

-- ============================================================
-- PERSONAL DATA HUB TABLES
-- ============================================================

-- Personal Items - Unified table for personal data
CREATE TABLE public.personal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Item type and content
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'note', 'event', 'goal', 'habit', 'finance', 'health', 'bookmark')),
  title TEXT NOT NULL,
  content TEXT,
  
  -- Flexible metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  
  -- Status and priority
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'deleted')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Dates
  due_date TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Recurrence for habits/recurring tasks
  recurrence_rule TEXT,
  parent_item_id UUID REFERENCES public.personal_items(id),
  
  -- AI features
  embedding vector(1536),
  ai_summary TEXT,
  ai_tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Personal Goals (linked to items)
CREATE TABLE public.personal_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('health', 'career', 'finance', 'learning', 'relationships', 'personal', 'general')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Personal Habits
CREATE TABLE public.personal_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  target_count INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  reminder_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habit Completions
CREATE TABLE public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.personal_habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Users can only see their own
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Hub access: Users see their own access
CREATE POLICY "Users can view own hub access"
  ON public.hub_access FOR SELECT
  USING (auth.uid() = user_id);

-- Tier features: Everyone can read (public reference)
CREATE POLICY "Anyone can view tier features"
  ON public.tier_features FOR SELECT
  USING (true);

-- Personal items: Strict user isolation
CREATE POLICY "Users can CRUD own personal items"
  ON public.personal_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Personal goals: User isolation
CREATE POLICY "Users can CRUD own goals"
  ON public.personal_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Personal habits: User isolation
CREATE POLICY "Users can CRUD own habits"
  ON public.personal_habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Habit completions: User isolation
CREATE POLICY "Users can CRUD own habit completions"
  ON public.habit_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get user's subscription tier
CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id UUID)
RETURNS subscription_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tier FROM public.subscriptions WHERE user_id = p_user_id AND status = 'active'),
    'free'::subscription_tier
  )
$$;

-- Check if user can access a hub
CREATE OR REPLACE FUNCTION public.can_access_hub(p_user_id UUID, p_hub hub_type)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hub_access 
    WHERE user_id = p_user_id 
      AND hub_type = p_hub 
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > now())
  ) OR (
    -- Check tier-based access
    SELECT CASE 
      WHEN p_hub = 'personal' THEN TRUE  -- Everyone gets personal hub
      WHEN p_hub = 'group' THEN public.get_user_tier(p_user_id) IN ('team', 'business', 'enterprise')
      WHEN p_hub = 'csuite' THEN public.get_user_tier(p_user_id) IN ('business', 'enterprise')
      ELSE FALSE
    END
  )
$$;

-- Auto-create subscription for new users
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Grant personal hub access by default
  INSERT INTO public.hub_access (user_id, hub_type, access_level)
  VALUES (NEW.id, 'personal', 'owner')
  ON CONFLICT (user_id, hub_type) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger for auto-subscription
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_subscription();

-- Updated_at trigger
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_items_updated_at
  BEFORE UPDATE ON public.personal_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_goals_updated_at
  BEFORE UPDATE ON public.personal_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_habits_updated_at
  BEFORE UPDATE ON public.personal_habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON public.subscriptions(tier);
CREATE INDEX idx_hub_access_user ON public.hub_access(user_id);
CREATE INDEX idx_hub_access_type ON public.hub_access(hub_type);
CREATE INDEX idx_personal_items_user ON public.personal_items(user_id);
CREATE INDEX idx_personal_items_type ON public.personal_items(item_type);
CREATE INDEX idx_personal_items_status ON public.personal_items(status);
CREATE INDEX idx_personal_items_due ON public.personal_items(due_date);
CREATE INDEX idx_personal_goals_user ON public.personal_goals(user_id);
CREATE INDEX idx_personal_habits_user ON public.personal_habits(user_id);
CREATE INDEX idx_habit_completions_habit ON public.habit_completions(habit_id);