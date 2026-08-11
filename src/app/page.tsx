"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BrainCircuit, Phone, Mail, BarChart3, Zap, Target,
  ArrowRight, Sparkles, TrendingUp,
  Shield, Loader2, X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LandingPage() {
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    const result = await login(email, password);
    if (!result.success) {
      toast.error(result.error || "Login failed");
    }
    setLoggingIn(false);
  };

  const features = [
    {
      icon: BrainCircuit,
      title: "AI Lead Scoring",
      description: "Automatically score and prioritize leads using advanced AI analysis of company data, title, and engagement signals.",
    },
    {
      icon: Phone,
      title: "Voice AI Qualification",
      description: "Let AI handle initial qualification calls 24/7. Get structured insights on budget, timeline, and decision-making authority.",
    },
    {
      icon: Target,
      title: "Lead Enrichment",
      description: "Automatically enrich leads with company data, social profiles, tech stack, and AI-identified pain points.",
    },
    {
      icon: Mail,
      title: "AI Outreach Generation",
      description: "Generate personalized email, LinkedIn, and SMS sequences with AI that knows your prospect's context.",
    },
    {
      icon: BarChart3,
      title: "Pipeline Analytics",
      description: "Real-time visibility into your pipeline health, conversion rates, and AI-powered forecasting.",
    },
    {
      icon: Zap,
      title: "Workflow Automation",
      description: "Trigger automated workflows for hot leads, follow-ups, and team notifications via n8n integration.",
    },
  ];

  const steps = [
    { number: "01", title: "Import Leads", description: "Upload CSV or add leads manually. AI scores them instantly." },
    { number: "02", title: "AI Enrichment", description: "One click enriches leads with company research and pain points." },
    { number: "03", title: "Voice Qualification", description: "AI calls and qualifies leads, extracting budget and timeline." },
    { number: "04", title: "Smart Outreach", description: "Generate personalized sequences based on all gathered intelligence." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">SalesAI</span>
            <Badge variant="outline" className="ml-2 text-xs">Intelligence Platform</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowLogin(true)}>
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" /> AI-Powered Sales Intelligence
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Turn Cold Leads Into
            <span className="text-primary"> Qualified Opportunities</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            AI-powered lead scoring, voice qualification, enrichment, and outreach generation.
            All in one platform that works while you sleep.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" onClick={() => setShowLogin(true)}>
              Login to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Scale Outbound</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From lead import to closed deal, our AI handles the heavy lifting so you can focus on relationships.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold mb-4">From Lead to Opportunity in 4 Steps</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="text-4xl font-bold text-primary/20 mb-3">{step.number}</div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-4">Powered By</Badge>
          <h2 className="text-3xl font-bold mb-8">Built on Best-in-Class AI Infrastructure</h2>
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            {[
              { icon: BrainCircuit, label: "LangChain + OpenAI" },
              { icon: Phone, label: "Vapi Voice AI" },
              { icon: Zap, label: "n8n Automation" },
              { icon: Target, label: "Relevance AI" },
              { icon: TrendingUp, label: "Airtable CRM" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Sales Process?</h2>
          <p className="text-primary-foreground/80">
            Join forward-thinking sales teams using AI to qualify leads faster and close more deals.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>SalesAI Intelligence Platform</span>
          </div>
          <p>© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Welcome Back</h2>
                  <p className="text-sm text-muted-foreground">Login to your dashboard</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowLogin(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loggingIn}>
                  {loggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
