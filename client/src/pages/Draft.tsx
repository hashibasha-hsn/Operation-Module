import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus,
  Search,
  Info,
  RefreshCw,
  Download,
  LayoutGrid,
  Calendar,
  ChevronDown,
  FileText,
  Loader2,
  List,
} from "lucide-react";
import { toast } from "sonner";
import AddTicketModal from "@/components/AddTicketModal";
import { getStoredUser } from "@/lib/authStorage";
import { fetchEntities, fetchUsers, getUserDisplayName } from "@/lib/processApi";
import {
  createTicket,
  exportTicketsToCsv,
  exportTicketsToExcel,
  exportTicketsToPdf,
  fetchAllTickets,
  fetchTicketsAssignedToMe,
  fetchTicketsCreatedByMe,
  isTicketDueToday,
  isTicketOnTime,
  isTicketOverdue,
  type TicketPriority,
  type TicketRecord,
} from "@/lib/ticketApi";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  "Total",
  "Open",
  "In Progress",
  "On Hold",
  "Completed",
  "Closed",
  "Rejected",
  "Overdue",
  "On Time",
  "Due Today",
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type TabId = "assigned" | "created" | "closure";
type ActivityFilter = "all" | "active" | "inactive";
type ViewMode = "list" | "grid";

const STATUS_API_MAP: Record<string, string> = {
  Open: "open",
  "In Progress": "in_progress",
  "On Hold": "on_hold",
  Completed: "complete",
  Closed: "closed",
  Rejected: "rejected",
};

const EXPORT_COLUMNS = [
  "id",
  "title",
  "description",
  "status",
  "priority",
  "assignedTo",
  "storeId",
  "createdBy",
  "dueDate",
  "createdAt",
];

function matchesStatus(ticket: TicketRecord, status: StatusFilter): boolean {
  if (status === "Total") return true;
  if (status === "Overdue") return isTicketOverdue(ticket);
  if (status === "On Time") return isTicketOnTime(ticket);
  if (status === "Due Today") return isTicketDueToday(ticket);
  const apiStatus = STATUS_API_MAP[status];
  return apiStatus ? ticket.status === apiStatus : true;
}

function inDateRange(ticket: TicketRecord, start?: Date, end?: Date): boolean {
  if (!start && !end) return true;
  const created = new Date(ticket.createdAt).getTime();
  if (Number.isNaN(created)) return true;
  if (start) {
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    if (created < s.getTime()) return false;
  }
  if (end) {
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    if (created > e.getTime()) return false;
  }
  return true;
}

function statusBadgeVariant(status: string) {
  if (status === "closed" || status === "complete") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  if (status === "in_progress") return "secondary" as const;
  return "outline" as const;
}

