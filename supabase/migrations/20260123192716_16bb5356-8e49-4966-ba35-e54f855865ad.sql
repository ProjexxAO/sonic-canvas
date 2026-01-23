-- Add verification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS identity_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS verification_level text DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'email_verified', 'phone_verified', 'fully_verified')),
ADD COLUMN IF NOT EXISTS turnstile_verified_at timestamptz,
ADD COLUMN IF NOT EXISTS failed_verification_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_verification_attempt timestamptz;

-- Create phone verification codes table for OTP
CREATE TABLE IF NOT EXISTS public.phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, phone_number)
);

-- Enable RLS on phone_verification_codes
ALTER TABLE public.phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can only view their own verification codes
CREATE POLICY "Users can view own verification codes"
ON public.phone_verification_codes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own verification codes
CREATE POLICY "Users can insert own verification codes"
ON public.phone_verification_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification codes
CREATE POLICY "Users can update own verification codes"
ON public.phone_verification_codes
FOR UPDATE
USING (auth.uid() = user_id);

-- Create verification audit log for security tracking
CREATE TABLE IF NOT EXISTS public.verification_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('turnstile_passed', 'turnstile_failed', 'email_verified', 'phone_otp_sent', 'phone_otp_verified', 'phone_otp_failed', 'verification_level_upgraded')),
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log - users can only see their own logs
ALTER TABLE public.verification_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
ON public.verification_audit_log
FOR SELECT
USING (auth.uid() = user_id);

-- Only system can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs"
ON public.verification_audit_log
FOR INSERT
WITH CHECK (true);

-- Create function to upgrade verification level
CREATE OR REPLACE FUNCTION public.upgrade_verification_level(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email_verified boolean;
  v_phone_verified boolean;
  v_new_level text;
BEGIN
  SELECT email_verified, phone_verified INTO v_email_verified, v_phone_verified
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF v_email_verified AND v_phone_verified THEN
    v_new_level := 'fully_verified';
  ELSIF v_phone_verified THEN
    v_new_level := 'phone_verified';
  ELSIF v_email_verified THEN
    v_new_level := 'email_verified';
  ELSE
    v_new_level := 'unverified';
  END IF;
  
  UPDATE public.profiles 
  SET verification_level = v_new_level,
      identity_verified = (v_new_level = 'fully_verified'),
      identity_verified_at = CASE WHEN v_new_level = 'fully_verified' THEN now() ELSE identity_verified_at END
  WHERE user_id = p_user_id;
  
  RETURN v_new_level;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_user_id ON public.phone_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_expires_at ON public.phone_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_user_id ON public.verification_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_level ON public.profiles(verification_level);