import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  CalendarIcon,
  Download,
  RefreshCw,
  FileText,
  Plus,
  ChevronDown,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  Settings,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import { toast } from "sonner";
import {
  addTicketComment,
  createTicket,
  deleteTicket,
  exportTicketsToCsv,
  fetchAllTickets,
  fetchTicketById,
  fetchTicketCategories,
  fetchTicketClosureQuestions,
  fetchTicketSettings,
  fetchTicketTags,
  fetchTicketsAssignedToMe,
  fetchTicketsCreatedByMe,
  isTicketDueToday,
  isTicketOnTime,
  isTicketOverdue,
  updateTicketStatus,
  type TicketRecord,
} from "@/lib/ticketApi";
import { fetchEntities, fetchUsers, getUserDisplayName } from "@/lib/processApi";
import { humanLabel } from "@/lib/displayLabels";

type AssignOption = { id: string; label: string };

const ALL_EXPORT_COLUMNS = [
  "title",
  "description",
  "priority",
  "status",
  "assignedTo",
  "storeId",
  "dueDate",
  "createdBy",
  "ticketType",
  "categoryId",
  "createdAt",
] as const;

const COLUMN_DEFS: { key: string; label: string; sortable?: boolean }[] = [
  { key: "title", label: "Title", sortable: true },
  { key: "description", label: "Description" },
  { key: "priority", label: "Priority", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "assignedTo", label: "Assigned To", sortable: true },
  { key: "storeId", label: "Store", sortable: true },
  { key: "dueDate", label: "Due Date", sortable: true },
  { key: "timeLeft", label: "Time Left" },
  { key: "createdBy", label: "Created By", sortable: true },
];

