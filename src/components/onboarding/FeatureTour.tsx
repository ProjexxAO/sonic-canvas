import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  User,
  Users,
  Building2,
  Sparkles,
  BarChart3,
  Mic,
  Bot,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SubscriptionTier } from '@/lib/tierConfig';

interface FeatureTourProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  tier?: SubscriptionTier;
}

const TOUR_SLIDES = [
  {
    id: 'personal-hub',
    title: 'Personal Hub',
    description: 'Your private space for managing life. Track tasks, goals, habits, and personal finances all in one place.',
    icon: User,
    features: [
      { icon: BarChart3, label: 'Dashboard & Widgets', color: 'hsl(200 70% 50%)' },
      { icon: Sparkles, label: 'AI Daily Brief', color: 'hsl(280 70% 50%)' },
      { icon: Bot, label: 'Personal Agents', color: 'hsl(150 70% 45%)' },
    ],
    gradient: 'from-blue-500/20 to-cyan-500/20',
    availableTiers: ['free', 'pro', 'business', 'enterprise'],
  },
  {
    id: 'group-hub',
    title: 'Group Hub',
    description: 'Collaborate with your team, family, or community. Share tasks, events, and documents with role-based access.',
    icon: Users,
    features: [
      { icon: Users, label: 'Team Workspaces', color: 'hsl(var(--primary))' },
      { icon: BarChart3, label: 'Shared Analytics', color: 'hsl(45 80% 50%)' },
      { icon: Bot, label: 'Team Agents', color: 'hsl(150 70% 45%)' },
    ],
    gradient: 'from-green-500/20 to-teal-500/20',
    availableTiers: ['pro', 'business', 'enterprise'],
  },
  {
    id: 'enterprise-hub',
    title: 'Enterprise Hub',
    description: 'Executive-level intelligence. Generate AI reports, orchestrate agent swarms, and access organization-wide insights.',
    icon: Building2,
    features: [
      { icon: Sparkles, label: 'Executive Reports', color: 'hsl(var(--primary))' },
      { icon: Bot, label: 'Agent Orchestration', color: 'hsl(280 70% 50%)' },
      { icon: BarChart3, label: 'Universal Search', color: 'hsl(150 70% 45%)' },
    ],
    gradient: 'from-purple-500/20 to-pink-500/20',
    availableTiers: ['business', 'enterprise'],
  },
  {
    id: 'ai-agents',
    title: 'AI Agent Fleet',
    description: 'Atlas deploys specialized AI agents based on your subscription. From basic assistants to elite orchestration.',
    icon: Bot,
    features: [
      { icon: Bot, label: 'Up to 144,000 Agents', color: 'hsl(350 70% 50%)' },
      { icon: Sparkles, label: 'Swarm Orchestration', color: 'hsl(var(--primary))' },
      { icon: Mic, label: 'Voice Control', color: 'hsl(200 70% 50%)' },
    ],
    gradient: 'from-orange-500/20 to-red-500/20',
    availableTiers: ['free', 'pro', 'business', 'enterprise'],
  },
];

export function FeatureTour({ onNext, onBack, onSkip, tier = 'free' }: FeatureTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slide = TOUR_SLIDES[currentSlide];
  const isLastSlide = currentSlide === TOUR_SLIDES.length - 1;
  const isFirstSlide = currentSlide === 0;
  const isLocked = !slide.availableTiers.includes(tier);

  const handleNext = () => {
    if (isLastSlide) {
      onNext();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (isFirstSlide) {
      onBack();
    } else {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Skip button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 text-muted-foreground z-10"
        onClick={onSkip}
      >
        <X size={16} className="mr-1" />
        Skip
      </Button>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto">
        {/* Icon with lock overlay if locked */}
        <div className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br relative",
          slide.gradient,
          isLocked && "opacity-60"
        )}>
          <slide.icon size={36} className="text-primary" />
          {isLocked && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <Lock size={12} className="text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-3 text-center flex items-center gap-2">
          {slide.title}
          {isLocked && (
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
              Upgrade Required
            </span>
          )}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground text-center mb-8 max-w-md">
          {slide.description}
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {slide.features.map((feature, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border",
                isLocked && "opacity-50"
              )}
            >
              <feature.icon size={14} style={{ color: feature.color }} />
              <span className="text-xs font-medium text-foreground">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Slide indicators */}
        <div className="flex gap-2 mb-8">
          {TOUR_SLIDES.map((s, idx) => {
            const slideLocked = !s.availableTiers.includes(tier);
            return (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentSlide
                    ? "w-6 bg-primary"
                    : slideLocked
                      ? "bg-muted-foreground/20"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border">
        <Button variant="ghost" onClick={handlePrev}>
          <ChevronLeft size={16} className="mr-1" />
          {isFirstSlide ? 'Back' : 'Previous'}
        </Button>

        <span className="text-xs text-muted-foreground">
          {currentSlide + 1} of {TOUR_SLIDES.length}
        </span>

        <Button onClick={handleNext}>
          {isLastSlide ? 'Continue' : 'Next'}
          <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
