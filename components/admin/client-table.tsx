"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Flag,
  Eye,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Mail,
  Loader2,
  UserX,
  UserCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Profile, CheckIn } from "@/lib/database.types";

interface ClientWithCheckIn extends Profile {
  lastCheckIn?: CheckIn | null;
}

interface ClientTableProps {
  clients: ClientWithCheckIn[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  onSendMessage?: (client: Profile) => void;
  onResendInvite?: (client: Profile) => Promise<void>;
  onDeactivateClient?: (client: Profile) => Promise<void>;
  onReactivateClient?: (client: Profile) => Promise<void>;
}

/**
 * Helper to determine client status
 */
function getClientStatus(client: ClientWithCheckIn): "deactivated" | "invited" | "active" | null {
  // Deactivated takes precedence
  if (client.is_deactivated) {
    return "deactivated";
  }
  // If invited but not accepted, show "Invited"
  if (client.invited_at && !client.invitation_accepted_at) {
    return "invited";
  }
  return null;
}

/**
 * Client table component for admin
 * Displays list of clients with pagination
 */
export function ClientTable({
  clients,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  onSendMessage,
  onResendInvite,
  onDeactivateClient,
  onReactivateClient,
}: ClientTableProps) {
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  const handleResendInvite = async (client: Profile) => {
    if (!onResendInvite) return;
    setResendingId(client.id);
    try {
      await onResendInvite(client);
    } finally {
      setResendingId(null);
    }
  };

  const handleDeactivate = async (client: Profile) => {
    if (!onDeactivateClient) return;
    setDeactivatingId(client.id);
    try {
      await onDeactivateClient(client);
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleReactivate = async (client: Profile) => {
    if (!onReactivateClient) return;
    setReactivatingId(client.id);
    try {
      await onReactivateClient(client);
    } finally {
      setReactivatingId(null);
    }
  };
  if (isLoading) {
    return (
      <div className="athletic-card overflow-hidden">
        <div className="p-4 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-secondary/50">
                <div className="w-10 h-10 bg-secondary" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-secondary mb-2" />
                  <div className="h-3 w-48 bg-secondary" />
                </div>
                <div className="h-8 w-20 bg-secondary" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="athletic-card p-8 pl-10 text-center">
        <p className="text-muted-foreground font-bold">No clients found</p>
      </div>
    );
  }

  return (
    <div className="athletic-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                Email
              </TableHead>
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                Last Check-in
              </TableHead>
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="font-black text-xs tracking-wider uppercase text-muted-foreground text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary font-black">
                        {client.full_name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <span className="font-bold">{client.full_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{client.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {client.lastCheckIn ? (
                    new Date(client.lastCheckIn.submitted_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  ) : (
                    <span className="text-muted-foreground/50">No check-ins</span>
                  )}
                </TableCell>
                <TableCell>
                  {getClientStatus(client) === "deactivated" ? (
                    <span className="text-red-400 font-bold text-xs uppercase">Deactivated</span>
                  ) : getClientStatus(client) === "invited" ? (
                    <span className="text-blue-400 font-bold text-xs uppercase">Invited</span>
                  ) : client.lastCheckIn?.flagged_for_followup ? (
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-primary" />
                      <span className="text-primary font-bold text-xs uppercase">Flagged</span>
                    </div>
                  ) : client.lastCheckIn && !client.lastCheckIn.reviewed_at ? (
                    <span className="text-yellow-500 font-bold text-xs uppercase">
                      Pending Review
                    </span>
                  ) : (
                    <span className="text-neon-green font-bold text-xs uppercase">Active</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Resend Invite button for pending invitations */}
                    {onResendInvite && getClientStatus(client) === "invited" && (
                      <button
                        onClick={() => handleResendInvite(client)}
                        disabled={resendingId === client.id}
                        className="btn-athletic inline-flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-sm disabled:opacity-50"
                        title="Resend invitation email"
                      >
                        {resendingId === client.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    {/* Reactivate button for deactivated users */}
                    {onReactivateClient && getClientStatus(client) === "deactivated" && (
                      <button
                        onClick={() => handleReactivate(client)}
                        disabled={reactivatingId === client.id}
                        className="btn-athletic inline-flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm disabled:opacity-50"
                        title="Reactivate client"
                      >
                        {reactivatingId === client.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    {/* Deactivate button for active users */}
                    {onDeactivateClient && getClientStatus(client) !== "deactivated" && (
                      <button
                        onClick={() => handleDeactivate(client)}
                        disabled={deactivatingId === client.id}
                        className="btn-athletic inline-flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm disabled:opacity-50"
                        title="Deactivate client"
                      >
                        {deactivatingId === client.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    {onSendMessage && !client.is_deactivated && (
                      <button
                        onClick={() => onSendMessage(client)}
                        className="btn-athletic inline-flex items-center gap-2 px-3 py-2 bg-primary/20 text-primary hover:bg-primary/30 text-sm"
                        title="Send message"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    )}
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="btn-athletic inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground font-bold">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-athletic p-2 bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-athletic p-2 bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
