/**
 * Design Psychology Reference System
 * 
 * This file documents the psychological principles and research-backed
 * design decisions used throughout Atlas OS.
 * 
 * Key Research Sources:
 * - Hick's Law: Decision time increases with number of choices
 * - Doherty Threshold: System response under 400ms feels instant
 * - Miller's Law: Working memory holds 7±2 chunks of information
 * - Zeigarnik Effect: Incomplete tasks are remembered better
 * - Fitts's Law: Time to reach a target depends on size and distance
 * - Von Restorff Effect: Distinctive items are more memorable
 */

// ============================================================================
// COLOR PSYCHOLOGY SYSTEM
// ============================================================================

/**
 * Color meanings based on psychological research:
 * 
 * TRUST & CALM (Blue/Slate/Teal):
 * - Reduces heart rate and blood pressure
 * - Associated with professionalism, reliability, stability
 * - Best for: Navigation, headers, backgrounds, data visualization
 * 
 * ENERGY & WARMTH (Amber/Orange/Gold):
 * - Triggers alertness without danger signals
 * - Associated with creativity, enthusiasm, optimism
 * - Best for: CTAs, highlights, warnings, AI activity
 * 
 * AI & MAGIC (Purple/Violet):
 * - Associated with sophistication, mystery, innovation
 * - Triggers curiosity and exploration
 * - Best for: AI features, premium indicators, creative tools
 * 
 * SUCCESS & GROWTH (Green/Emerald):
 * - Universal positive signal across cultures
 * - Associated with health, prosperity, progress
 * - Best for: Confirmation, completion, health metrics
 * 
 * URGENCY & IMPORTANCE (Red/Rose):
 * - Triggers immediate attention and alertness
 * - Use sparingly - can cause anxiety if overused
 * - Best for: Errors, critical alerts, delete actions
 */

export const COLOR_PSYCHOLOGY = {
  // Trust & Professional (primary actions, navigation)
  trust: {
    light: 'hsl(201 80% 45%)',   // Rich blue
    dark: 'hsl(201 85% 55%)',    // Brighter blue
    usage: 'Primary navigation, headers, trustworthy actions',
    psychology: 'Reduces anxiety, conveys reliability',
  },
  
  // Calm & Neutral (backgrounds, containers)
  calm: {
    light: 'hsl(220 14% 96%)',   // Soft gray-blue
    dark: 'hsl(220 15% 12%)',    // Deep slate (not pure black)
    usage: 'Backgrounds, cards, reading surfaces',
    psychology: 'Reduces cognitive strain, promotes focus',
  },
  
  // Energy & Action (CTAs, highlights, AI activity)
  energy: {
    light: 'hsl(37 92% 50%)',    // Warm amber
    dark: 'hsl(43 96% 56%)',     // Bright gold
    usage: 'Call-to-actions, AI processing, highlights',
    psychology: 'Triggers attention without stress',
  },
  
  // AI & Innovation (AI features, premium)
  magic: {
    light: 'hsl(270 60% 50%)',   // Rich purple
    dark: 'hsl(270 75% 65%)',    // Glowing violet
    usage: 'AI features, premium indicators, creative tools',
    psychology: 'Triggers curiosity, signals innovation',
  },
  
  // Success & Progress (confirmations, health)
  growth: {
    light: 'hsl(160 65% 35%)',   // Deep emerald
    dark: 'hsl(160 70% 45%)',    // Vibrant green
    usage: 'Success states, completion, health metrics',
    psychology: 'Universal positive signal, promotes calm',
  },
  
  // Warning & Alert (non-critical issues)
  warning: {
    light: 'hsl(36 78% 40%)',    // Deep orange
    dark: 'hsl(38 92% 55%)',     // Bright orange
    usage: 'Warnings, attention needed, pending actions',
    psychology: 'Alerts without triggering fight-or-flight',
  },
  
  // Danger & Critical (errors, destructive actions)
  danger: {
    light: 'hsl(0 72% 50%)',     // Deep red
    dark: 'hsl(0 80% 60%)',      // Bright red
    usage: 'Errors, delete actions, critical alerts',
    psychology: 'Immediate attention, use sparingly',
  },
} as const;

