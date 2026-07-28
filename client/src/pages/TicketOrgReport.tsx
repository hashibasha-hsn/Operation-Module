import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Download,
  Search,
  Ticket,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  FolderTree,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type DateFilter,
  exportRowsToCsv,
  fetchEntities,
  fetchTicketOrgReport,
} from "@/lib/reportApi";
import { fetchUsers } from "@/lib/processApi";
import { buildStoreNameMap, buildUserNameMap, humanLabel } from "@/lib/displayLabels";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type ViewTab = "list" | "resolution" | "category" | "performance";

const CHART_COLORS = ["#2563eb", "#0d9488", "#f59e0b", "#ef4444"];

function rateClass(value: number) {
  if (value >= 80) return "text-emerald-700 bg-emerald-50";
  if (value >= 60) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

export default function TicketOrgReport() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [viewTab, setViewTab] = useState<ViewTab>("list");
  const [perfMode, setPerfMode] = useState<"assignee" | "vendor">("assignee");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEntities()
      .then((entities) => setStoreNames(buildStoreNameMap(entities || [])))
      .catch(() => setStoreNames({}));
    fetchUsers(1000)
      .then((users) => setUserNames(buildUserNameMap(users || [])))
      .catch(() => setUserNames({}));
  }, []);

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter, assigneeFilter, vendorFilter, categoryFilter, storeFilter, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchTicketOrgReport({
        dateFilter,
        status: statusFilter,
        priority: priorityFilter,
        storeId: storeFilter,
        assignedTo: assigneeFilter,
        categoryId: categoryFilter,
        vendor: vendorFilter,
        search: searchTerm || undefined,
      });
      setData(result);
    } catch (error) {
      console.error("Error fetching ticket org report:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const storeLabel = (id?: string) => (id ? humanLabel(storeNames[id], "Unnamed store") : "—");
  const userLabel = (id?: string) => (id ? humanLabel(userNames[id], "Unknown user") : "—");
  const vendorLabel = (id?: string) => (id ? humanLabel(id, "—") : "—");

  const tickets = useMemo(() => {
    const rows = Array.isArray(data?.tickets) ? data.tickets : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((tk: any) =>
      [tk.title, tk.description, userLabel(tk.assignedTo), tk.vendor, tk.categoryName, tk.status, tk.priority, storeLabel(tk.storeId)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, searchTerm, storeNames, userNames]);

  const byAssignee = Array.isArray(data?.byAssignee) ? data.byAssignee : [];
  const byVendor = Array.isArray(data?.byVendor) ? data.byVendor : [];
  const byCategory = Array.isArray(data?.byCategory) ? data.byCategory : [];
  const trends = Array.isArray(data?.trends) ? data.trends : [];
  const resolutionBuckets = Array.isArray(data?.resolutionBuckets) ? data.resolutionBuckets : [];
  const categories = Array.isArray(data?.categories) ? data.categories : [];
  const kpis = data?.kpis || {
    total: 0,
    open: 0,
    inProgress: 0,
    overdue: 0,
    resolved: 0,
    resolutionRate: 0,
    overdueRate: 0,
    avgCycleHours: 0,
    medianCycleHours: 0,
    dueToday: 0,
  };
  const statusCounts = data?.statusCounts || {};

  const assigneeOptions = useMemo(() => {
    const ids = new Set<string>();
    byAssignee.forEach((a: any) => a.assignee && ids.add(a.assignee));
    tickets.forEach((tk: any) => tk.assignedTo && ids.add(tk.assignedTo));
    return Array.from(ids).sort();
  }, [byAssignee, tickets]);

  const vendorOptions = useMemo(() => {
    const ids = new Set<string>();
    byVendor.forEach((v: any) => v.vendor && ids.add(v.vendor));
    tickets.forEach((tk: any) => tk.vendor && ids.add(tk.vendor));
    return Array.from(ids).sort();
  }, [byVendor, tickets]);

  const storeOptions = useMemo(() => {
    const ids = new Set<string>();
    tickets.forEach((tk: any) => tk.storeId && ids.add(tk.storeId));
    Object.keys(storeNames).forEach((id) => ids.add(id));
    return Array.from(ids).sort((a, b) => storeLabel(a).localeCompare(storeLabel(b)));
  }, [tickets, storeNames]);

  const statusChips = [
    { key: "all", label: "Total", countKey: "total" },
    { key: "open", label: "Open", countKey: "open" },
    { key: "inProgress", label: "In Progress", countKey: "inProgress" },
    { key: "on_hold", label: "On Hold", countKey: "onHold" },
    { key: "complete", label: "Complete", countKey: "complete" },
    { key: "closed", label: "Closed", countKey: "closed" },
    { key: "overdue", label: "Overdue", countKey: "overdue" },
    { key: "dueToday", label: "Due Today", countKey: "dueToday" },
    { key: "onTime", label: "On Time", countKey: "onTime" },
    { key: "rejected", label: "Rejected", countKey: "rejected" },
  ];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      on_hold: "bg-orange-100 text-orange-800",
      complete: "bg-emerald-100 text-emerald-800",
      closed: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {String(status || "").replace(/_/g, " ")}
      </span>
    );
  };

  const perfRows = perfMode === "vendor" ? byVendor : byAssignee;

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (viewTab === "performance") {
      exportRowsToCsv(
        `ticket-${perfMode}-performance-${stamp}.csv`,
        [
          perfMode === "vendor" ? "Vendor" : "Assignee",
          "Total",
          "Open",
          "In Progress",
          "Complete",
          "Closed",
          "Overdue",
          "Resolution %",
          "Overdue %",
          "Avg Cycle Hours",
        ],
        perfRows.map((r: any) => [
          perfMode === "vendor" ? vendorLabel(r.vendor) : userLabel(r.assignee),
          String(r.total),
          String(r.open),
          String(r.inProgress),
          String(r.complete),
          String(r.closed),
          String(r.overdue),
          String(r.resolutionRate),
          String(r.overdueRate),
          String(r.avgCycleHours),
        ]),
      );
      return;
    }
    if (viewTab === "category") {
      exportRowsToCsv(
        `ticket-category-${stamp}.csv`,
        ["Category", "Total", "Open", "In Progress", "Complete", "Closed", "Overdue", "Resolution %", "Avg Cycle Hours"],
        byCategory.map((r: any) => [
          r.category,
          String(r.total),
          String(r.open),
          String(r.inProgress),
          String(r.complete),
          String(r.closed),
          String(r.overdue),
          String(r.resolutionRate),
          String(r.avgCycleHours),
        ]),
      );
      return;
    }
    if (viewTab === "resolution") {
      exportRowsToCsv(
        `ticket-resolution-${stamp}.csv`,
        ["Bucket", "Count"],
        resolutionBuckets.map((r: any) => [r.bucket, String(r.count)]),
      );
      return;
    }
    exportRowsToCsv(
      `ticket-status-${stamp}.csv`,
      ["Title", "Status", "Priority", "Assignee", "Vendor", "Category", "Store", "Due Date", "Overdue", "Cycle Hours", "Created At", "Completed At"],
      tickets.map((tk: any) => [
        tk.title,
        tk.status,
        tk.priority,
        userLabel(tk.assignedTo),
        vendorLabel(tk.vendor),
        tk.categoryName,
        storeLabel(tk.storeId),
        tk.dueDate ? new Date(tk.dueDate).toISOString() : "",
        tk.isOverdue ? "Yes" : "No",
        tk.cycleHours != null ? String(tk.cycleHours) : "",
        tk.createdAt ? new Date(tk.createdAt).toISOString() : "",
        tk.completedAt ? new Date(tk.completedAt).toISOString() : "",
      ]),
    );
  };

  const tabs: { key: ViewTab; label: string; icon: typeof Ticket }[] = [
    { key: "list", label: "Status Tracking", icon: Ticket },
    { key: "resolution", label: "Resolution Time", icon: Clock },
    { key: "category", label: "Category Analysis", icon: FolderTree },
    { key: "performance", label: "Vendor / Assignee", icon: Users },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/reporting">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              {t("reportingAndInsights")}
            </Button>
          </Link>
          <div className="p-2 rounded-lg bg-blue-50">
            <Ticket className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("ticketReports")}</h1>
            <p className="text-sm text-muted-foreground">{t("ticketReportsDesc")}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={loading}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Total", value: kpis.total, icon: Activity },
          { label: "Open", value: kpis.open, icon: Ticket },
          { label: "In Progress", value: kpis.inProgress, icon: Clock },
          { label: "Overdue", value: kpis.overdue, icon: AlertTriangle },
          { label: "Due Today", value: kpis.dueToday, icon: Clock },
          { label: "Resolved", value: kpis.resolved, icon: CheckCircle2 },
          { label: "Resolution", value: `${kpis.resolutionRate}%`, icon: TrendingUp },
          { label: "Avg Cycle (h)", value: kpis.avgCycleHours, icon: Clock },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3">
              <kpi.icon className="w-4 h-4 text-blue-600 mb-2" />
              <div className="text-xl font-bold">{kpi.value}</div>
              <div className="text-xs text-muted-foreground">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {statusChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  statusFilter === chip.key
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                {chip.label}
                <span className="ml-2 font-bold">
                  {statusCounts[chip.countKey as keyof typeof statusCounts] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Search title, assignee, vendor, category, id..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchData()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="highest">Highest</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="lowest">Lowest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Assignee</label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {assigneeOptions.map((id) => (
                    <SelectItem key={id} value={id}>
                      {userLabel(id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Vendor</label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendorOptions.map((id) => (
                    <SelectItem key={id} value={id}>
                      {vendorLabel(id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Store</label>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {storeOptions.map((id) => (
                    <SelectItem key={id} value={id}>
                      {storeLabel(id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchData}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={viewTab === key ? "default" : "ghost"}
            className="gap-2 rounded-b-none"
            onClick={() => setViewTab(key)}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">Loading...</div>
      ) : viewTab === "resolution" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Avg Cycle (h)", value: kpis.avgCycleHours },
              { label: "Median Cycle (h)", value: kpis.medianCycleHours },
              { label: "Resolution Rate", value: `${kpis.resolutionRate}%` },
              { label: "Resolved Tickets", value: kpis.resolved },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-4 pb-3">
                  <div className="text-xl font-bold">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resolution Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {resolutionBuckets.every((b: any) => !b.count) ? (
                  <p className="text-sm text-muted-foreground h-64 flex items-center justify-center">
                    No resolved tickets yet
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={resolutionBuckets}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Created / Completed / Closed Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {trends.length === 0 ? (
                  <p className="text-sm text-muted-foreground h-64 flex items-center justify-center">No trend data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="created" stroke={CHART_COLORS[0]} strokeWidth={2} />
                      <Line type="monotone" dataKey="completed" stroke={CHART_COLORS[1]} strokeWidth={2} />
                      <Line type="monotone" dataKey="closed" stroke={CHART_COLORS[2]} strokeWidth={2} />
                      <Line type="monotone" dataKey="overdue" stroke={CHART_COLORS[3]} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : viewTab === "category" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tickets by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground h-64 flex items-center justify-center">No category data</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Category Breakdown</span>
                <Badge variant="outline">{byCategory.length} categories</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {byCategory.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No category data</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Open</TableHead>
                        <TableHead>Overdue</TableHead>
                        <TableHead>Resolution</TableHead>
                        <TableHead>Avg Cycle (h)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byCategory.map((row: any) => (
                        <TableRow key={row.category}>
                          <TableCell className="font-medium">{row.category}</TableCell>
                          <TableCell>{row.total}</TableCell>
                          <TableCell>{row.open}</TableCell>
                          <TableCell className={row.overdue > 0 ? "text-red-600 font-semibold" : ""}>
                            {row.overdue}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={rateClass(row.resolutionRate)}>
                              {row.resolutionRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>{row.avgCycleHours}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : viewTab === "performance" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-3">
              <span>Vendor / Assignee Performance</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={perfMode === "assignee" ? "default" : "outline"}
                  onClick={() => setPerfMode("assignee")}
                >
                  Assignees
                </Button>
                <Button
                  size="sm"
                  variant={perfMode === "vendor" ? "default" : "outline"}
                  onClick={() => setPerfMode("vendor")}
                >
                  Vendors
                </Button>
                <Badge variant="outline">{perfRows.length}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {perfRows.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No performance data</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{perfMode === "vendor" ? "Vendor" : "Assignee"}</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Open</TableHead>
                      <TableHead>In Progress</TableHead>
                      <TableHead>Complete</TableHead>
                      <TableHead>Overdue</TableHead>
                      <TableHead>Resolution</TableHead>
                      <TableHead>Overdue Rate</TableHead>
                      <TableHead>Avg Cycle (h)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perfRows.map((row: any) => {
                      const rawId = row.vendor || row.assignee;
                      const name =
                        perfMode === "vendor" ? vendorLabel(row.vendor) : userLabel(row.assignee);
                      return (
                        <TableRow
                          key={rawId}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => {
                            if (perfMode === "vendor") setVendorFilter(row.vendor);
                            else setAssigneeFilter(row.assignee);
                            setViewTab("list");
                          }}
                        >
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell>{row.total}</TableCell>
                          <TableCell>{row.open}</TableCell>
                          <TableCell>{row.inProgress}</TableCell>
                          <TableCell>{row.complete}</TableCell>
                          <TableCell className={row.overdue > 0 ? "text-red-600 font-semibold" : ""}>
                            {row.overdue}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={rateClass(row.resolutionRate)}>
                              {row.resolutionRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={rateClass(100 - row.overdueRate)}>
                              {row.overdueRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>{row.avgCycleHours}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ticket Status Tracking</span>
              <Badge variant="outline">{tickets.length} records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No tickets found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Cycle (h)</TableHead>
                      <TableHead>Flag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((tk: any) => (
                      <TableRow key={tk.id}>
                        <TableCell className="font-medium max-w-[220px] truncate" title={tk.title}>
                          {tk.title}
                        </TableCell>
                        <TableCell>{getStatusBadge(tk.status)}</TableCell>
                        <TableCell className="capitalize">{tk.priority || "—"}</TableCell>
                        <TableCell>{userLabel(tk.assignedTo)}</TableCell>
                        <TableCell>{vendorLabel(tk.vendor)}</TableCell>
                        <TableCell>{tk.categoryName || "—"}</TableCell>
                        <TableCell>{storeLabel(tk.storeId)}</TableCell>
                        <TableCell>
                          {tk.dueDate ? new Date(tk.dueDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>{tk.cycleHours != null ? tk.cycleHours : "—"}</TableCell>
                        <TableCell>
                          {tk.isOverdue ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : tk.isDueToday ? (
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Due Today</Badge>
                          ) : tk.isOnTime ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">On Time</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
