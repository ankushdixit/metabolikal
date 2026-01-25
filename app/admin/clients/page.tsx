"use client";

import { useState, useEffect, useMemo } from "react";
import { useList } from "@refinedev/core";
import { Search, Users, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { ClientTable } from "@/components/admin/client-table";
import { SendMessageModal } from "@/components/admin/send-message-modal";
import { AddClientModal } from "@/components/admin/add-client-modal";
import { cn } from "@/lib/utils";
import type { Profile, CheckIn } from "@/lib/database.types";

type FilterTab = "all" | "active" | "flagged" | "invited" | "deactivated";

const PAGE_SIZE = 10;

/**
 * Client List Page
 * Displays all clients with search and filter capabilities
 */
export default function ClientsPage() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);

  // Get current admin user ID
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAdminId(data.user.id);
      }
    });
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Fetch all clients
  const clientsQuery = useList<Profile>({
    resource: "profiles",
    filters: [{ field: "role", operator: "eq", value: "client" }],
    sorters: [{ field: "full_name", order: "asc" }],
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Fetch all check-ins to get last check-in per client
  const checkInsQuery = useList<CheckIn>({
    resource: "check_ins",
    sorters: [{ field: "submitted_at", order: "desc" }],
    queryOptions: {
      enabled: !!adminId,
    },
  });

  // Process data
  const clients = clientsQuery.query.data?.data || [];
  const checkIns = checkInsQuery.query.data?.data || [];

  // Map clients with their last check-in
  const clientsWithCheckIns = useMemo(() => {
    return clients.map((client) => {
      const clientCheckIns = checkIns.filter((c) => c.client_id === client.id);
      const lastCheckIn = clientCheckIns.length > 0 ? clientCheckIns[0] : null;
      return { ...client, lastCheckIn };
    });
  }, [clients, checkIns]);

  // Filter clients based on search and tab
  const filteredClients = useMemo(() => {
    let result = clientsWithCheckIns;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (client) =>
          client.full_name?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query)
      );
    }

    // Apply tab filter
    if (activeTab === "flagged") {
      result = result.filter(
        (client) => client.lastCheckIn?.flagged_for_followup && !client.is_deactivated
      );
    } else if (activeTab === "invited") {
      result = result.filter(
        (client) => client.invited_at && !client.invitation_accepted_at && !client.is_deactivated
      );
    } else if (activeTab === "deactivated") {
      result = result.filter((client) => client.is_deactivated);
    } else if (activeTab === "active") {
      // Active = not flagged, not pending invite, and not deactivated
      result = result.filter(
        (client) =>
          !client.lastCheckIn?.flagged_for_followup &&
          !(client.invited_at && !client.invitation_accepted_at) &&
          !client.is_deactivated
      );
    }

    return result;
  }, [clientsWithCheckIns, searchQuery, activeTab]);

  // Paginate
  const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const isLoading = clientsQuery.query.isLoading || checkInsQuery.query.isLoading;

  // Tab counts
  const allCount = clientsWithCheckIns.length;
  const deactivatedCount = clientsWithCheckIns.filter((c) => c.is_deactivated).length;
  const flaggedCount = clientsWithCheckIns.filter(
    (c) => c.lastCheckIn?.flagged_for_followup && !c.is_deactivated
  ).length;
  const invitedCount = clientsWithCheckIns.filter(
    (c) => c.invited_at && !c.invitation_accepted_at && !c.is_deactivated
  ).length;
  const activeCount = allCount - flaggedCount - invitedCount - deactivatedCount;

  const tabs: { label: string; value: FilterTab; count: number }[] = [
    { label: "All", value: "all", count: allCount },
    { label: "Active", value: "active", count: activeCount },
    { label: "Invited", value: "invited", count: invitedCount },
    { label: "Flagged", value: "flagged", count: flaggedCount },
    { label: "Deactivated", value: "deactivated", count: deactivatedCount },
  ];

  const handleSendMessage = (client: Profile) => {
    setSelectedClient(client);
    setMessageModalOpen(true);
  };

  const handleResendInvite = async (client: Profile) => {
    try {
      const response = await fetch("/api/admin/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: client.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to resend invite:", result.error);
        toast.error(result.error || "Failed to resend invite");
        return;
      }

      toast.success("Invitation email resent successfully!");
      clientsQuery.query.refetch();
    } catch (error) {
      console.error("Error resending invite:", error);
      toast.error("An error occurred while resending the invite");
    }
  };

  const handleDeactivateClient = async (client: Profile) => {
    try {
      const response = await fetch("/api/admin/deactivate-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: client.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to deactivate client:", result.error);
        toast.error(result.error || "Failed to deactivate client");
        return;
      }

      toast.success(`${client.full_name || client.email} has been deactivated.`);
      clientsQuery.query.refetch();
    } catch (error) {
      console.error("Error deactivating client:", error);
      toast.error("An error occurred while deactivating the client");
    }
  };

  const handleReactivateClient = async (client: Profile) => {
    try {
      const response = await fetch("/api/admin/reactivate-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: client.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to reactivate client:", result.error);
        toast.error(result.error || "Failed to reactivate client");
        return;
      }

      toast.success(`${client.full_name || client.email} has been reactivated.`);
      clientsQuery.query.refetch();
    } catch (error) {
      console.error("Error reactivating client:", error);
      toast.error("An error occurred while reactivating the client");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="athletic-card p-6 pl-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              All <span className="gradient-athletic">Clients</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold">
              Manage and review all client profiles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAddClientModalOpen(true)}
              className="btn-athletic flex items-center gap-2 px-4 py-2 gradient-electric text-black glow-power text-sm font-bold uppercase tracking-wider"
            >
              <UserPlus className="h-4 w-4" />
              Add Client
            </button>
            <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-bold uppercase tracking-wider text-sm">
                {filteredClients.length} Client{filteredClients.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="athletic-card p-6 pl-8">
        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "btn-athletic px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                activeTab === tab.value
                  ? "gradient-electric text-black"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Client Table */}
      <ClientTable
        clients={paginatedClients}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onResendInvite={handleResendInvite}
        onDeactivateClient={handleDeactivateClient}
        onReactivateClient={handleReactivateClient}
      />

      {/* Send Message Modal */}
      {adminId && (
        <SendMessageModal
          client={selectedClient}
          adminId={adminId}
          isOpen={messageModalOpen}
          onClose={() => {
            setMessageModalOpen(false);
            setSelectedClient(null);
          }}
        />
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={addClientModalOpen}
        onClose={() => setAddClientModalOpen(false)}
        onSuccess={() => {
          // Refetch clients list after successful creation
          clientsQuery.query.refetch();
        }}
      />
    </div>
  );
}
