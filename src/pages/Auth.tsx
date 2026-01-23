// Atlas Sonic OS - Authentication Page

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { audioEngine } from '@/lib/audioEngine';
import { supabase } from '@/integrations/supabase/client';
import { Hexagon, Radio, Mail, Lock, User, ArrowRight, Loader2, Phone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

const authSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format (e.g., +1234567890)')
    .optional()
    .or(z.literal('')),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const [verifyingTurnstile, setVerifyingTurnstile] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string>('');

  // Fetch Turnstile site key on mount
  useEffect(() => {
    const fetchSiteKey = async () => {
      try {
        const { data } = await supabase.functions.invoke('turnstile-config');
        if (data?.siteKey) {
          setTurnstileSiteKey(data.siteKey);
        }
      } catch (err) {
        console.error('Failed to fetch Turnstile config:', err);
      }
    };
    fetchSiteKey();
  }, []);

  // Redirect if already logged in - Personal Hub first (people-first approach)
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/personal');
    }
  }, [user, authLoading, navigate]);

  const validate = () => {
    try {
      const data = mode === 'signup' 
        ? { email, password, displayName, phoneNumber: phoneNumber || undefined }
        : { email, password };
      authSchema.parse(data);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const verifyTurnstile = async (token: string): Promise<boolean> => {
    setVerifyingTurnstile(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-turnstile', {
        body: { token }
      });
      
      if (error || !data?.success) {
        console.error('Turnstile verification failed:', error || data);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Turnstile verification error:', err);
      return false;
    } finally {
      setVerifyingTurnstile(false);
    }
  };

  const handleTurnstileSuccess = async (token: string) => {
    setTurnstileToken(token);
    const verified = await verifyTurnstile(token);
    setTurnstileVerified(verified);
    if (verified) {
      audioEngine.playSuccess();
    }
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setTurnstileVerified(false);
    toast.error('Human verification failed. Please try again.');
    audioEngine.playError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Require Turnstile verification for signup
    if (mode === 'signup' && !turnstileVerified) {
      toast.error('Please complete human verification first');
      audioEngine.playError();
      return;
    }
    
    setLoading(true);
    audioEngine.playClick();

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
          audioEngine.playError();
          // Reset Turnstile on error
          turnstileRef.current?.reset();
          setTurnstileVerified(false);
        } else {
          audioEngine.playSuccess();
          toast.success('Access granted');
          navigate('/personal');
        }
      } else {
        const { error } = await signUp(email, password, displayName, phoneNumber || undefined);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered');
          } else {
            toast.error(error.message);
          }
          audioEngine.playError();
          // Reset Turnstile on error
          turnstileRef.current?.reset();
          setTurnstileVerified(false);
        } else {
          audioEngine.playSuccess();
          toast.success('Operator registered successfully');
          navigate('/personal');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    audioEngine.playClick();
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/personal`,
        },
      });
      
      if (error) {
        toast.error(error.message);
        audioEngine.playError();
      }
    } catch (err) {
      toast.error('Failed to initiate Google sign-in');
      audioEngine.playError();
    } finally {
      setGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 grid-bg opacity-30" />
      <div className="fixed inset-0 scanlines opacity-20" />
      
      {/* Corner decorations */}
      <div className="fixed top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-primary/50" />
      <div className="fixed top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-primary/50" />
      <div className="fixed bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-primary/50" />
      <div className="fixed bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-primary/50" />

      {/* Auth card */}
      <div className="relative w-full max-w-md">
        <div className="hud-panel p-8 bg-card/90 backdrop-blur-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block relative mb-4">
              <Hexagon size={48} className="text-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(168, 100%, 50%))' }} />
              <Radio size={20} className="absolute inset-0 m-auto text-primary-foreground" />
            </div>
            <h1 className="font-orbitron text-2xl mb-1">
              <span className="text-primary text-glow-cyan">ATLAS</span>
              <span className="text-muted-foreground mx-1">:</span>
              <span className="text-secondary text-glow-amber">SONIC OS</span>
            </h1>
            <p className="text-xs text-muted-foreground tracking-[0.2em]">
              {mode === 'signin' ? 'OPERATOR AUTHENTICATION' : 'OPERATOR REGISTRATION'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">OPERATOR NAME</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter display name"
                      className="w-full bg-input border border-border rounded px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  {errors.displayName && (
                    <p className="text-xs text-destructive mt-1">{errors.displayName}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">PHONE NUMBER</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full bg-input border border-border rounded px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">For Atlas phone sync • SMS notifications</p>
                  {errors.phoneNumber && (
                    <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">EMAIL</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@atlas.io"
                  className="w-full bg-input border border-border rounded px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ACCESS CODE</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-input border border-border rounded px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            {/* Turnstile Human Verification - Only show for signup */}
            {mode === 'signup' && turnstileSiteKey && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  HUMAN VERIFICATION
                </label>
                <div className="flex justify-center">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={turnstileSiteKey}
                    onSuccess={handleTurnstileSuccess}
                    onError={handleTurnstileError}
                    onExpire={() => {
                      setTurnstileToken(null);
                      setTurnstileVerified(false);
                    }}
                    options={{
                      theme: 'dark',
                      size: 'normal',
                    }}
                  />
                </div>
                {verifyingTurnstile && (
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    Verifying...
                  </p>
                )}
                {turnstileVerified && (
                  <p className="text-xs text-primary text-center flex items-center justify-center gap-1">
                    <ShieldCheck size={12} />
                    Human verified
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading || (mode === 'signup' && !turnstileVerified)}
              className="w-full cyber-btn flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'AUTHENTICATE' : 'REGISTER'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">OR</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border rounded bg-input hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-medium text-foreground">
                  Continue with Google
                </span>
              </>
            )}
          </button>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrors({});
                setTurnstileVerified(false);
                setTurnstileToken(null);
                turnstileRef.current?.reset();
                audioEngine.playHover();
              }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === 'signin' 
                ? 'NEW OPERATOR? REGISTER HERE' 
                : 'EXISTING OPERATOR? SIGN IN'}
            </button>
          </div>
        </div>

        {/* Status line */}
        <div className="mt-4 text-center text-[10px] text-muted-foreground/50 font-mono">
          SECURE CONNECTION ESTABLISHED • TLS 1.3
        </div>
      </div>
    </div>
  );
}
