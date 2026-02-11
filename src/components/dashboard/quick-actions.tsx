"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Upload, Phone, Zap } from "lucide-react";
import Link from "next/link";

interface QuickActionsProps {
  onAddLead?: () => void;
  onImport?: () => void;
}

export function QuickActions({ onAddLead, onImport }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button className="w-full justify-start gap-2" variant="outline" onClick={onAddLead}>
          <UserPlus className="h-4 w-4" />
          Add New Lead
        </Button>
        <Button className="w-full justify-start gap-2" variant="outline" onClick={onImport}>
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
        <Link href="/calls" className="block">
          <Button className="w-full justify-start gap-2" variant="outline">
            <Phone className="h-4 w-4" />
            Start Calling Campaign
          </Button>
        </Link>
        <Link href="/outreach" className="block">
          <Button className="w-full justify-start gap-2" variant="outline">
            <Zap className="h-4 w-4" />
            Generate Outreach
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
