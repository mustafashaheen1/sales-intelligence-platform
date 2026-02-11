"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem } from "@/components/ui/select";
import { Lead, LeadSource } from "@/types";
import { Loader2, BrainCircuit } from "lucide-react";
import { toast } from "sonner";

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Lead>) => Promise<any>;
  initialData?: Partial<Lead>;
  mode?: "create" | "edit";
}

export function LeadForm({ open, onOpenChange, onSubmit, initialData, mode = "create" }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>(initialData || {
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    linkedinUrl: "",
    leadSource: undefined,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }
    setLoading(true);
    if (mode === "create") setScoring(true);
    try {
      await onSubmit(formData);
      toast.success(mode === "create" ? "Lead created and scored!" : "Lead updated!");
      onOpenChange(false);
      setFormData({ name: "", email: "", phone: "", company: "", title: "", linkedinUrl: "", notes: "" });
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
      setScoring(false);
    }
  };

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Lead" : "Edit Lead"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new lead. AI will automatically score them." : "Update lead information."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={formData.name || ""} onChange={(e) => update("name", e.target.value)} placeholder="John Smith" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email || ""} onChange={(e) => update("email", e.target.value)} placeholder="john@company.com" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone || ""} onChange={(e) => update("phone", e.target.value)} placeholder="+1-555-0100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={formData.company || ""} onChange={(e) => update("company", e.target.value)} placeholder="TechCorp Inc" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={formData.title || ""} onChange={(e) => update("title", e.target.value)} placeholder="VP of Engineering" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadSource">Lead Source</Label>
              <Select value={formData.leadSource || ""} onValueChange={(v) => update("leadSource", v)}>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                <SelectItem value="Event">Event</SelectItem>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input id="linkedin" value={formData.linkedinUrl || ""} onChange={(e) => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes || ""} onChange={(e) => update("notes", e.target.value)} placeholder="Any additional notes..." rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {scoring ? (
                <>
                  <BrainCircuit className="h-4 w-4 mr-2 animate-spin" />
                  AI Scoring...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                mode === "create" ? "Add & Score Lead" : "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