// ============================================================================
// ANIMATION PSYCHOLOGY
// ============================================================================

/**
 * Animation timing based on Doherty Threshold and UX research:
 * 
 * < 100ms: Instantaneous (state changes, micro-feedback)
 * 100-300ms: Quick transitions (hovers, focus states)
 * 200-500ms: Standard transitions (modals, page elements)
 * 400-600ms: Complex animations (orchestrated sequences)
 * > 600ms: Attention-holding (loading states, celebrations)
 */

export const ANIMATION_TIMING = {
  // Instant feedback (< 100ms)
  instant: 50,       // Button press feedback
  microFeedback: 75, // Checkbox toggles, small state changes
  
  // Quick transitions (100-300ms)
  hover: 150,        // Hover states
  focus: 200,        // Focus rings, tooltips
  slide: 250,        // Dropdown opens, sidebar toggles
  
  // Standard transitions (200-500ms)
  modal: 300,        // Modal enter/exit
  page: 350,         // Page transitions
  expand: 400,       // Accordion expansions
  
  // Complex animations (400-600ms)
  orchestrated: 500, // Multi-step sequences
  celebration: 600,  // Success animations
  
  // Attention-holding (> 600ms)
  loading: 800,      // Loading skeleton pulses
  dramatic: 1000,    // Onboarding reveals
} as const;

/**
 * Easing functions for natural motion:
 * 
 * ease-out: Elements appearing (feels welcoming)
 * ease-in-out: Moving elements (feels organic)
 * spring: Interactive elements (feels playful)
 */
export const ANIMATION_EASING = {
  // Standard easings
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',      // Accelerating (exit)
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',     // Decelerating (enter)
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)', // Symmetric (move)
  
  // Expressive easings
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy (buttons)
  gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',        // Subtle (backgrounds)
  snappy: 'cubic-bezier(0.4, 0, 0, 1)',              // Quick (toggles)
} as const;

// ============================================================================
// COGNITIVE LOAD PRINCIPLES
// ============================================================================

/**
 * Miller's Law: Working memory holds 7±2 items
 * 
 * Application:
 * - Navigation menus: Max 7 items
 * - Dashboard sections: 5-9 widgets maximum
 * - Form fields per section: 5-7 fields
 * - Action buttons per context: 3-5 options
 */
export const COGNITIVE_LIMITS = {
  navItems: 7,           // Max items in navigation
  dashboardSections: 7,  // Max dashboard sections visible
  formFieldsPerSection: 6,
  ctaButtons: 3,         // Primary + Secondary + Tertiary max
  tabsPerGroup: 5,       // Max tabs before scrolling
  notificationsVisible: 5,
  agentCardsPerRow: 4,
} as const;

/**
 * Progressive Disclosure Pattern:
 * Show essential information first, reveal complexity on demand.
 * 
 * Levels:
 * 1. Surface: Title, status, primary action
 * 2. Details: Description, metadata, secondary actions  
 * 3. Advanced: Settings, configurations, edge cases
 */
export const DISCLOSURE_LEVELS = {
  surface: ['title', 'status', 'primaryAction'],
  details: ['description', 'metadata', 'secondaryActions', 'stats'],
  advanced: ['settings', 'configurations', 'debug', 'permissions'],
} as const;

// ============================================================================
// SPACING & VISUAL HIERARCHY
// ============================================================================

/**
 * Gestalt Principles Application:
 * 
 * PROXIMITY: Related items grouped closely
 * - Card padding: 16-24px internal
 * - Section gaps: 24-32px between groups
 * 
 * SIMILARITY: Same function = same style
 * - All primary CTAs use same color/size
 * - All status badges use consistent format
 * 
 * CONTINUITY: Guide the eye naturally
 * - Left-to-right reading flow (LTR cultures)
 * - Top-to-bottom priority (most important first)
 * 
 * CLOSURE: Brain completes incomplete shapes
 * - Progress rings create completion drive
 * - Partial lists hint at more content
 */