export default function Draft() {
  const [activeTab, setActiveTab] = useState<TabId>("assigned");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("Total");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("active");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [appliedStart, setAppliedStart] = useState<Date | undefined>();
  const [appliedEnd, setAppliedEnd] = useState<Date | undefined>();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; label: string }[]>([]);

  const currentUserId = useMemo(() => {
    const user = getStoredUser();
    return (user.userId ?? user.id ?? "") as string;
  }, []);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      let data: TicketRecord[] = [];
      if (activeTab === "assigned") {
        data = await fetchTicketsAssignedToMe();
      } else if (activeTab === "created") {
        data = await fetchTicketsCreatedByMe();
      } else {
        // Closure Assigned: tickets assigned to me that are complete (awaiting closure)
        const assigned = await fetchTicketsAssignedToMe();
        data = assigned.filter((t) => t.status === "complete");
        if (data.length === 0) {
          // Fallback: show all org tickets in complete status if none assigned
          const all = await fetchAllTickets();
          data = all.filter(
            (t) =>
              t.status === "complete" &&
              (t.assignedTo === currentUserId || !currentUserId),
          );
        }
      }
      setTickets(data || []);
      setLastUpdated(new Date());
      setVisibleCount(PAGE_SIZE);
    } catch (err: any) {
      console.error("Failed to load tickets:", err);
      toast.error(err.message || "Failed to load tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUserId]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    fetchEntities()
      .then((rows) =>
        setStores(
          (rows || []).map((e: any) => ({
            id: e.id,
            name: e.storeName || e.name || e.entityId || e.id,
          })),
        ),
      )
      .catch(() => setStores([]));
    fetchUsers(500)
      .then((rows) =>
        setUsers(
          (rows || [])
            .map((u: any) => ({
              id: (u.userId ?? u.id) as string,
              label: getUserDisplayName(u),
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        ),
      )
      .catch(() => setUsers([]));
  }, []);

  const dateFiltered = useMemo(
    () => tickets.filter((t) => inDateRange(t, appliedStart, appliedEnd)),
    [tickets, appliedStart, appliedEnd],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      Total: dateFiltered.length,
      Open: 0,
      "In Progress": 0,
      "On Hold": 0,
      Completed: 0,
      Closed: 0,
      Rejected: 0,
      Overdue: 0,
      "On Time": 0,
      "Due Today": 0,
    };
    for (const ticket of dateFiltered) {
      if (ticket.status === "open") counts.Open += 1;
      if (ticket.status === "in_progress") counts["In Progress"] += 1;
      if (ticket.status === "on_hold") counts["On Hold"] += 1;
      if (ticket.status === "complete") counts.Completed += 1;
      if (ticket.status === "closed") counts.Closed += 1;
      if (ticket.status === "rejected") counts.Rejected += 1;
      if (isTicketOverdue(ticket)) counts.Overdue += 1;
      if (isTicketOnTime(ticket)) counts["On Time"] += 1;
      if (isTicketDueToday(ticket)) counts["Due Today"] += 1;
    }
    return counts;
  }, [dateFiltered]);

  const filteredTickets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return dateFiltered.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.title?.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query) ||
        ticket.id?.toLowerCase().includes(query);

      const matchesStatusFilter = matchesStatus(ticket, activeStatus);

      const isInactive = ["closed", "rejected"].includes(ticket.status);
      const matchesActivity =
        activityFilter === "all" ||
        (activityFilter === "active" && !isInactive) ||
        (activityFilter === "inactive" && isInactive);

      return matchesSearch && matchesStatusFilter && matchesActivity;
    });
  }, [dateFiltered, searchTerm, activeStatus, activityFilter]);

  const visibleTickets = filteredTickets.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTickets.length;

  const storeLabel = (storeId?: string) => {
    if (!storeId) return "N/A";
    return stores.find((s) => s.id === storeId)?.name || storeId;
  };

  const userLabel = (userId?: string) => {
    if (!userId) return "N/A";
    return users.find((u) => u.id === userId)?.label || userId;
  };

  const applyDateFilter = () => {
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setVisibleCount(PAGE_SIZE);
    toast.success("Date filter applied");
  };

  const handleExport = async (formatType: "csv" | "excel" | "pdf") => {
    if (filteredTickets.length === 0) {
      toast.error("No tickets to export");
      return;
    }
    setExporting(true);
    try {
      const rows = filteredTickets.map((t) => ({
        ...t,
        storeId: storeLabel(t.storeId),
        assignedTo: userLabel(t.assignedTo),
        createdBy: userLabel(t.createdBy),
        dueDate: t.dueDate ? format(new Date(t.dueDate), "yyyy-MM-dd HH:mm") : "",
        createdAt: t.createdAt ? format(new Date(t.createdAt), "yyyy-MM-dd HH:mm") : "",
      }));
      if (formatType === "csv") {
        exportTicketsToCsv(rows as TicketRecord[], EXPORT_COLUMNS, "ticket-dashboard.csv");
      } else if (formatType === "excel") {
        await exportTicketsToExcel(rows as TicketRecord[], EXPORT_COLUMNS, "ticket-dashboard.xlsx");
      } else {
        await exportTicketsToPdf(rows as TicketRecord[], EXPORT_COLUMNS, "ticket-dashboard.pdf");
      }
      toast.success(`Exported ${filteredTickets.length} ticket(s)`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleCreateTicket = async (data: {
    tab: "auto" | "custom";
    storeId: string;
    categoryId?: string;
    title: string;
    description: string;
    priority: string;
    assignedTo: string;
    dueDate?: Date;
    attachments?: { name: string; type: string; dataUrl: string }[];
  }) => {
    try {
      const priorityMap: Record<string, TicketPriority> = {
        Critical: "highest",
        Highest: "highest",
        High: "high",
        Medium: "medium",
        Low: "low",
        Lowest: "lowest",
      };
      await createTicket({
        title: data.title,
        description: data.description,
        priority: priorityMap[data.priority] || "medium",
        storeId: data.storeId,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate?.toISOString(),
        ticketType: data.tab === "auto" ? "auto" : "custom",
        categoryId: data.categoryId || undefined,
        attachments: data.attachments?.length ? data.attachments : undefined,
        status: "open",
      });
      toast.success("Ticket created");
      await loadTickets();
    } catch (err: any) {
      toast.error(err.message || "Failed to create ticket");
      throw err;
    }
  };

  const tabs = [
    { id: "assigned" as const, label: "Assigned to me" },
    { id: "created" as const, label: "Created by me" },
    { id: "closure" as const, label: "Closure Assigned" },
  ];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Dashboard</h1>
          <p className="text-gray-500 mt-1">Track and manage all your task tickets in one place.</p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => setIsTicketModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-2 text-sm text-gray-500"
      >
        <span>
          Last Updated At:{" "}
          {lastUpdated ? format(lastUpdated, "MMM d, yyyy HH:mm:ss") : "-"}
        </span>
        <button
          type="button"
          onClick={() => void loadTickets()}
          disabled={loading}
          className="inline-flex"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 cursor-pointer hover:text-gray-700 ${loading ? "animate-spin" : ""}`} />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex gap-1 bg-white p-1 rounded-full shadow-sm border border-gray-200 w-fit"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-orange-500 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap gap-4 items-center"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search Tickets..."
                className="pl-10 border-gray-300 focus:border-orange-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search tickets by keyword</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-5 h-5 text-gray-400 cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Search by title, description, or ticket ID</p>
          </TooltipContent>
        </Tooltip>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-36 justify-start border-gray-300">
                <Calendar className="w-4 h-4 mr-2" />
                {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
            </PopoverContent>
          </Popover>
          <span className="text-gray-500">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-36 justify-start border-gray-300">
                <Calendar className="w-4 h-4 mr-2" />
                {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={applyDateFilter}>
              Apply
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Apply date filter</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="flex flex-wrap gap-2 items-center"
      >
        {STATUS_FILTERS.map((status) => (
          <Tooltip key={status}>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setActiveStatus(status);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeStatus === status
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status}
                <span className="ml-1 opacity-80">({statusCounts[status]})</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                {status} Tickets : {statusCounts[status]}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-2 border-gray-300">
              {activityFilter === "all" ? "All" : activityFilter === "active" ? "Active" : "Inactive"}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setActivityFilter("all")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActivityFilter("active")}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActivityFilter("inactive")}>Inactive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex gap-3 items-center"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="border-gray-300"
              disabled={!hasMore || loading}
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Load More
              {hasMore && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({visibleTickets.length}/{filteredTickets.length})
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Load more tickets</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-300" disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export CSV
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export tickets data</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => void handleExport("csv")}>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleExport("excel")}>Export as Excel</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleExport("pdf")}>Export as PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-gray-300"
              onClick={() => setViewMode((m) => (m === "list" ? "grid" : "list"))}
            >
              {viewMode === "list" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Change view layout</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p>Loading tickets…</p>
          </div>
        ) : visibleTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg text-center">
              No Tickets available for this date range. Try selecting a different date range :)
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Store</th>
                    <th className="px-4 py-3 font-medium">Assigned To</th>
                    <th className="px-4 py-3 font-medium">Due Date</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{ticket.title}</div>
                        {ticket.description && (
                          <div className="text-xs text-gray-500 truncate max-w-[280px]">
                            {ticket.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeVariant(ticket.status)}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        {isTicketOverdue(ticket) && (
                          <Badge variant="destructive" className="ml-1">
                            Overdue
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize">{ticket.priority}</td>
                      <td className="px-4 py-3">{storeLabel(ticket.storeId)}</td>
                      <td className="px-4 py-3">{userLabel(ticket.assignedTo)}</td>
                      <td className="px-4 py-3">
                        {ticket.dueDate
                          ? format(new Date(ticket.dueDate), "MMM d, yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {ticket.createdAt
                          ? format(new Date(ticket.createdAt), "MMM d, yyyy")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white border rounded-lg p-4 space-y-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{ticket.title}</h3>
                  <Badge variant={statusBadgeVariant(ticket.status)}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
                {ticket.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                )}
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <span className="text-gray-400">Priority:</span>{" "}
                    <span className="capitalize">{ticket.priority}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Store:</span> {storeLabel(ticket.storeId)}
                  </p>
                  <p>
                    <span className="text-gray-400">Assigned:</span> {userLabel(ticket.assignedTo)}
                  </p>
                  <p>
                    <span className="text-gray-400">Due:</span>{" "}
                    {ticket.dueDate ? format(new Date(ticket.dueDate), "MMM d, yyyy") : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <AddTicketModal
        open={isTicketModalOpen}
        onOpenChange={setIsTicketModalOpen}
        onCreateTicket={handleCreateTicket}
      />
    </div>
  );
}
