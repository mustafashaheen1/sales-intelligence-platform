"use client";

import { Lead } from "@/types";
import { cn, getScoreBgColor, getStatusColor, getInitials, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Eye, Phone, Mail, Trash2, BrainCircuit } from "lucide-react";
import { LeadScoreBadge } from "./lead-score-badge";
import Link from "next/link";

interface LeadTableProps {
  leads: Lead[];
  loading: boolean;
  onDelete?: (id: string) => void;
  onScore?: (id: string) => void;
}

export function LeadTable({ leads, loading, onDelete, onScore }: LeadTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BrainCircuit className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No leads yet</h3>
        <p className="text-sm text-muted-foreground">Add your first lead to get started with AI-powered scoring.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Lead</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Company</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Title</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">AI Score</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Source</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Last Contact</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="flex items-center gap-3 group">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {getInitials(lead.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">{lead.company || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">{lead.title || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <LeadScoreBadge score={lead.aiScore} label={lead.aiScoreLabel} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("text-xs", getStatusColor(lead.status))}>
                    {lead.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">{lead.leadSource || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">{formatDate(lead.lastContacted)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <Link href={`/leads/${lead.id}`}>
                        <DropdownMenuItem>
                          <Eye className="h-3.5 w-3.5 mr-2" /> View Details
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={() => onScore?.(lead.id)}>
                        <BrainCircuit className="h-3.5 w-3.5 mr-2" /> Re-Score AI
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem destructive onClick={() => onDelete?.(lead.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
