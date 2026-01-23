import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
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
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Terms of Service</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: January 2025
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[70vh] p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
                <section>
                  <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
                  <p className="text-muted-foreground">
                    By accessing or using Atlas OS, you agree to be bound by these Terms of Service. 
                    If you do not agree to these terms, please do not use our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
                  <p className="text-muted-foreground">
                    Atlas OS is an intelligent personal and enterprise management platform that provides:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Personal productivity and wellness management</li>
                    <li>Group collaboration tools</li>
                    <li>Enterprise data orchestration</li>
                    <li>AI-powered voice assistant capabilities</li>
                    <li>Integration with third-party services</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">3. User Accounts</h2>
                  <p className="text-muted-foreground">
                    You are responsible for maintaining the confidentiality of your account credentials 
                    and for all activities that occur under your account. You must notify us immediately 
                    of any unauthorized use of your account.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">4. Acceptable Use</h2>
                  <p className="text-muted-foreground">
                    You agree not to use Atlas OS to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on the rights of others</li>
                    <li>Distribute malware or harmful content</li>
                    <li>Attempt to gain unauthorized access to systems</li>
                    <li>Interfere with the service's operation</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">5. Data and Privacy</h2>
                  <p className="text-muted-foreground">
                    Your use of Atlas OS is also governed by our Privacy Policy. By using the service, 
                    you consent to the collection and use of your data as described therein.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">6. Intellectual Property</h2>
                  <p className="text-muted-foreground">
                    Atlas OS and its original content, features, and functionality are owned by us 
                    and are protected by international copyright, trademark, and other intellectual 
                    property laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
                  <p className="text-muted-foreground">
                    Atlas OS is provided "as is" without warranties of any kind. We shall not be liable 
                    for any indirect, incidental, special, consequential, or punitive damages arising 
                    from your use of the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">8. Changes to Terms</h2>
                  <p className="text-muted-foreground">
                    We reserve the right to modify these terms at any time. We will notify users of 
                    any material changes via email or through the service interface.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
                  <p className="text-muted-foreground">
                    For questions about these Terms of Service, please contact us through the 
                    Help section of the application.
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
