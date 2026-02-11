"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mail, Linkedin, MessageSquare, Loader2, Copy, Sparkles, CheckCheck } from "lucide-react";
import { Lead, OutreachType, OutreachTone } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [type, setType] = useState<OutreachType>("email");
  const [tone, setTone] = useState<OutreachTone>("professional");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ subject?: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/leads")
      .then((res) => res.json())
      .then((data) => setLeads(data.leads || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedLeadId) {
      toast.error("Please select a lead");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch(`/api/leads/${selectedLeadId}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, tone }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setResult(data);
      toast.success("Message generated!");
    } catch {
      toast.error("Failed to generate outreach");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      const text = result.subject ? `Subject: ${result.subject}\n\n${result.message}` : result.message;
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const typeIcons: Record<OutreachType, React.ElementType> = {
    email: Mail,
    linkedin: Linkedin,
    sms: MessageSquare,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Outreach</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate personalized messages with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Generate Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Lead</label>
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId} placeholder="Choose a lead...">
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} {lead.company ? `(${lead.company})` : ""}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message Type</label>
              <Tabs value={type} onValueChange={(v) => setType(v as OutreachType)}>
                <TabsList className="w-full">
                  <TabsTrigger value="email" className="flex-1 gap-1">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </TabsTrigger>
                  <TabsTrigger value="linkedin" className="flex-1 gap-1">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="flex-1 gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> SMS
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <Select value={tone} onValueChange={(v) => setTone(v as OutreachTone)}>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </Select>
            </div>

            <Button onClick={handleGenerate} disabled={generating || !selectedLeadId} className="w-full">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate Message
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Preview</CardTitle>
              {result && (
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? <CheckCheck className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generating ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : result ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  {(() => {
                    const Icon = typeIcons[type];
                    return <Icon className="h-4 w-4 text-primary" />;
                  })()}
                  <Badge variant="outline" className="text-xs">{type}</Badge>
                  <Badge variant="outline" className="text-xs">{tone}</Badge>
                </div>
                {result.subject && (
                  <div className="p-2 rounded bg-muted/50 mb-2">
                    <span className="text-xs text-muted-foreground">Subject:</span>
                    <p className="text-sm font-medium">{result.subject}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{result.message}</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select a lead and generate a message</p>
                <p className="text-xs text-muted-foreground/60 mt-1">AI will personalize the message based on lead data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
