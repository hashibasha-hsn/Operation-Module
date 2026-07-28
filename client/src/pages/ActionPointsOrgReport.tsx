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
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  ListTodo,
  Activity,
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type DateFilter,
  exportRowsToCsv,
  fetchActionPointsOrgReport,
  fetchEntities,
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

type ViewTab = "list" | "assignee" | "trends" | "overdue";

const CHART_COLORS = ["#0d9488", "#2563eb", "#f59e0b", "#ef4444"];

function rateClass(value: number) {
  if (value >= 80) return "text-emerald-700 bg-emerald-50";
  if (value >= 60) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

export default function ActionPointsOrgReport() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [viewTab, setViewTab] = useState<ViewTab>("list");
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
  }, [statusFilter, priorityFilter, assigneeFilter, storeFilter, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchActionPointsOrgReport({
        dateFilter,
        status: statusFilter,
        priority: priorityFilter,
        storeId: storeFilter,
        assignedTo: assigneeFilter,
        search: searchTerm || undefined,
      });
      setData(result);
    } catch (error) {
      console.error("Error fetching action points report:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const storeLabel = (id?: string) => (id ? humanLabel(storeNames[id], "Unnamed store") : "—");
  const userLabel = (id?: string) => (id ? humanLabel(userNames[id], "Unknown user") : "—");

  const actionPoints = useMemo(() => {
    const rows = Array.isArray(data?.actionPoints) ? data.actionPoints : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((ap: any) =>
      [ap.title, ap.description, userLabel(ap.assignedTo), ap.status, ap.priority, storeLabel(ap.storeId)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, searchTerm, storeNames, userNames]);

  const overdueRows = useMemo(
    () => actionPoints.filter((ap: any) => ap.isOverdue),
    [actionPoints],
  );

  const byAssignee = Array.isArray(data?.byAssignee) ? data.byAssignee : [];
  const trends = Array.isArray(data?.trends) ? data.trends : [];
  const kpis = data?.kpis || {
    total: 0,
    open: 0,
    inProgress: 0,
    overdue: 0,
    resolved: 0,
    resolutionRate: 0,
    overdueRate: 0,
    avgCycleHours: 0,
    dueToday: 0,
  };
  const statusCounts = data?.statusCounts || {};

  const assigneeOptions = useMemo(() => {
    const ids = new Set<string>();
    byAssignee.forEach((a: any) => a.assignee && ids.add(a.assignee));
    actionPoints.forEach((ap: any) => ap.assignedTo && ids.add(ap.assignedTo));
    return Array.from(ids).sort();
  }, [byAssignee, actionPoints]);

  const storeOptions = useMemo(() => {
    const ids = new Set<string>();
    actionPoints.forEach((ap: any) => ap.storeId && ids.add(ap.storeId));
    Object.keys(storeNames).forEach((id) => ids.add(id));
    return Array.from(ids).sort((a, b) => storeLabel(a).localeCompare(storeLabel(b)));
  }, [actionPoints, storeNames]);

  const statusChips = [
    { key: "all", label: "Total", countKey: "total" },
    { key: "open", label: "Open", countKey: "open" },
    { key: "inProgress", label: "In Progress", countKey: "inProgress" },
    { key: "on_hold", label: "On Hold", countKey: "onHold" },
    { key: "completed", label: "Completed", countKey: "completed" },
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
      completed: "bg-emerald-100 text-emerald-800",
      closed: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {String(status || "").replace(/_/g, " ")}
      </span>
    );
  };

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (viewTab === "assignee") {
      exportRowsToCsv(
        `action-points-assignee-${stamp}.csv`,
        ["Assignee", "Total", "Open", "In Progress", "Completed", "Closed", "Overdue", "Resolution %", "Overdue %", "Avg Cycle Hours"],
        byAssignee.map((r: any) => [
          userLabel(r.assignee),
          String(r.total),
          String(r.open),
          String(r.inProgress),
          String(r.completed),
          String(r.closed),
          String(r.overdue),
          String(r.resolutionRate),
          String(r.overdueRate),
          String(r.avgCycleHours),
        ]),
      );
      return;
    }
    if (viewTab === "trends") {
      exportRowsToCsv(
        `action-points-trends-${stamp}.csv`,
        ["Date", "Created", "Completed", "Closed", "Overdue"],
        trends.map((r: any) => [
          r.date,
          String(r.created),
          String(r.completed),
          String(r.closed),
          String(r.overdue),
        ]),
      );
      return;
    }
    const rows = viewTab === "overdue" ? overdueRows : actionPoints;
    exportRowsToCsv(
      `action-points-${viewTab}-${stamp}.csv`,
      ["Title", "Status", "Priority", "Assignee", "Store", "Due Date", "Overdue", "Created At", "Completed At"],
      rows.map((ap: any) => [
        ap.title,
        ap.status,
        ap.priority,
        userLabel(ap.assignedTo),
        storeLabel(ap.storeId),
        ap.dueDate ? new Date(ap.dueDate).toISOString() : "",
        ap.isOverdue ? "Yes" : "No",
        ap.createdAt ? new Date(ap.createdAt).toISOString() : "",
        ap.completedAt ? new Date(ap.completedAt).toISOString() : "",
      ]),
    );
  };

  const tabs: { key: ViewTab; label: string; icon: typeof ListTodo }[] = [
    { key: "list", label: "Status Tracking", icon: ListTodo },
    { key: "overdue", label: "Overdue", icon: AlertCircle },
    { key: "assignee", label: "Assignee Performance", icon: Users },
    { key: "trends", label: "Trend Analysis", icon: TrendingUp },
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
          <div className="p-2 rounded-lg bg-orange-50">
            <AlertCircle className="w-7 h-7 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("actionPointsReports")}</h1>
            <p className="text-sm text-muted-foreground">{t("actionPointsReportsDesc")}</p>
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
          { label: "Open", value: kpis.open, icon: ListTodo },
          { label: "In Progress", value: kpis.inProgress, icon: Clock },
          { label: "Overdue", value: kpis.overdue, icon: AlertCircle },
          { label: "Due Today", value: kpis.dueToday, icon: Clock },
          { label: "Resolved", value: kpis.resolved, icon: CheckCircle2 },
          { label: "Resolution", value: `${kpis.resolutionRate}%`, icon: TrendingUp },
          { label: "Avg Cycle (h)", value: kpis.avgCycleHours, icon: Clock },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3">
              <kpi.icon className="w-4 h-4 text-orange-600 mb-2" />
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
                    ? "bg-orange-100 text-orange-800 border-orange-200"
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
                  placeholder="Search title, assignee, store, id..."
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
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Assignee</label>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-44">
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
              <label className="text-xs font-medium text-muted-foreground">Store</label>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-44">
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
            {key === "overdue" && (
              <Badge variant="outline" className="ml-1">
                {kpis.overdue}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">Loading...</div>
      ) : viewTab === "trends" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <Line type="monotone" dataKey="created" stroke={CHART_COLORS[1]} strokeWidth={2} />
                    <Line type="monotone" dataKey="completed" stroke={CHART_COLORS[0]} strokeWidth={2} />
                    <Line type="monotone" dataKey="closed" stroke={CHART_COLORS[2]} strokeWidth={2} />
                    <Line type="monotone" dataKey="overdue" stroke={CHART_COLORS[3]} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Priority Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.byPriority || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priority" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : viewTab === "assignee" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Assignee Performance Metrics</span>
              <Badge variant="outline">{byAssignee.length} assignees</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {byAssignee.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No assignee data</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Open</TableHead>
                      <TableHead>In Progress</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Overdue</TableHead>
                      <TableHead>Resolution</TableHead>
                      <TableHead>Overdue Rate</TableHead>
                      <TableHead>Avg Cycle (h)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byAssignee.map((row: any) => (
                      <TableRow
                        key={row.assignee}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => {
                          setAssigneeFilter(row.assignee);
                          setViewTab("list");
                        }}
                      >
                        <TableCell className="font-medium">{userLabel(row.assignee)}</TableCell>
                        <TableCell>{row.total}</TableCell>
                        <TableCell>{row.open}</TableCell>
                        <TableCell>{row.inProgress}</TableCell>
                        <TableCell>{row.completed}</TableCell>
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
                    ))}
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
              <span>{viewTab === "overdue" ? "Overdue Action Points" : "Action Point Status Tracking"}</span>
              <Badge variant="outline">
                {(viewTab === "overdue" ? overdueRows : actionPoints).length} records
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(viewTab === "overdue" ? overdueRows : actionPoints).length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                {viewTab === "overdue" ? "No overdue action points" : "No action points found"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Flag</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(viewTab === "overdue" ? overdueRows : actionPoints).map((ap: any) => (
                      <TableRow key={ap.id}>
                        <TableCell className="font-medium max-w-[240px] truncate" title={ap.title}>
                          {ap.title}
                        </TableCell>
                        <TableCell>{getStatusBadge(ap.status)}</TableCell>
                        <TableCell className="capitalize">{ap.priority || "—"}</TableCell>
                        <TableCell>{userLabel(ap.assignedTo)}</TableCell>
                        <TableCell>{storeLabel(ap.storeId)}</TableCell>
                        <TableCell>
                          {ap.dueDate ? new Date(ap.dueDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          {ap.isOverdue ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : ap.isDueToday ? (
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Due Today</Badge>
                          ) : ap.isOnTime ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">On Time</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {ap.createdAt ? new Date(ap.createdAt).toLocaleDateString() : "—"}
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
