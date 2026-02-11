"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, Webhook, Phone, BrainCircuit, Database, Shield, Download } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [airtableKey, setAirtableKey] = useState("");
  const [airtableBase, setAirtableBase] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [vapiKey, setVapiKey] = useState("");
  const [vapiAssistant, setVapiAssistant] = useState("");
  const [n8nWebhook, setN8nWebhook] = useState("");
  const [n8nSecret, setN8nSecret] = useState("");

  const handleSave = () => {
    toast.info("Settings are configured via environment variables (.env.local). Update your .env.local file and restart the server to apply changes.");
  };

  const isDemo = true; // In a real app, check env

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your integrations and API keys</p>
      </div>

      {isDemo && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Demo Mode Active</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The app is running with mock data. Configure API keys in your .env.local file to connect to live services.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Airtable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" /> Airtable Configuration
          </CardTitle>
          <CardDescription>Connect to your Airtable base for lead management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input type="password" placeholder="pat..." value={airtableKey} onChange={(e) => setAirtableKey(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Base ID</Label>
            <Input placeholder="app..." value={airtableBase} onChange={(e) => setAirtableBase(e.target.value)} />
          </div>
          <Badge variant="outline" className="text-xs">
            {airtableKey ? "Configured" : "Not configured - using demo data"}
          </Badge>
        </CardContent>
      </Card>

      {/* OpenAI / LangChain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" /> OpenAI / LangChain
          </CardTitle>
          <CardDescription>Powers AI lead scoring and outreach generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>OpenAI API Key</Label>
            <Input type="password" placeholder="sk-..." value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">Uses GPT-4o-mini for scoring and message generation via LangChain</p>
        </CardContent>
      </Card>

      {/* Vapi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" /> Vapi Voice AI
          </CardTitle>
          <CardDescription>Configure automated voice calls for lead qualification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Vapi API Key</Label>
            <Input type="password" placeholder="Your Vapi API key" value={vapiKey} onChange={(e) => setVapiKey(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Assistant ID</Label>
            <Input placeholder="Your Vapi assistant ID" value={vapiAssistant} onChange={(e) => setVapiAssistant(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* n8n */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-4 w-4" /> n8n Automation
          </CardTitle>
          <CardDescription>Connect n8n workflows for automated follow-ups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input placeholder="https://your-n8n.com/webhook/..." value={n8nWebhook} onChange={(e) => setN8nWebhook(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <Input type="password" placeholder="Optional secret" value={n8nSecret} onChange={(e) => setN8nSecret(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Download className="h-4 w-4" /> Export All Leads (CSV)
          </Button>
          <p className="text-xs text-muted-foreground">
            Configure API keys in your <code className="px-1 py-0.5 rounded bg-muted">.env.local</code> file and restart the development server.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}
