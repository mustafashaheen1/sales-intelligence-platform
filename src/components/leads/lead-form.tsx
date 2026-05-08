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
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors({});
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const truncated = digits.slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: truncated }));
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = "Name is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && formData.phone.length !== 10) {
      newErrors.phone = "Phone must be exactly 10 digits";
    }

    if (formData.linkedinUrl) {
      const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
      if (!linkedinRegex.test(formData.linkedinUrl)) {
        newErrors.linkedin = "Please enter a valid LinkedIn profile URL (linkedin.com/in/...)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    const submitData = { ...formData };
    if (submitData.linkedinUrl && !submitData.linkedinUrl.startsWith('http')) {
      submitData.linkedinUrl = 'https://' + submitData.linkedinUrl;
    }

    setLoading(true);
    if (mode === "create") setScoring(true);
    try {
      await onSubmit(submitData);
      toast.success(mode === "create" ? "Lead created and scored!" : "Lead updated!");
      onOpenChange(false);
      setFormData({ name: "", email: "", phone: "", company: "", title: "", linkedinUrl: "", notes: "" });
      setErrors({});
    } catch (err: any) {
      if (err?.status === 409 || err?.field) {
        const field = err.field as "phone" | "email" | "both";
        const existingLeadId = err.existingLeadId;
        const newErrors: Record<string, string> = {};
        if (field === "phone" || field === "both") newErrors.phone = "Duplicate phone number";
        if (field === "email" || field === "both") newErrors.email = err.error;
        if (field === "phone") newErrors.phone = err.error;
        if (existingLeadId) newErrors._duplicateLeadId = existingLeadId;
        setErrors(newErrors);
        toast.error(err.error || "Duplicate lead detected");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
      setScoring(false);
    }
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
              <Input id="name" value={formData.name || ""} onChange={(e) => update("name", e.target.value)} placeholder="John Smith" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="text"
                value={formData.email || ""}
                onChange={(e) => update("email", e.target.value)}
                placeholder="john@company.com"
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">
                  {errors.email}
                  {errors._duplicateLeadId && (
                    <>{" "}<a href={`/leads/${errors._duplicateLeadId}`} className="underline font-medium">View existing lead</a></>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={handlePhoneChange}
                placeholder="5551234567"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
                className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground">10 digits only, no country code</p>
              {errors.phone && (
                <p className="text-xs text-destructive">
                  {errors.phone}
                  {errors._duplicateLeadId && (
                    <>{" "}<a href={`/leads/${errors._duplicateLeadId}`} className="underline font-medium">View existing lead</a></>
                  )}
                </p>
              )}
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
            <Input id="linkedin" value={formData.linkedinUrl || ""} onChange={(e) => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/username" />
            {errors.linkedin && <p className="text-xs text-destructive mt-1">{errors.linkedin}</p>}
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
