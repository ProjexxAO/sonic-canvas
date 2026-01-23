import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  HelpCircle, 
  Book, 
  MessageCircle, 
  Keyboard, 
  Mic,
  Settings,
  Users,
  Briefcase,
  Shield,
  FileText,
  ExternalLink
} from 'lucide-react';

const helpSections = [
  {
    title: 'Getting Started',
    icon: Book,
    items: [
      { label: 'Personal Hub Overview', description: 'Manage your tasks, goals, and wellness' },
      { label: 'Voice Commands', description: 'Talk to Atlas using natural language' },
      { label: 'Connecting Integrations', description: 'Link your favorite apps and services' },
    ]
  },
  {
    title: 'Hub Navigation',
    icon: Users,
    items: [
      { label: 'Personal Hub', description: 'Your personal life command center', route: '/personal' },
      { label: 'Group Hub', description: 'Collaborate with teams and families', route: '/group' },
      { label: 'Enterprise Hub', description: 'Business intelligence and reporting', route: '/atlas' },
    ]
  },
  {
    title: 'Voice Assistant',
    icon: Mic,
    items: [
      { label: 'Activating Atlas', description: 'Say "Hey Atlas" or tap the orb' },
      { label: 'Voice Navigation', description: 'Say "Go to Personal Hub" to navigate' },
      { label: 'Creating Items', description: 'Say "Create a task called..." to add items' },
    ]
  },
  {
    title: 'Keyboard Shortcuts',
    icon: Keyboard,
    items: [
      { label: '⌘/Ctrl + K', description: 'Open command palette' },
      { label: '⌘/Ctrl + /', description: 'Focus Atlas input' },
      { label: 'Escape', description: 'Close dialogs and panels' },
    ]
  },
];

const quickLinks = [
  { label: 'Terms of Service', icon: FileText, route: '/terms-of-service' },
  { label: 'Privacy Policy', icon: Shield, route: '/privacy-policy' },
  { label: 'Settings', icon: Settings, route: '/personal' },
];

export default function Help() {
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

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Help Center</h1>
          </div>
          <p className="text-muted-foreground">
            Find answers, learn features, and get the most out of Atlas OS
          </p>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Need Help?
            </CardTitle>
            <CardDescription>
              Talk to Atlas anytime by tapping the orb or saying "Hey Atlas"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => navigate('/personal')}
            >
              <Mic className="mr-2 h-4 w-4" />
              Go to Atlas
            </Button>
          </CardContent>
        </Card>

        {/* Help Sections */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {helpSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => item.route && navigate(item.route)}
                  >
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <Button
                  key={link.label}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(link.route)}
                >
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://docs.lovable.dev', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
