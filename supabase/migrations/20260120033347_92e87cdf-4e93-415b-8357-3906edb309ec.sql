-- Create user learning progress table for skill tracking
CREATE TABLE public.user_learning_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_category TEXT NOT NULL,
  skill_level INTEGER NOT NULL DEFAULT 1 CHECK (skill_level >= 1 AND skill_level <= 5),
  xp_points INTEGER NOT NULL DEFAULT 0,
  total_actions INTEGER NOT NULL DEFAULT 0,
  achievements TEXT[] DEFAULT '{}',
  unlocked_features TEXT[] DEFAULT '{}',
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_category)
);

-- Create user preference surveys table
CREATE TABLE public.user_preference_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  survey_type TEXT NOT NULL,
  question_id TEXT NOT NULL,
  response JSONB NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user accessibility settings table
CREATE TABLE public.user_accessibility_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  font_size TEXT NOT NULL DEFAULT 'medium',
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  high_contrast BOOLEAN NOT NULL DEFAULT false,
  dyslexia_friendly BOOLEAN NOT NULL DEFAULT false,
  screen_reader_optimized BOOLEAN NOT NULL DEFAULT false,
  audio_feedback_enabled BOOLEAN NOT NULL DEFAULT true,
  audio_volume NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  keyboard_navigation_hints BOOLEAN NOT NULL DEFAULT true,
  color_blind_mode TEXT DEFAULT null,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create difficulty preferences table
CREATE TABLE public.user_difficulty_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  global_difficulty TEXT NOT NULL DEFAULT 'standard',
  domain_difficulties JSONB NOT NULL DEFAULT '{}',
  auto_adjust_enabled BOOLEAN NOT NULL DEFAULT true,
  show_advanced_features BOOLEAN NOT NULL DEFAULT false,
  report_complexity TEXT NOT NULL DEFAULT 'standard',
  agent_autonomy_preference TEXT NOT NULL DEFAULT 'supervised',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preference_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accessibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_difficulty_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_learning_progress
CREATE POLICY "Users can view own learning progress" ON public.user_learning_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning progress" ON public.user_learning_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own learning progress" ON public.user_learning_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_preference_surveys
CREATE POLICY "Users can view own surveys" ON public.user_preference_surveys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own surveys" ON public.user_preference_surveys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_accessibility_settings
CREATE POLICY "Users can view own accessibility settings" ON public.user_accessibility_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accessibility settings" ON public.user_accessibility_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accessibility settings" ON public.user_accessibility_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_difficulty_preferences
CREATE POLICY "Users can view own difficulty preferences" ON public.user_difficulty_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own difficulty preferences" ON public.user_difficulty_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own difficulty preferences" ON public.user_difficulty_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_learning_progress_updated_at
  BEFORE UPDATE ON public.user_learning_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_accessibility_settings_updated_at
  BEFORE UPDATE ON public.user_accessibility_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_difficulty_preferences_updated_at
  BEFORE UPDATE ON public.user_difficulty_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();