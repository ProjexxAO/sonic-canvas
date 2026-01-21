-- Add phone_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.phone_number IS 'User phone number for Atlas data sync and messaging integration';
COMMENT ON COLUMN public.profiles.phone_verified IS 'Whether the phone number has been verified';
COMMENT ON COLUMN public.profiles.phone_verified_at IS 'When the phone number was verified';