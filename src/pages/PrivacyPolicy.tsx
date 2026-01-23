import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
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

        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Privacy Policy</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: January 2025
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[70vh] p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
                <section>
                  <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
                  <p className="text-muted-foreground">
                    We collect information you provide directly, including:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Account information (email, name, profile data)</li>
                    <li>Personal items, tasks, goals, and habits you create</li>
                    <li>Communications and messages within the platform</li>
                    <li>Integration data from connected third-party services</li>
                    <li>Voice interactions when using Atlas voice features</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
                  <p className="text-muted-foreground">
                    Your information is used to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Provide and improve Atlas OS services</li>
                    <li>Personalize your experience and recommendations</li>
                    <li>Process voice commands and AI interactions</li>
                    <li>Send important service notifications</li>
                    <li>Analyze usage patterns to enhance features</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">3. Data Storage and Security</h2>
                  <p className="text-muted-foreground">
                    We implement industry-standard security measures to protect your data:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Encryption in transit and at rest</li>
                    <li>Row Level Security (RLS) for data isolation</li>
                    <li>Regular security audits and updates</li>
                    <li>Secure authentication protocols</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
                  <p className="text-muted-foreground">
                    We do not sell your personal data. We may share data with:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Service providers who assist in operating our platform</li>
                    <li>Third-party integrations you explicitly connect</li>
                    <li>Legal authorities when required by law</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">5. Your Rights</h2>
                  <p className="text-muted-foreground">
                    You have the right to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Access your personal data</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Export your data in a portable format</li>
                    <li>Opt out of non-essential data collection</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">6. Cookies and Tracking</h2>
                  <p className="text-muted-foreground">
                    We use essential cookies for authentication and preferences. 
                    Analytics cookies are used only with your consent to improve the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">7. Children's Privacy</h2>
                  <p className="text-muted-foreground">
                    Atlas OS is not intended for users under 13 years of age. 
                    We do not knowingly collect data from children.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">8. Changes to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this policy periodically. We will notify you of significant 
                    changes via email or in-app notification.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">9. Contact Us</h2>
                  <p className="text-muted-foreground">
                    For privacy-related inquiries, please use the Help section in the application 
                    or contact our support team.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