export default function Tickets() {
  const [primaryFilter, setPrimaryFilter] = useState("assigned-to-me");
  const [statusFilter, setStatusFilter] = useState("total");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tags, setTags] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [users, setUsers] = useState<AssignOption[]>([]);
  const [ticketSettings, setTicketSettings] = useState<any>(null);
  const [closureQuestions, setClosureQuestions] = useState<any[]>([]);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [closureAnswers, setClosureAnswers] = useState<Record<string, string>>({});
  const [isClosing, setIsClosing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "title",
    "description",
    "priority",
    "status",
    "assignedTo",
    "storeId",
    "dueDate",
    "timeLeft",
  ]);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isCreating, setIsCreating] = useState(false);

  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium",
    storeId: "",
    assignedTo: "",
    dueDate: undefined as Date | undefined,
    ticketType: "custom" as "custom" | "auto",
    categoryId: "",
    tagValues: {} as Record<string, string>,
    attachments: [] as { name: string; type: string; dataUrl: string }[],
  });

  useEffect(() => {
    fetchTickets();
    fetchTicketTags().then(setTags).catch(() => setTags([]));
    fetchTicketCategories().then(setCategories).catch(() => setCategories([]));
    fetchEntities().then(setEntities).catch(() => setEntities([]));
    fetchUsers(200)
      .then((userRows) =>
        setUsers(
          userRows
            .map((user: any) => ({
              id: user.userId ?? user.id,
              label: getUserDisplayName(user),
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        ),
      )
      .catch(() => setUsers([]));
    fetchTicketSettings().then(setTicketSettings).catch(() => null);
    fetchTicketClosureQuestions(true).then(setClosureQuestions).catch(() => setClosureQuestions([]));
  }, [primaryFilter]);

  const applicableTags = useMemo(
    () =>
      (tags || []).filter(
        (tag) =>
          tag.isActive !== false &&
          (tag.tagType === "ticket" || tag.tagType === "both" || !tag.tagType),
      ),
    [tags],
  );

  const enabledPriorities = useMemo(() => {
    const levels = ticketSettings?.priorityLevels;
    if (Array.isArray(levels) && levels.length) {
      return levels.filter((level: any) => level.enabled !== false);
    }
    return [
      { key: "highest", label: "Highest" },
      { key: "high", label: "High" },
      { key: "medium", label: "Medium" },
      { key: "low", label: "Low" },
      { key: "lowest", label: "Lowest" },
    ];
  }, [ticketSettings]);

  const categoryLabel = (cat: any) => {
    if (!cat?.parentId) return cat?.categoryName || "";
    const parent = categories.find((c) => c.id === cat.parentId);
    return parent ? `${parent.categoryName} / ${cat.categoryName}` : cat.categoryName;
  };

  const getUserLabel = (userId?: string) => {
    if (!userId) return "N/A";
    const user = users.find((u) => u.id === userId || (u as any).userId === userId);
    if (user) return user.label || "Unknown user";
    // Never show raw UUIDs in the UI
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return "Unknown user";
    }
    return userId;
  };

  const refreshTicketList = async () => {
    try {
      let data: TicketRecord[] = [];
      if (primaryFilter === "assigned-to-me") {
        data = await fetchTicketsAssignedToMe();
      } else if (primaryFilter === "created-by-me") {
        data = await fetchTicketsCreatedByMe();
      } else {
        data = await fetchAllTickets();
      }
      setTickets(data || []);
      setLastUpdated(new Date());
      return data;
    } catch (err: any) {
      console.error("Failed to fetch tickets:", err);
      toast.error(err.message || "Failed to fetch tickets");
      setTickets([]);
      return [];
    }
  };

  const fetchTickets = () => refreshTicketList();

  const applyDateFilter = async () => {
    try {
      const start = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
      const end = endDate ? format(endDate, "yyyy-MM-dd") : undefined;
      const data = await fetchAllTickets(start, end);
      setTickets(data || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      toast.error(err.message || "Failed to apply date filter");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("total");
    setStartDate(undefined);
    setEndDate(undefined);
    fetchTickets();
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateTicketStatus(id, status as TicketRecord["status"]);
      await refreshTicketList();
      const refreshed = await fetchTicketById(id);
      setSelectedTicket(refreshed);
      toast.success("Ticket status updated");
    } catch (err: any) {
      toast.error(err.message || "Error updating status");
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !comment) return;
    try {
      await addTicketComment(selectedTicket.id, comment);
      setComment("");
      setIsCommentDialogOpen(false);
      await refreshTicketList();
      const refreshed = await fetchTicketById(selectedTicket.id);
      setSelectedTicket(refreshed);
      toast.success("Comment added");
    } catch (err: any) {
      toast.error(err.message || "Error adding comment");
    }
  };

  const handleAttachmentUpload = (file: File | null) => {
    if (!file) return;
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Attachment must be 5 MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewTicket((prev) => ({
        ...prev,
        attachments: [
          ...prev.attachments,
          { name: file.name, type: file.type, dataUrl: String(reader.result) },
        ],
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTicket = async () => {
    if (isCreating) return;
    if (!newTicket.title.trim() && newTicket.ticketType === "custom") {
      toast.error("Title is required");
      return;
    }
    if (newTicket.ticketType === "auto" && !newTicket.categoryId) {
      toast.error("Category is required for auto tickets");
      return;
    }
    if (!newTicket.storeId) {
      toast.error("Store is required");
      return;
    }

    const selectedCategory = categories.find((c) => c.id === newTicket.categoryId);
    const hasCategoryAssignee =
      newTicket.ticketType === "auto" &&
      Array.isArray(selectedCategory?.assigneeIds) &&
      selectedCategory.assigneeIds.length > 0;

    if (!newTicket.assignedTo && !hasCategoryAssignee) {
      toast.error("Please select a user to assign the ticket");
      return;
    }

    for (const tag of applicableTags) {
      if (!tag.isMandatory) continue;
      if (!newTicket.tagValues[tag.tagName]?.trim()) {
        toast.error(`Tag "${tag.tagName}" is mandatory`);
        return;
      }
    }

    if (ticketSettings?.attachmentMandatory && newTicket.attachments.length === 0) {
      toast.error("Attachment is mandatory");
      return;
    }

    try {
      setIsCreating(true);
      await createTicket({
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority as TicketRecord["priority"],
        storeId: newTicket.storeId,
        assignedTo: newTicket.assignedTo || selectedCategory?.assigneeIds?.[0],
        dueDate: newTicket.dueDate?.toISOString(),
        ticketType: newTicket.ticketType,
        categoryId: newTicket.categoryId || undefined,
        tags: Object.keys(newTicket.tagValues).length ? newTicket.tagValues : undefined,
        attachments: newTicket.attachments.length ? newTicket.attachments : undefined,
      });

      setNewTicket({
        title: "",
        description: "",
        priority: "medium",
        storeId: "",
        assignedTo: "",
        dueDate: undefined,
        ticketType: "custom",
        categoryId: "",
        tagValues: {},
        attachments: [],
      });
      setIsCreateDialogOpen(false);
      fetchTickets();
      toast.success("Ticket created");
    } catch (err: any) {
      toast.error(err.message || "Error creating ticket");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (ticketSettings?.disableTicketDelete) {
      toast.error("Ticket deletion is disabled by organization settings");
      return;
    }
    if (!confirm("Delete this ticket permanently?")) return;
    try {
      await deleteTicket(id);
      setIsDetailDialogOpen(false);
      setSelectedTicket(null);
      await refreshTicketList();
      toast.success("Ticket deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete ticket");
    }
  };

  const openCloseDialog = () => {
    setClosureAnswers({});
    if (closureQuestions.length === 0) {
      handleUpdateStatus(selectedTicket.id, "closed");
      return;
    }
    setIsCloseDialogOpen(true);
  };

  const handleCloseWithAnswers = async () => {
    if (!selectedTicket) return;
    for (const question of closureQuestions) {
      if (!question.isRequired) continue;
      if (!closureAnswers[question.id]?.trim()) {
        toast.error(`Please answer: ${question.questionText}`);
        return;
      }
    }
    try {
      setIsClosing(true);
      await updateTicketStatus(selectedTicket.id, "closed", {
        closureAnswers,
      });
      setIsCloseDialogOpen(false);
      await refreshTicketList();
      const refreshed = await fetchTicketById(selectedTicket.id);
      setSelectedTicket(refreshed);
      toast.success("Ticket closed");
    } catch (err: any) {
      toast.error(err.message || "Failed to close ticket");
    } finally {
      setIsClosing(false);
    }
  };

  const getStoreLabel = (storeId?: string) => {
    if (!storeId) return "N/A";
    const entity = entities.find((e: any) => e.id === storeId);
    return entity?.storeName || entity?.name || entity?.entityName || "N/A";
  };

  const handleExportCsv = (allFields = false) => {
    const columns = allFields ? [...ALL_EXPORT_COLUMNS] : visibleColumns.filter((c) => c !== "timeLeft" && c !== "id");
    const exportRows = sortedTickets.map((ticket) => ({
      ...ticket,
      storeId: getStoreLabel(ticket.storeId),
      assignedTo: getUserLabel(ticket.assignedTo),
    }));
    exportTicketsToCsv(exportRows as TicketRecord[], columns);
    toast.success("CSV exported");
  };

  const toggleColumn = (key: string, checked: boolean) => {
    setVisibleColumns((prev) =>
      checked ? [...prev, key] : prev.filter((col) => col !== key),
    );
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getColumnCellClass = (key: string) => {
    switch (key) {
      case "title":
      case "description":
        return "max-w-[200px] truncate";
      case "assignedTo":
      case "createdBy":
        return "max-w-[160px] truncate";
      case "storeId":
        return "max-w-[120px] truncate";
      default:
        return "";
    }
  };

  const renderCellValue = (ticket: TicketRecord, key: string) => {
    switch (key) {
      case "title":
        return <span className="font-medium">{ticket.title}</span>;
      case "description":
        return ticket.description;
      case "priority":
        return (
          <Badge
            variant={
              ticket.priority === "highest" || ticket.priority === "high"
                ? "destructive"
                : ticket.priority === "medium"
                  ? "default"
                  : "secondary"
            }
          >
            {ticket.priority}
          </Badge>
        );
      case "status":
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(ticket.status)}
            <Badge
              variant={
                ticket.status === "closed"
                  ? "default"
                  : ticket.status === "rejected"
                    ? "destructive"
                    : ticket.status === "in_progress"
                      ? "secondary"
                      : "outline"
              }
            >
              {ticket.status}
            </Badge>
          </div>
        );
      case "assignedTo":
        return getUserLabel(ticket.assignedTo);
      case "storeId":
        return getStoreLabel(ticket.storeId);
      case "dueDate":
        return ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : "N/A";
      case "timeLeft": {
        const left = getTimeLeft(ticket.dueDate || "");
        return (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span className={left === "Overdue" ? "text-red-600" : ""}>{left}</span>
          </div>
        );
      }
      case "createdBy":
        return getUserLabel(ticket.createdBy);
      default:
        return null;
    }
  };

  const getTimeLeft = (dueDate: string) => {
    if (!dueDate) return 'No due date';
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'on_hold':
        return <PauseCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredTickets = tickets.filter((ticket: TicketRecord) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      ticket.title.toLowerCase().includes(query) ||
      ticket.id.toLowerCase().includes(query) ||
      (ticket.description && ticket.description.toLowerCase().includes(query));

    let matchesStatus = true;
    if (statusFilter === "overdue") matchesStatus = isTicketOverdue(ticket);
    else if (statusFilter === "due-today") matchesStatus = isTicketDueToday(ticket);
    else if (statusFilter === "on-time") matchesStatus = isTicketOnTime(ticket);
    else if (statusFilter === "active")
      matchesStatus = !["closed", "rejected"].includes(ticket.status);
    else if (statusFilter !== "total") matchesStatus = ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (!sortField) return 0;
    const av = String((a as Record<string, unknown>)[sortField] ?? "");
    const bv = String((b as Record<string, unknown>)[sortField] ?? "");
    const cmp = av.localeCompare(bv, undefined, { numeric: true });
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const activeColumns = COLUMN_DEFS.filter((col) => visibleColumns.includes(col.key));

  const primaryFilters = [
    { label: "Assigned to me", value: "assigned-to-me" },
    { label: "Created by me", value: "created-by-me" },
    { label: "Closure Assigned", value: "closure-assigned" },
  ];

  const statusFilters = [
    { label: "Total", value: "total" },
    { label: "Open", value: "open" },
    { label: "In Progress", value: "in_progress" },
    { label: "On Hold", value: "on_hold" },
    { label: "Completed", value: "complete" },
    { label: "Closed", value: "closed" },
    { label: "Rejected", value: "rejected" },
    { label: "Overdue", value: "overdue" },
    { label: "On Time", value: "on-time" },
    { label: "Due Today", value: "due-today" },
    { label: "Active", value: "active" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ticket Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all your tickets in one place
          </p>
        </div>
      </motion.div>

      {/* Primary Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-wrap gap-2">
          {primaryFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={primaryFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPrimaryFilter(filter.value)}
              className={
                primaryFilter === filter.value
                  ? ""
                  : ""
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Search and Date Range */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col lg:flex-row gap-4 items-start lg:items-center"
      >
      {/* Search Bar */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search tickets..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

        {/* Date Range Pickers */}
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[160px] justify-start text-left font-normal border-gray-300"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-gray-500">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[160px] justify-start text-left font-normal border-gray-300"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button onClick={applyDateFilter}>Apply</Button>
          <Button variant="outline" onClick={resetFilters}>Reset</Button>
        </div>
      </motion.div>

      {/* Secondary Status Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
              className={
                statusFilter === filter.value
                  ? ""
                  : ""
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-wrap gap-3 items-center justify-between"
      >
        <div className="flex gap-3 items-center">
          <Button variant="outline" size="sm" onClick={fetchTickets}>
            Refresh
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Report Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <p className="text-sm font-medium mb-3">Visible columns</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {COLUMN_DEFS.map((col) => (
                  <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={visibleColumns.includes(col.key)}
                      onCheckedChange={(checked) => toggleColumn(col.key, checked === true)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportCsv(false)}>
                Visible columns
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportCsv(true)}>
                With all fields
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button className="flex items-center gap-2" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            New Ticket
          </Button>
          <Link href="/ticket-setup">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Ticket Setup
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Last Updated At:</span>
          <span>{lastUpdated ? lastUpdated.toLocaleString() : "-"}</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={fetchTickets}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Tickets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {sortedTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
            >
              <FileText className="w-12 h-12 text-gray-400" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="text-gray-500 text-lg"
            >
              No Tickets available. Try selecting different filters or create a new ticket.
            </motion.p>
          </div>
        ) : (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="table-fixed min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    {activeColumns.map((col) => (
                      <TableHead key={col.key} className={getColumnCellClass(col.key)}>
                        {col.sortable ? (
                          <button
                            type="button"
                            className="flex items-center gap-1 hover:text-foreground"
                            onClick={() => toggleSort(col.key)}
                          >
                            {col.label}
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        ) : (
                          col.label
                        )}
                      </TableHead>
                    ))}
                    <TableHead className="w-[90px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTickets.map((ticket: TicketRecord) => (
                    <TableRow key={ticket.id}>
                      {activeColumns.map((col) => {
                        const value = renderCellValue(ticket, col.key);
                        const cellClass = getColumnCellClass(col.key);
                        const title =
                          typeof value === "string" && cellClass.includes("truncate")
                            ? value
                            : undefined;
                        return (
                          <TableCell key={col.key} className={cellClass} title={title}>
                            {value}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <TableActionsMenu>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setIsDetailDialogOpen(true);
                            }}
                          >
                            View
                          </DropdownMenuItem>
                        </TableActionsMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>
              Create a new issue ticket to track and resolve problems.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Ticket Type</Label>
              <Select
                value={newTicket.ticketType}
                onValueChange={(value: "custom" | "auto") =>
                  setNewTicket({ ...newTicket, ticketType: value, categoryId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Ticket</SelectItem>
                  <SelectItem value="auto">Auto Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newTicket.ticketType === "auto" && (
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={newTicket.categoryId || "none"}
                  onValueChange={(value) => {
                    const categoryId = value === "none" ? "" : value;
                    const cat = categories.find((c) => c.id === categoryId);
                    let dueDate = newTicket.dueDate;
                    const daysFromNow = cat?.dueDateConfig?.daysFromNow;
                    if (typeof daysFromNow === "number") {
                      dueDate = new Date();
                      dueDate.setDate(dueDate.getDate() + daysFromNow);
                    }
                    setNewTicket({
                      ...newTicket,
                      categoryId,
                      title: cat?.categoryName || newTicket.title,
                      priority: cat?.priority || newTicket.priority,
                      assignedTo: cat?.assigneeIds?.[0] || newTicket.assignedTo,
                      dueDate,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {categoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter ticket title"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter ticket description"
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {!ticketSettings?.hidePriorities && (
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) => {
                      const level = enabledPriorities.find((p: any) => p.key === value);
                      let dueDate = newTicket.dueDate;
                      if (
                        !dueDate &&
                        level &&
                        typeof level.defaultDueDays === "number"
                      ) {
                        dueDate = new Date();
                        dueDate.setDate(dueDate.getDate() + level.defaultDueDays);
                      }
                      setNewTicket({ ...newTicket, priority: value, dueDate });
                    }}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {enabledPriorities.map((level: any) => (
                        <SelectItem key={level.key} value={level.key}>
                          {level.label || level.key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="storeId">Store *</Label>
                <Select
                  value={newTicket.storeId || "none"}
                  onValueChange={(value) =>
                    setNewTicket({ ...newTicket, storeId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger id="storeId">
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select store</SelectItem>
                    {entities.map((entity: any) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {humanLabel(entity.storeName, entity.name, "Unnamed store")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assignedTo">
                  Assigned To
                  {newTicket.ticketType === "auto" ? " (optional if category has assignees)" : " *"}
                </Label>
                <Select
                  value={newTicket.assignedTo || "none"}
                  onValueChange={(value) =>
                    setNewTicket({ ...newTicket, assignedTo: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select user</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTicket.dueDate ? format(newTicket.dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newTicket.dueDate}
                      onSelect={(date) => setNewTicket({ ...newTicket, dueDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {applicableTags.map((tag) => (
              <div key={tag.id} className="grid gap-2">
                <Label>
                  {tag.tagName}
                  {tag.isMandatory ? " *" : ""}
                </Label>
                {(tag.tagValues?.length ?? 0) > 0 ? (
                  <Select
                    value={newTicket.tagValues[tag.tagName] || "none"}
                    onValueChange={(value) =>
                      setNewTicket({
                        ...newTicket,
                        tagValues: {
                          ...newTicket.tagValues,
                          [tag.tagName]: value === "none" ? "" : value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${tag.tagName}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select value</SelectItem>
                      {tag.tagValues.map((val: string) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={newTicket.tagValues[tag.tagName] || ""}
                    onChange={(e) =>
                      setNewTicket({
                        ...newTicket,
                        tagValues: { ...newTicket.tagValues, [tag.tagName]: e.target.value },
                      })
                    }
                  />
                )}
              </div>
            ))}

            <div className="grid gap-2">
              <Label>Attachments {ticketSettings?.attachmentMandatory ? "*" : ""}</Label>
              <Input
                type="file"
                accept="image/*,video/*,.pdf"
                onChange={(e) => handleAttachmentUpload(e.target.files?.[0] || null)}
              />
              {newTicket.attachments.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {newTicket.attachments.length} file(s) attached
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>
              View and manage ticket details.
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <div className="text-sm mt-1 font-medium">{selectedTicket.title}</div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <div className="mt-1">
                    <Badge
                      variant={selectedTicket.priority === 'highest' || selectedTicket.priority === 'high' ? 'destructive' : selectedTicket.priority === 'medium' ? 'default' : 'secondary'}
                    >
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedTicket.status === 'closed' ? 'default' :
                        selectedTicket.status === 'rejected' ? 'destructive' :
                        selectedTicket.status === 'in_progress' ? 'secondary' : 'outline'
                      }
                    >
                      {selectedTicket.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <div className="text-sm mt-1">
                    {selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <div className="text-sm mt-1">{getUserLabel(selectedTicket.assignedTo)}</div>
                </div>
                <div>
                  <Label>Created By</Label>
                  <div className="text-sm mt-1">{getUserLabel(selectedTicket.createdBy)}</div>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <div className="text-sm mt-1 p-3 border rounded-lg bg-muted">
                  {selectedTicket.description || 'No description'}
                </div>
              </div>

              {Array.isArray(selectedTicket.attachments) && selectedTicket.attachments.length > 0 && (
                <div>
                  <Label>Attachments</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTicket.attachments.map((att: any, index: number) => (
                      <a
                        key={index}
                        href={att.dataUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline"
                      >
                        {att.name || `Attachment ${index + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedTicket.tags && (
                Array.isArray(selectedTicket.tags)
                  ? selectedTicket.tags.length > 0
                  : Object.keys(selectedTicket.tags).length > 0
              ) && (
                <div>
                  <Label>Tags</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.isArray(selectedTicket.tags)
                      ? selectedTicket.tags.map((tag: any, index: number) => (
                          <Badge key={tag.id || index} variant="outline">
                            {tag.name || tag.tagName}: {String(tag.value ?? "")}
                          </Badge>
                        ))
                      : Object.entries(selectedTicket.tags).map(([key, value]) => (
                          <Badge key={key} variant="outline">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                  </div>
                </div>
              )}

              {selectedTicket.closureAnswers &&
                Object.keys(selectedTicket.closureAnswers).filter(
                  (key) => !key.startsWith("_"),
                ).length > 0 && (
                  <div>
                    <Label>Closure Answers</Label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(selectedTicket.closureAnswers)
                        .filter(([key]) => !key.startsWith("_"))
                        .map(([key, value]) => {
                          const question = closureQuestions.find((q) => q.id === key);
                          return (
                            <div key={key} className="border rounded p-2 text-sm">
                              <div className="font-medium">
                                {question?.questionText || key}
                              </div>
                              <div className="text-muted-foreground">{String(value)}</div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

              {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                <div>
                  <Label>Comments</Label>
                  <div className="mt-2 space-y-2">
                    {selectedTicket.comments.map((comment: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <div className="text-sm font-medium">{getUserLabel(comment.userId)}</div>
                        <div className="text-sm text-muted-foreground">{comment.text}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(true)}>
              Add Comment
            </Button>
            {selectedTicket?.status === 'open' && (
              <>
                <Button variant="outline" onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}>
                  Start Progress
                </Button>
                <Button onClick={() => handleUpdateStatus(selectedTicket.id, 'complete')}>
                  Mark Complete
                </Button>
              </>
            )}
            {selectedTicket?.status === 'in_progress' && (
              <>
                <Button variant="outline" onClick={() => handleUpdateStatus(selectedTicket.id, 'on_hold')}>
                  Put on Hold
                </Button>
                <Button onClick={() => handleUpdateStatus(selectedTicket.id, 'complete')}>
                  Mark Complete
                </Button>
              </>
            )}
            {selectedTicket?.status === 'complete' && (
              <Button onClick={openCloseDialog}>
                Close Ticket
              </Button>
            )}
            {!ticketSettings?.disableTicketDelete && (
              <Button
                variant="destructive"
                onClick={() => handleDeleteTicket(selectedTicket.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Ticket</DialogTitle>
            <DialogDescription>
              Answer the configured closure questions before closing this ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {closureQuestions.map((question) => (
              <div key={question.id} className="grid gap-2">
                <Label>
                  {question.questionText}
                  {question.isRequired ? " *" : ""}
                </Label>
                {question.questionType === "yes_no" ? (
                  <Select
                    value={closureAnswers[question.id] || "none"}
                    onValueChange={(value) =>
                      setClosureAnswers({
                        ...closureAnswers,
                        [question.id]: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                ) : question.questionType === "dropdown" ? (
                  <Select
                    value={closureAnswers[question.id] || "none"}
                    onValueChange={(value) =>
                      setClosureAnswers({
                        ...closureAnswers,
                        [question.id]: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select</SelectItem>
                      {(question.options || []).map((opt: string) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Textarea
                    value={closureAnswers[question.id] || ""}
                    onChange={(e) =>
                      setClosureAnswers({
                        ...closureAnswers,
                        [question.id]: e.target.value,
                      })
                    }
                    rows={3}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)} disabled={isClosing}>
              Cancel
            </Button>
            <Button onClick={handleCloseWithAnswers} disabled={isClosing}>
              {isClosing ? "Closing..." : "Confirm Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Add a comment to this ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                placeholder="Enter your comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComment}>
              Add Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
