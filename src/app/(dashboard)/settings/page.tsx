"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Shield, Loader2, Sparkles, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";

function DemoModeSection() {
  const [isPopulating, setIsPopulating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [leadCount, setLeadCount] = useState(8);

  const handlePopulate = async () => {
    setIsPopulating(true);
    try {
      const res = await fetch("/api/demo/populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: leadCount }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Added ${data.count} demo leads`);
      } else {
        toast.error("Failed to add demo leads");
      }
    } catch {
      toast.error("Error adding demo leads");
    } finally {
      setIsPopulating(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear all demo leads?")) return;
    setIsClearing(true);
    try {
      const res = await fetch("/api/demo/clear", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error("Failed to clear demo leads");
      }
    } catch {
      toast.error("Error clearing demo leads");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Demo Mode
        </CardTitle>
        <CardDescription>Populate the dashboard with sample leads for demos and recordings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Label htmlFor="leadCount" className="shrink-0">Number of leads</Label>
          <select
            id="leadCount"
            value={leadCount}
            onChange={(e) => setLeadCount(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm bg-background"
          >
            <option value={5}>5</option>
            <option value={8}>8</option>
            <option value={10}>10</option>
          </select>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={handlePopulate} disabled={isPopulating || isClearing}>
            {isPopulating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>
            ) : (
              <><Users className="h-4 w-4 mr-2" />Populate Demo Leads</>
            )}
          </Button>
          <Button variant="destructive" onClick={handleClear} disabled={isPopulating || isClearing}>
            {isClearing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Clearing...</>
            ) : (
              <><Trash2 className="h-4 w-4 mr-2" />Clear Demo Leads</>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Demo leads use phone numbers starting with +15550. Clear Demo Leads only removes these — your real leads are safe.
        </p>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and data</p>
      </div>

      <DemoModeSection />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-destructive">Passwords do not match</p>
          )}
          <Button
            onClick={handleChangePassword}
            disabled={
              changingPassword ||
              !currentPassword ||
              !newPassword ||
              newPassword !== confirmPassword
            }
          >
            {changingPassword ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Changing...
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Download className="h-4 w-4" /> Export All Leads (CSV)
          </Button>
          <p className="text-xs text-muted-foreground">
            Configure API keys in your{" "}
            <code className="px-1 py-0.5 rounded bg-muted">.env.local</code> file and restart the
            development server.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
