import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Hexagon, 
  User, 
  Users, 
  Briefcase,
  Mic,
  Brain,
  Shield,
  Zap
} from 'lucide-react';

const features = [
  {
    icon: User,
    title: 'Personal Hub',
    description: 'Your life command center for tasks, goals, habits, and wellness tracking.',
    route: '/personal'
  },
  {
    icon: Users,
    title: 'Group Hub',
    description: 'Collaborate with teams, families, and projects in shared workspaces.',
    route: '/group'
  },
  {
    icon: Briefcase,
    title: 'Enterprise Hub',
    description: 'Business intelligence, executive reporting, and AI-powered analytics.',
    route: '/atlas'
  },
  {
    icon: Mic,
    title: 'Voice Control',
    description: 'Talk naturally to Atlas using voice commands for hands-free operation.',
    route: '/personal'
  },
  {
    icon: Brain,
    title: 'AI Orchestration',
    description: 'Deploy and manage AI agents across 11 functional domains.',
    route: '/atlas'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Row-level security, encrypted storage, and role-based access control.',
    route: '/governance'
  },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Hexagon className="h-16 w-16 text-primary" />
              <Zap className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Atlas OS</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your intelligent command center for personal productivity, team collaboration, 
            and enterprise intelligence — all powered by AI.
          </p>
        </div>

        {/* Hub Structure */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Three-Tier Hub Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => navigate('/personal')}
              >
                <User className="h-4 w-4" />
                Personal
              </Button>
              <span className="text-muted-foreground">→</span>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => navigate('/group')}
              >
                <Users className="h-4 w-4" />
                Group
              </Button>
              <span className="text-muted-foreground">→</span>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => navigate('/atlas')}
              >
                <Briefcase className="h-4 w-4" />
                Enterprise
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Scale seamlessly from personal use to team collaboration to enterprise operations
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {features.map((feature) => (
            <Card 
              key={feature.title}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(feature.route)}
            >
              <CardContent className="pt-6">
                <feature.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Get Started</h2>
            <p className="text-muted-foreground mb-6">
              Begin your journey with Atlas OS today
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/personal')}>
                Open Personal Hub
              </Button>
              <Button variant="outline" onClick={() => navigate('/help')}>
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
