"use client";

import { useState, useEffect, useMemo } from "react";
import { useList } from "@refinedev/core";
import { Search, Users } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { ClientTable } from "@/components/admin/client-table";
import { cn } from "@/lib/utils";
import type { Profile, CheckIn } from "@/lib/database.types";

type FilterTab = "all" | "active" | "flagged";

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
      result = result.filter((client) => client.lastCheckIn?.flagged_for_followup);
    } else if (activeTab === "active") {
      result = result.filter((client) => !client.lastCheckIn?.flagged_for_followup);
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
  const flaggedCount = clientsWithCheckIns.filter(
    (c) => c.lastCheckIn?.flagged_for_followup
  ).length;
  const activeCount = allCount - flaggedCount;

  const tabs: { label: string; value: FilterTab; count: number }[] = [
    { label: "All", value: "all", count: allCount },
    { label: "Active", value: "active", count: activeCount },
    { label: "Flagged", value: "flagged", count: flaggedCount },
  ];

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
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-bold uppercase tracking-wider text-sm">
              {filteredClients.length} Client{filteredClients.length !== 1 ? "s" : ""}
            </span>
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
      />
    </div>
  );
}
