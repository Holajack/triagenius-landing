
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: "overview", title: "Overview" },
    { id: "information-we-collect", title: "Information We Collect" },
    { id: "how-we-use-information", title: "How We Use Your Information" },
    { id: "information-sharing", title: "Information Sharing and Disclosure" },
    { id: "third-party-services", title: "Third-Party Services" },
    { id: "data-security", title: "Data Security" },
    { id: "your-rights", title: "Your Rights and Choices" },
    { id: "children-privacy", title: "Children's Privacy" },
    { id: "international-transfers", title: "International Data Transfers" },
    { id: "changes", title: "Changes to This Policy" },
    { id: "contact", title: "Contact Us" }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <PageHeader 
            title="Privacy Policy" 
            subtitle="Last updated: December 2024"
          />
        </div>

        {/* Table of Contents */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="text-left text-sm text-primary hover:underline p-1"
                >
                  {section.title}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Overview */}
          <section id="overview">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Overview</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    This Privacy Policy describes how TriaGenius ("we," "us," or "our") collects, uses, and protects your information when you use our focus and study application (the "App"). We are committed to protecting your privacy and being transparent about our data practices.
                  </p>
                  <p>
                    By using our App, you agree to the collection and use of information in accordance with this Privacy Policy. This policy complies with applicable privacy laws, including the California Consumer Privacy Act (CCPA), General Data Protection Regulation (GDPR), and Apple App Store requirements.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Information We Collect */}
          <section id="information-we-collect">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <h3 className="text-lg font-medium">Account Information</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Email address (required for account creation and communication)</li>
                    <li>Username and display name</li>
                    <li>Password (stored as encrypted hash)</li>
                    <li>Profile information (full name, university, major, profession, location)</li>
                    <li>Profile picture/avatar (if provided)</li>
                  </ul>

                  <h3 className="text-lg font-medium">Study and Focus Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Focus session data (duration, start/end times, productivity ratings)</li>
                    <li>Study preferences (environment settings, sound preferences, work style)</li>
                    <li>Learning goals and weekly focus targets</li>
                    <li>Study subjects and task information</li>
                    <li>Session reflections and notes</li>
                    <li>Break session data and patterns</li>
                  </ul>

                  <h3 className="text-lg font-medium">Learning Analytics</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Learning style assessment responses and results</li>
                    <li>Cognitive performance metrics and patterns</li>
                    <li>Focus distribution and trend data</li>
                    <li>Time-of-day productivity patterns</li>
                    <li>Achievement and milestone data</li>
                  </ul>

                  <h3 className="text-lg font-medium">Communication Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Messages sent in study rooms</li>
                    <li>Direct messages between users</li>
                    <li>Community interactions and friend connections</li>
                  </ul>

                  <h3 className="text-lg font-medium">Usage and Technical Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>App usage patterns and feature interactions</li>
                    <li>Device information and app performance data</li>
                    <li>Log data and error reports</li>
                    <li>Session timestamps and duration</li>
                  </ul>

                  <h3 className="text-lg font-medium">Payment Information</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Subscription status and billing information (processed by Stripe)</li>
                    <li>Payment history and transaction records</li>
                    <li>We do not store credit card information directly</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* How We Use Information */}
          <section id="how-we-use-information">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>We use the collected information for the following purposes:</p>
                  
                  <h3 className="text-lg font-medium">Core App Functionality</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Provide and maintain the focus and study tracking features</li>
                    <li>Create and manage your user account</li>
                    <li>Process and store your study sessions and progress</li>
                    <li>Enable communication in study rooms and with other users</li>
                  </ul>

                  <h3 className="text-lg font-medium">Personalization and AI Insights</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Generate personalized study insights and recommendations</li>
                    <li>Analyze your learning patterns and productivity trends</li>
                    <li>Provide AI-powered study assistance and coaching</li>
                    <li>Customize the app experience based on your preferences</li>
                  </ul>

                  <h3 className="text-lg font-medium">Analytics and Improvement</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Analyze app usage to improve features and performance</li>
                    <li>Generate aggregated, anonymized usage statistics</li>
                    <li>Identify and fix technical issues</li>
                    <li>Develop new features based on user behavior</li>
                  </ul>

                  <h3 className="text-lg font-medium">Communication and Support</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Send important account and service notifications</li>
                    <li>Provide customer support and respond to inquiries</li>
                    <li>Send educational content and study tips (with consent)</li>
                  </ul>

                  <h3 className="text-lg font-medium">Legal and Security</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Comply with legal obligations and protect user safety</li>
                    <li>Prevent fraud, abuse, and unauthorized access</li>
                    <li>Enforce our Terms of Service and community guidelines</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Information Sharing */}
          <section id="information-sharing">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Information Sharing and Disclosure</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>We do not sell, trade, or rent your personal information. We may share your information only in the following limited circumstances:</p>
                  
                  <h3 className="text-lg font-medium">With Other Users (Your Choice)</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Profile information you choose to make public</li>
                    <li>Study room participation and messages</li>
                    <li>Leaderboard statistics (anonymized or with consent)</li>
                    <li>Learning achievements and milestones (with your permission)</li>
                  </ul>

                  <h3 className="text-lg font-medium">Service Providers</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Third-party services that help us operate the app (see Third-Party Services section)</li>
                    <li>Cloud hosting and database providers (Supabase)</li>
                    <li>Payment processors (Stripe) for subscription management</li>
                    <li>AI service providers (Groq) for generating insights</li>
                  </ul>

                  <h3 className="text-lg font-medium">Legal Requirements</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>When required by law, court order, or legal process</li>
                    <li>To protect the rights, safety, or property of our users or others</li>
                    <li>To investigate potential violations of our Terms of Service</li>
                  </ul>

                  <h3 className="text-lg font-medium">Business Transfers</h3>
                  <p>In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction. We will notify users of any such change in ownership.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Third-Party Services */}
          <section id="third-party-services">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>We use the following third-party services to operate our app:</p>
                  
                  <h3 className="text-lg font-medium">Supabase (Database and Authentication)</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Stores user accounts, study data, and app content</li>
                    <li>Provides secure authentication services</li>
                    <li>Privacy Policy: <a href="https://supabase.com/privacy" className="text-primary hover:underline">https://supabase.com/privacy</a></li>
                  </ul>

                  <h3 className="text-lg font-medium">Stripe (Payment Processing)</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Processes subscription payments securely</li>
                    <li>We do not store payment card information</li>
                    <li>Privacy Policy: <a href="https://stripe.com/privacy" className="text-primary hover:underline">https://stripe.com/privacy</a></li>
                  </ul>

                  <h3 className="text-lg font-medium">Groq (AI Insights)</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Generates personalized study insights and recommendations</li>
                    <li>Processes anonymized study patterns and preferences</li>
                    <li>Privacy Policy: <a href="https://groq.com/privacy-policy/" className="text-primary hover:underline">https://groq.com/privacy-policy/</a></li>
                  </ul>

                  <p className="font-medium">
                    These services have their own privacy policies and may collect additional information. We encourage you to review their privacy practices.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Data Security */}
          <section id="data-security">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>We implement appropriate technical and organizational measures to protect your personal information:</p>
                  
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Secure authentication and access controls</li>
                    <li>Regular security assessments and updates</li>
                    <li>Row-level security policies in our database</li>
                    <li>Limited access to personal information on a need-to-know basis</li>
                  </ul>

                  <p>
                    While we strive to protect your information, no security system is 100% secure. We cannot guarantee absolute security of your data transmitted over the internet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Your Rights */}
          <section id="your-rights">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>You have the following rights regarding your personal information:</p>
                  
                  <h3 className="text-lg font-medium">Access and Portability</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>View and download your personal information</li>
                    <li>Export your study data and session history</li>
                    <li>Request a copy of data we hold about you</li>
                  </ul>

                  <h3 className="text-lg font-medium">Correction and Updates</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Update your profile information at any time</li>
                    <li>Correct inaccurate or incomplete data</li>
                    <li>Modify your privacy and notification preferences</li>
                  </ul>

                  <h3 className="text-lg font-medium">Deletion</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Delete your account and associated data</li>
                    <li>Request removal of specific information</li>
                    <li>Note: Some data may be retained for legal or security purposes</li>
                  </ul>

                  <h3 className="text-lg font-medium">Opt-Out Options</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Disable marketing communications</li>
                    <li>Turn off data analytics and personalization</li>
                    <li>Limit sharing of information with other users</li>
                  </ul>

                  <p>
                    To exercise these rights, contact us at the email address provided in the Contact section.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Children's Privacy */}
          <section id="children-privacy">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    Our app is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13 without verifiable parental consent.
                  </p>
                  
                  <p>
                    If you are a parent or guardian and believe your child under 13 has provided us with personal information, please contact us immediately. We will delete such information from our systems.
                  </p>

                  <p>
                    For users between 13 and 18, we recommend parental guidance when using the app and sharing personal information.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* International Transfers */}
          <section id="international-transfers">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws than your country.
                  </p>
                  
                  <p>
                    When we transfer your personal information internationally, we implement appropriate safeguards, including:
                  </p>
                  
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Standard contractual clauses approved by regulatory authorities</li>
                    <li>Adequacy decisions by relevant data protection authorities</li>
                    <li>Certification schemes and codes of conduct</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Changes */}
          <section id="changes">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.
                  </p>
                  
                  <p>
                    When we make material changes, we will:
                  </p>
                  
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Notify you through the app or via email</li>
                    <li>Update the "Last updated" date at the top of this policy</li>
                    <li>Provide a prominent notice for significant changes</li>
                    <li>Obtain your consent where required by law</li>
                  </ul>

                  <p>
                    Your continued use of the app after such modifications constitutes acceptance of the updated Privacy Policy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contact */}
          <section id="contact">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>
                    If you have questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <p><strong>Email:</strong> privacy@triagenius.com</p>
                    <p><strong>Subject Line:</strong> Privacy Policy Inquiry</p>
                  </div>

                  <p>
                    We will respond to your inquiry within 30 days. For urgent privacy concerns, please include "URGENT" in your subject line.
                  </p>

                  <p className="text-xs text-muted-foreground">
                    This Privacy Policy complies with applicable privacy laws including CCPA, GDPR, and Apple App Store guidelines. Last reviewed: December 2024.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
