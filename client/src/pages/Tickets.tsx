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
import { useLanguage } from "@/contexts/LanguageContext";

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

export default function Tickets() {
  const { t } = useLanguage();

  const COLUMN_DEFS: { key: string; label: string; sortable?: boolean }[] = useMemo(() => [
    { key: "title", label: t('title'), sortable: true },
    { key: "description", label: t('description') },
    { key: "priority", label: t('priority'), sortable: true },
    { key: "status", label: t('status'), sortable: true },
    { key: "assignedTo", label: t('assignedTo'), sortable: true },
    { key: "storeId", label: t('store'), sortable: true },
    { key: "dueDate", label: t('dueDate'), sortable: true },
    { key: "timeLeft", label: t('timeLeft') },
    { key: "createdBy", label: t('createdBy'), sortable: true },
  ], [t]);

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
      { key: "highest", label: t('highest') },
      { key: "high", label: t('high') },
      { key: "medium", label: t('medium') },
      { key: "low", label: t('low') },
      { key: "lowest", label: t('lowest') },
    ];
  }, [ticketSettings, t]);

  const categoryLabel = (cat: any) => {
    if (!cat?.parentId) return cat?.categoryName || "";
    const parent = categories.find((c) => c.id === cat.parentId);
    return parent ? `${parent.categoryName} / ${cat.categoryName}` : cat.categoryName;
  };

  const getUserLabel = (userId?: string) => {
    if (!userId) return t('notAvailable');
    const user = users.find((u) => u.id === userId || (u as any).userId === userId);
    if (user) return user.label || t('unknownUser');
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return t('unknownUser');
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
      toast.error(err.message || t('failedToFetchTickets'));
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
      toast.error(err.message || t('failedToApplyDateFilter'));
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
      toast.success(t('ticketStatusUpdated'));
    } catch (err: any) {
      toast.error(err.message || t('errorUpdatingStatus'));
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
      toast.success(t('commentAdded'));
    } catch (err: any) {
      toast.error(err.message || t('errorAddingComment'));
    }
  };

  const handleAttachmentUpload = (file: File | null) => {
    if (!file) return;
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(t('attachmentTooLarge'));
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
      toast.error(t('titleRequiredError'));
      return;
    }
    if (newTicket.ticketType === "auto" && !newTicket.categoryId) {
      toast.error(t('categoryRequiredForAuto'));
      return;
    }
    if (!newTicket.storeId) {
      toast.error(t('storeRequiredError'));
      return;
    }

    const selectedCategory = categories.find((c) => c.id === newTicket.categoryId);
    const hasCategoryAssignee =
      newTicket.ticketType === "auto" &&
      Array.isArray(selectedCategory?.assigneeIds) &&
      selectedCategory.assigneeIds.length > 0;

    if (!newTicket.assignedTo && !hasCategoryAssignee) {
      toast.error(t('assigneeRequired'));
      return;
    }

    for (const tag of applicableTags) {
      if (!tag.isMandatory) continue;
      if (!newTicket.tagValues[tag.tagName]?.trim()) {
        toast.error(`${t('tagMandatory')} "${tag.tagName}"`);
        return;
      }
    }

    if (ticketSettings?.attachmentMandatory && newTicket.attachments.length === 0) {
      toast.error(t('attachmentMandatoryError'));
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
      toast.success(t('ticketCreated'));
    } catch (err: any) {
      toast.error(err.message || t('errorCreatingTicket'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (ticketSettings?.disableTicketDelete) {
      toast.error(t('deletionDisabled'));
      return;
    }
    if (!confirm(t('confirmDeleteTicket'))) return;
    try {
      await deleteTicket(id);
      setIsDetailDialogOpen(false);
      setSelectedTicket(null);
      await refreshTicketList();
      toast.success(t('ticketDeleted'));
    } catch (err: any) {
      toast.error(err.message || t('failedToDeleteTicket'));
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
        toast.error(`${t('pleaseAnswer')}: ${question.questionText}`);
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
      toast.success(t('ticketClosed'));
    } catch (err: any) {
      toast.error(err.message || t('failedToCloseTicket'));
    } finally {
      setIsClosing(false);
    }
  };

  const getStoreLabel = (storeId?: string) => {
    if (!storeId) return t('notAvailable');
    const entity = entities.find((e: any) => e.id === storeId);
    return entity?.storeName || entity?.name || entity?.entityName || t('notAvailable');
  };

  const handleExportCsv = (allFields = false) => {
    const columns = allFields ? [...ALL_EXPORT_COLUMNS] : visibleColumns.filter((c) => c !== "timeLeft" && c !== "id");
    const exportRows = sortedTickets.map((ticket) => ({
      ...ticket,
      storeId: getStoreLabel(ticket.storeId),
      assignedTo: getUserLabel(ticket.assignedTo),
    }));
    exportTicketsToCsv(exportRows as TicketRecord[], columns);
    toast.success(t('csvExported'));
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
        return ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : t('notAvailable');
      case "timeLeft": {
        const left = getTimeLeft(ticket.dueDate || "");
        const isOverdue = ticket.dueDate && new Date(ticket.dueDate).getTime() < Date.now();
        return (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span className={isOverdue ? "text-red-600" : ""}>{left}</span>
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
    if (!dueDate) return t('noDueDate');
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diff < 0) return t('overdue');
    if (days === 0) return t('today');
    if (days === 1) return t('oneDay');
    return `${days} ${t('days')}`;
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
    { label: t('assignedToMe'), value: "assigned-to-me" },
    { label: t('createdByMe'), value: "created-by-me" },
    { label: t('closureAssigned'), value: "closure-assigned" },
  ];

  const statusFilters = [
    { label: t('total'), value: "total" },
    { label: t('open'), value: "open" },
    { label: t('inProgress'), value: "in_progress" },
    { label: t('onHold'), value: "on_hold" },
    { label: t('completed'), value: "complete" },
    { label: t('closed'), value: "closed" },
    { label: t('rejected'), value: "rejected" },
    { label: t('overdue'), value: "overdue" },
    { label: t('onTime'), value: "on-time" },
    { label: t('dueToday'), value: "due-today" },
    { label: t('active'), value: "active" },
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
          <h1 className="text-3xl font-bold text-gray-900">{t('ticketDashboard')}</h1>
          <p className="text-gray-600 mt-1">
            {t('ticketDashboardDesc')}
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
          placeholder={t('searchTickets')}
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
                {startDate ? format(startDate, "PPP") : t('startDate')}
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

          <span className="text-gray-500">{t('to')}</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[160px] justify-start text-left font-normal border-gray-300"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : t('endDate')}
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

          <Button onClick={applyDateFilter}>{t('apply')}</Button>
          <Button variant="outline" onClick={resetFilters}>{t('reset')}</Button>
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
            {t('refresh')}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {t('reportSettings')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <p className="text-sm font-medium mb-3">{t('visibleColumns')}</p>
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
                {t('exportCsv')}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportCsv(false)}>
                {t('visibleColumns')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportCsv(true)}>
                {t('withAllFields')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button className="flex items-center gap-2" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            {t('newTicket')}
          </Button>
          <Link href="/ticket-setup">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t('ticketSetup')}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{t('lastUpdatedAt')}</span>
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
              {t('noTicketsAvailable')}
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
                    <TableHead className="w-[90px]">{t('actions')}</TableHead>
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
                            {t('view')}
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
            <DialogTitle>{t('createNewTicket')}</DialogTitle>
            <DialogDescription>
              {t('createTicketDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('ticketType')}</Label>
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
                  <SelectItem value="custom">{t('customTicket')}</SelectItem>
                  <SelectItem value="auto">{t('autoTicket')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newTicket.ticketType === "auto" && (
              <div className="grid gap-2">
                <Label>{t('category')}</Label>
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
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('selectCategory')}</SelectItem>
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
              <Label htmlFor="title">{t('titleRequired')}</Label>
              <Input
                id="title"
                placeholder={t('enterTicketTitle')}
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                placeholder={t('enterTicketDescription')}
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {!ticketSettings?.hidePriorities && (
                <div className="grid gap-2">
                  <Label htmlFor="priority">{t('priority')}</Label>
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
                <Label htmlFor="storeId">{t('storeRequired')}</Label>
                <Select
                  value={newTicket.storeId || "none"}
                  onValueChange={(value) =>
                    setNewTicket({ ...newTicket, storeId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger id="storeId">
                    <SelectValue placeholder={t('selectStore')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('selectStore')}</SelectItem>
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
                  {t('assignedTo')}
                  {newTicket.ticketType === "auto" ? t('optionalIfCategoryHasAssignees') : " " + t('required')}
                </Label>
                <Select
                  value={newTicket.assignedTo || "none"}
                  onValueChange={(value) =>
                    setNewTicket({ ...newTicket, assignedTo: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder={t('selectUser')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('selectUser')}</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('dueDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTicket.dueDate ? format(newTicket.dueDate, "PPP") : t('pickADate')}
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
                  {tag.isMandatory ? " " + t('required') : ""}
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
                      <SelectItem value="none">{t('selectValue')}</SelectItem>
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
              <Label>{t('attachments')} {ticketSettings?.attachmentMandatory ? t('required') : ""}</Label>
              <Input
                type="file"
                accept="image/*,video/*,.pdf"
                onChange={(e) => handleAttachmentUpload(e.target.files?.[0] || null)}
              />
              {newTicket.attachments.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {newTicket.attachments.length} {t('filesAttached')}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreateTicket} disabled={isCreating}>
              {isCreating ? t('creating') : t('createTicket')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('ticketDetails')}</DialogTitle>
            <DialogDescription>
              {t('ticketDetailsDesc')}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('title')}</Label>
                  <div className="text-sm mt-1 font-medium">{selectedTicket.title}</div>
                </div>
                <div>
                  <Label>{t('priority')}</Label>
                  <div className="mt-1">
                    <Badge
                      variant={selectedTicket.priority === 'highest' || selectedTicket.priority === 'high' ? 'destructive' : selectedTicket.priority === 'medium' ? 'default' : 'secondary'}
                    >
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>{t('status')}</Label>
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
                  <Label>{t('dueDate')}</Label>
                  <div className="text-sm mt-1">
                    {selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleString() : t('notAvailable')}
                  </div>
                </div>
                <div>
                  <Label>{t('assignedTo')}</Label>
                  <div className="text-sm mt-1">{getUserLabel(selectedTicket.assignedTo)}</div>
                </div>
                <div>
                  <Label>{t('createdBy')}</Label>
                  <div className="text-sm mt-1">{getUserLabel(selectedTicket.createdBy)}</div>
                </div>
              </div>

              <div>
                <Label>{t('description')}</Label>
                <div className="text-sm mt-1 p-3 border rounded-lg bg-muted">
                  {selectedTicket.description || t('noDescription')}
                </div>
              </div>

              {Array.isArray(selectedTicket.attachments) && selectedTicket.attachments.length > 0 && (
                <div>
                  <Label>{t('attachments')}</Label>
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
                  <Label>{t('tags')}</Label>
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
                    <Label>{t('closureAnswers')}</Label>
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
                  <Label>{t('comments')}</Label>
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
              {t('addComment')}
            </Button>
            {selectedTicket?.status === 'open' && (
              <>
                <Button variant="outline" onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}>
                  {t('startProgress')}
                </Button>
                <Button onClick={() => handleUpdateStatus(selectedTicket.id, 'complete')}>
                  {t('markComplete')}
                </Button>
              </>
            )}
            {selectedTicket?.status === 'in_progress' && (
              <>
                <Button variant="outline" onClick={() => handleUpdateStatus(selectedTicket.id, 'on_hold')}>
                  {t('putOnHold')}
                </Button>
                <Button onClick={() => handleUpdateStatus(selectedTicket.id, 'complete')}>
                  {t('markComplete')}
                </Button>
              </>
            )}
            {selectedTicket?.status === 'complete' && (
              <Button onClick={openCloseDialog}>
                {t('closeTicket')}
              </Button>
            )}
            {!ticketSettings?.disableTicketDelete && (
              <Button
                variant="destructive"
                onClick={() => handleDeleteTicket(selectedTicket.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {t('delete')}
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('closeTicketTitle')}</DialogTitle>
            <DialogDescription>
              {t('closeTicketDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {closureQuestions.map((question) => (
              <div key={question.id} className="grid gap-2">
                <Label>
                  {question.questionText}
                  {question.isRequired ? " " + t('required') : ""}
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
                      <SelectValue placeholder={t('select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('select')}</SelectItem>
                      <SelectItem value="Yes">{t('yes')}</SelectItem>
                      <SelectItem value="No">{t('no')}</SelectItem>
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
                      <SelectValue placeholder={t('select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('select')}</SelectItem>
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
              {t('cancel')}
            </Button>
            <Button onClick={handleCloseWithAnswers} disabled={isClosing}>
              {isClosing ? t('closing') : t('confirmClose')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addComment')}</DialogTitle>
            <DialogDescription>
              {t('addCommentDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comment">{t('comment')}</Label>
              <Textarea
                id="comment"
                placeholder={t('enterYourComment')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleAddComment}>
              {t('addComment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