export const SPACING_SCALE = {
  // Micro spacing (within components)
  xxs: 2,   // Icon-text gap
  xs: 4,    // Tight grouping
  sm: 8,    // Default element gap
  md: 12,   // Component internal padding
  
  // Macro spacing (between sections)
  lg: 16,   // Card padding
  xl: 24,   // Section gaps
  xxl: 32,  // Major section breaks
  xxxl: 48, // Page-level margins
} as const;

// ============================================================================
// ACCESSIBILITY REQUIREMENTS
// ============================================================================

/**
 * WCAG 2.1 AA Compliance Requirements:
 * 
 * CONTRAST RATIOS:
 * - Normal text: 4.5:1 minimum
 * - Large text (18px+ or 14px bold): 3:1 minimum
 * - UI components: 3:1 minimum
 * 
 * TARGET SIZES:
 * - Touch targets: 44x44px minimum (mobile)
 * - Click targets: 24x24px minimum (desktop)
 * 
 * MOTION:
 * - Respect prefers-reduced-motion
 * - No essential information in animation only
 * - Pause/stop controls for auto-playing content
 */
export const ACCESSIBILITY = {
  contrast: {
    normalText: 4.5,
    largeText: 3,
    uiComponents: 3,
  },
  targetSize: {
    touchMinimum: 44,
    clickMinimum: 24,
    comfortable: 48,
  },
  focusRing: {
    width: 2,
    offset: 2,
    color: 'hsl(var(--ring))',
  },
} as const;

// ============================================================================
// HUB-SPECIFIC PSYCHOLOGY
// ============================================================================

/**
 * Each hub has distinct psychological needs:
 * 
 * PERSONAL HUB:
 * - Goal: Personal mastery, life management
 * - Mood: Calm, supportive, encouraging
 * - Colors: Soft blues, gentle greens
 * - Animations: Gentle, fluid
 * 
 * GROUP HUB:
 * - Goal: Collaboration, team cohesion
 * - Mood: Energetic, connected, social
 * - Colors: Warm blues, connecting oranges
 * - Animations: Responsive, social feedback
 * 
 * ENTERPRISE HUB:
 * - Goal: Strategic oversight, executive intelligence
 * - Mood: Powerful, professional, confident
 * - Colors: Deep purples, commanding golds
 * - Animations: Precise, authoritative
 */
export const HUB_PSYCHOLOGY = {
  personal: {
    primaryEmotion: 'calm',
    accentColor: 'hsl(160 70% 45%)', // Gentle green
    animationStyle: 'gentle',
    density: 'comfortable',
    iconStyle: 'rounded',
  },
  group: {
    primaryEmotion: 'connected',
    accentColor: 'hsl(200 70% 50%)', // Social blue
    animationStyle: 'responsive',
    density: 'comfortable',
    iconStyle: 'rounded',
  },
  csuite: {
    primaryEmotion: 'confident',
    accentColor: 'hsl(270 70% 55%)', // Executive purple
    animationStyle: 'precise',
    density: 'compact',
    iconStyle: 'sharp',
  },
} as const;

// ============================================================================
// REWARD & FEEDBACK SYSTEM
// ============================================================================

/**
 * Dopamine-triggering feedback patterns:
 * 
 * MICRO-REWARDS (frequent, small)
 * - Checkmark animations on task complete
 * - Subtle glow on successful saves
 * - Progress ring increments
 * 
 * MILESTONE REWARDS (occasional, medium)
 * - Confetti on goal completion
 * - Badge unlock animations
 * - Streak celebration
 * 
 * ACHIEVEMENT REWARDS (rare, large)
 * - Full-screen celebration for major milestones
 * - Sound effects (optional)
 * - Share prompts
 */
export const REWARD_PATTERNS = {
  micro: {
    duration: 300,
    scale: 1.05,
    glow: true,
  },
  milestone: {
    duration: 800,
    particles: true,
    sound: 'optional',
  },
  achievement: {
    duration: 1500,
    fullScreen: true,
    confetti: true,
  },
} as const;
