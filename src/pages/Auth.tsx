// Atlas Sonic OS - Authentication Page

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { audioEngine } from '@/lib/audioEngine';
import { Hexagon, Radio, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const validate = () => {
    try {
      const data = mode === 'signup' 
        ? { email, password, displayName }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
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
        } else {
          audioEngine.playSuccess();
          toast.success('Access granted');
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered');
          } else {
            toast.error(error.message);
          }
          audioEngine.playError();
        } else {
          audioEngine.playSuccess();
          toast.success('Operator registered successfully');
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
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

            <button
              type="submit"
              disabled={loading}
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

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrors({});
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
