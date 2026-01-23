import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  Mail,
  FileText,
  Calendar,
  DollarSign,
  CheckSquare,
  BookOpen,
  User,
  Sparkles,
  BarChart3,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeatureTourProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const TOUR_SLIDES = [
  {
    id: 'data-hub',
    title: 'Data Hub',
    description: 'Connect and manage all your business data in one place. Upload documents, sync emails, and track financials.',
    icon: BarChart3,
    features: [
      { icon: Mail, label: 'Communications', color: 'hsl(200 70% 50%)' },
      { icon: FileText, label: 'Documents', color: 'hsl(280 70% 50%)' },
      { icon: Calendar, label: 'Events', color: 'hsl(150 70% 45%)' },
      { icon: DollarSign, label: 'Financials', color: 'hsl(45 80% 50%)' },
      { icon: CheckSquare, label: 'Tasks', color: 'hsl(350 70% 50%)' },
      { icon: BookOpen, label: 'Knowledge', color: 'hsl(220 70% 55%)' },
    ],
    gradient: 'from-blue-500/20 to-purple-500/20',
  },
  {
    id: 'personas',
    title: 'Enterprise Personas',
    description: 'Choose from 12 enterprise personas, each tailored to focus on what matters most to that role.',
    icon: User,
    features: [
      { icon: User, label: 'CEO - Strategic overview', color: 'hsl(var(--primary))' },
      { icon: DollarSign, label: 'CFO - Financial health', color: 'hsl(45 80% 50%)' },
      { icon: BarChart3, label: 'COO - Operations', color: 'hsl(150 70% 45%)' },
      { icon: User, label: 'And 9 more...', color: 'hsl(280 70% 50%)' },
    ],
    gradient: 'from-green-500/20 to-teal-500/20',
  },
  {
    id: 'ai-reports',
    title: 'AI-Powered Reports',
    description: 'Generate comprehensive briefings with a single click. Export to PDF, share with your team, or schedule automated reports.',
    icon: Sparkles,
    features: [
      { icon: Sparkles, label: 'One-click generation', color: 'hsl(var(--primary))' },
      { icon: FileText, label: 'PDF & Markdown export', color: 'hsl(280 70% 50%)' },
      { icon: BarChart3, label: 'Customizable depth', color: 'hsl(150 70% 45%)' },
    ],
    gradient: 'from-yellow-500/20 to-orange-500/20',
  },
  {
    id: 'voice-agent',
    title: 'Voice-Powered Atlas',
    description: 'Interact with your data using natural voice commands. Ask questions, search agents, and get instant answers.',
    icon: Mic,
    features: [
      { icon: Mic, label: 'Voice commands', color: 'hsl(350 70% 50%)' },
      { icon: Sparkles, label: 'Natural language', color: 'hsl(var(--primary))' },
      { icon: BarChart3, label: 'Real-time insights', color: 'hsl(200 70% 50%)' },
    ],
    gradient: 'from-pink-500/20 to-red-500/20',
  },
];

export function FeatureTour({ onNext, onBack, onSkip }: FeatureTourProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slide = TOUR_SLIDES[currentSlide];
  const isLastSlide = currentSlide === TOUR_SLIDES.length - 1;
  const isFirstSlide = currentSlide === 0;

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
        {/* Icon */}
        <div className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br",
          slide.gradient
        )}>
          <slide.icon size={36} className="text-primary" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-3 text-center">
          {slide.title}
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
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border"
            >
              <feature.icon size={14} style={{ color: feature.color }} />
              <span className="text-xs font-medium text-foreground">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Slide indicators */}
        <div className="flex gap-2 mb-8">
          {TOUR_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentSlide
                  ? "w-6 bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
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
