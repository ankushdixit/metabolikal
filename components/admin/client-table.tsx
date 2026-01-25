"use client";

import Link from "next/link";
import { Flag, Eye, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
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
}: ClientTableProps) {
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
                  {client.lastCheckIn?.flagged_for_followup ? (
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
                    {onSendMessage && (
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
