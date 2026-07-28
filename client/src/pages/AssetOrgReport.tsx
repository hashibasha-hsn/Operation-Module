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
  Package,
  Clock,
  CheckCircle2,
  History,
  TrendingUp,
  Activity,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type DateFilter,
  exportRowsToCsv,
  fetchAssetOrgReport,
  fetchEntities,
} from "@/lib/reportApi";
import { fetchUsers, getUserDisplayName } from "@/lib/processApi";
import { buildStoreNameMap, humanLabel } from "@/lib/displayLabels";
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

type ViewTab = "list" | "expiry" | "utilization" | "history";

const CHART_COLORS = ["#0d9488", "#2563eb", "#f59e0b", "#ef4444"];

function rateClass(value: number) {
  if (value >= 80) return "text-emerald-700 bg-emerald-50";
  if (value >= 60) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

export default function AssetOrgReport() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [viewTab, setViewTab] = useState<ViewTab>("list");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEntities()
      .then((entities) => {
        setStoreNames(buildStoreNameMap(entities || []));
      })
      .catch(() => setStoreNames({}));
    fetchUsers(500)
      .then((users) => {
        const map: Record<string, string> = {};
        (users || []).forEach((user: any) => {
          const id = user.userId || user.id;
          if (id) map[id] = getUserDisplayName(user);
        });
        setUserNames(map);
      })
      .catch(() => setUserNames({}));
  }, []);

  useEffect(() => {
    fetchData();
  }, [statusFilter, conditionFilter, storeFilter, userFilter, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchAssetOrgReport({
        dateFilter,
        status: statusFilter,
        condition: conditionFilter,
        storeId: storeFilter,
        userId: userFilter,
        search: searchTerm || undefined,
      });
      setData(result);
    } catch (error) {
      console.error("Error fetching asset org report:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const storeLabel = (id?: string) => {
    if (!id) return "—";
    if (id === "Unassigned Store") return id;
    return humanLabel(storeNames[id], "—");
  };

  const userLabel = (userId?: string) =>
    userId ? humanLabel(userNames[userId], "Unknown user") : "—";

  const assets = useMemo(() => {
    const rows = Array.isArray(data?.assets) ? data.assets : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((a: any) =>
      [a.assetName, a.customAssetId, a.userId, a.status, a.condition, a.id, storeLabel(a.storeId)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, searchTerm, storeNames]);

  const historyEvents = Array.isArray(data?.historyEvents) ? data.historyEvents : [];
  const expiringList = Array.isArray(data?.expiringList) ? data.expiringList : [];
  const byStatus = Array.isArray(data?.byStatus) ? data.byStatus : [];
  const byCondition = Array.isArray(data?.byCondition) ? data.byCondition : [];
  const byStore = Array.isArray(data?.byStore) ? data.byStore : [];
  const utilizationBuckets = Array.isArray(data?.utilizationBuckets) ? data.utilizationBuckets : [];
  const trends = Array.isArray(data?.trends) ? data.trends : [];
  const kpis = data?.kpis || {
    total: 0,
    active: 0,
    expired: 0,
    expiringSoon: 0,
    needsRenewal: 0,
    overdueRenewal: 0,
    avgUtilization: 0,
    assigned: 0,
    unassigned: 0,
    assignmentRate: 0,
  };
  const statusCounts = data?.statusCounts || {};

  const userOptions = useMemo(() => {
    const ids = new Set<string>();
    assets.forEach((a: any) => a.userId && ids.add(a.userId));
    return Array.from(ids).sort();
  }, [assets]);

  const storeOptions = useMemo(() => {
    const ids = new Set<string>();
    assets.forEach((a: any) => a.storeId && ids.add(a.storeId));
    Object.keys(storeNames).forEach((id) => ids.add(id));
    return Array.from(ids).sort((a, b) => storeLabel(a).localeCompare(storeLabel(b)));
  }, [assets, storeNames]);

  const statusChips = [
    { key: "all", label: "Total", countKey: "total" },
    { key: "active", label: "Active", countKey: "active" },
    { key: "inactive", label: "Inactive", countKey: "inactive" },
    { key: "maintenance", label: "Maintenance", countKey: "maintenance" },
    { key: "retired", label: "Retired", countKey: "retired" },
    { key: "expired", label: "Expired", countKey: "expired" },
    { key: "expiringSoon", label: "Expiring Soon", countKey: "expiringSoon" },
    { key: "needsRenewal", label: "Needs Renewal", countKey: "needsRenewal" },
    { key: "highUtilization", label: "High Util.", countKey: "highUtilization" },
    { key: "lowUtilization", label: "Low Util.", countKey: "lowUtilization" },
  ];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-800",
      inactive: "bg-gray-100 text-gray-800",
      maintenance: "bg-amber-100 text-amber-800",
      retired: "bg-slate-100 text-slate-800",
      disposed: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {String(status || "").replace(/_/g, " ")}
      </span>
    );
  };

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (viewTab === "history") {
      exportRowsToCsv(
        `asset-history-${stamp}.csv`,
        ["Date", "Asset", "Custom ID", "Action", "Note", "User", "Store"],
        historyEvents.map((h: any) => [
          h.date ? new Date(h.date).toISOString() : "",
          h.assetName,
          h.customAssetId || "",
          h.action,
          h.note,
          h.user,
          storeLabel(h.storeId),
        ]),
      );
      return;
    }
    if (viewTab === "utilization") {
      exportRowsToCsv(
        `asset-utilization-${stamp}.csv`,
        ["Asset", "Store", "Status", "Utilization %", "Assignee", "Condition"],
        assets.map((a: any) => [
          a.assetName,
          storeLabel(a.storeId),
          a.status,
          String(a.utilizationPercent ?? 0),
          userLabel(a.userId),
          a.condition || "",
        ]),
      );
      return;
    }
    if (viewTab === "expiry") {
      exportRowsToCsv(
        `asset-expiry-renewal-${stamp}.csv`,
        ["Asset", "Status", "Expiry Date", "Days to Expiry", "Renewal Date", "Days to Renewal", "Flag", "Store"],
        expiringList.map((a: any) => [
          a.assetName,
          a.status,
          a.expiryDate ? new Date(a.expiryDate).toISOString() : "",
          a.daysToExpiry != null ? String(a.daysToExpiry) : "",
          a.renewalDate ? new Date(a.renewalDate).toISOString() : "",
          a.daysToRenewal != null ? String(a.daysToRenewal) : "",
          a.isExpired
            ? "Expired"
            : a.isOverdueRenewal
              ? "Overdue Renewal"
              : a.isExpiringSoon
                ? "Expiring Soon"
                : a.needsRenewal
                  ? "Needs Renewal"
                  : "",
          storeLabel(a.storeId),
        ]),
      );
      return;
    }
    exportRowsToCsv(
      `asset-status-${stamp}.csv`,
      [
        "Name",
        "Custom ID",
        "Status",
        "Condition",
        "Store",
        "Assignee",
        "Expiry",
        "Renewal",
        "Utilization %",
        "Last Maintenance",
        "History Events",
      ],
      assets.map((a: any) => [
        a.assetName,
        a.customAssetId || "",
        a.status,
        a.condition || "",
        storeLabel(a.storeId),
        userLabel(a.userId),
        a.expiryDate ? new Date(a.expiryDate).toISOString() : "",
        a.renewalDate ? new Date(a.renewalDate).toISOString() : "",
        String(a.utilizationPercent ?? 0),
        a.lastMaintenanceDate ? new Date(a.lastMaintenanceDate).toISOString() : "",
        String(a.historyCount ?? 0),
      ]),
    );
  };

  const tabs: { key: ViewTab; label: string; icon: typeof Package }[] = [
    { key: "list", label: "Status Tracking", icon: Package },
    { key: "expiry", label: "Expiry & Renewal", icon: CalendarClock },
    { key: "utilization", label: "Utilization", icon: TrendingUp },
    { key: "history", label: "Asset History", icon: History },
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
          <div className="p-2 rounded-lg bg-teal-50">
            <Package className="w-7 h-7 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("assetReports")}</h1>
            <p className="text-sm text-muted-foreground">{t("assetReportsDesc")}</p>
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
          { label: "Active", value: kpis.active, icon: CheckCircle2 },
          { label: "Expired", value: kpis.expired, icon: AlertTriangle },
          { label: "Expiring Soon", value: kpis.expiringSoon, icon: Clock },
          { label: "Needs Renewal", value: kpis.needsRenewal, icon: CalendarClock },
          { label: "Avg Utilization", value: `${kpis.avgUtilization}%`, icon: TrendingUp },
          { label: "Assigned", value: kpis.assigned, icon: Package },
          { label: "Assignment", value: `${kpis.assignmentRate}%`, icon: CheckCircle2 },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3">
              <kpi.icon className="w-4 h-4 text-teal-600 mb-2" />
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
                    ? "bg-teal-100 text-teal-800 border-teal-200"
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
                  placeholder="Search name, asset id, assignee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchData()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Condition</label>
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Assignee</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {userOptions.map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
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
            {key === "expiry" && (
              <Badge variant="outline" className="ml-1">
                {kpis.expired + kpis.expiringSoon + kpis.needsRenewal}
              </Badge>
            )}
            {key === "history" && (
              <Badge variant="outline" className="ml-1">
                {historyEvents.length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">Loading...</div>
      ) : viewTab === "expiry" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Expired", value: kpis.expired },
              { label: "Expiring Soon (30d)", value: kpis.expiringSoon },
              { label: "Needs Renewal", value: kpis.needsRenewal },
              { label: "Overdue Renewal", value: kpis.overdueRenewal },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-4 pb-3">
                  <div className="text-xl font-bold">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Expiry & Renewal Tracking</span>
                <Badge variant="outline">{expiringList.length} assets</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringList.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No expiry or renewal items</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Renewal</TableHead>
                        <TableHead>Flag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiringList.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.assetName}</TableCell>
                          <TableCell>{storeLabel(a.storeId)}</TableCell>
                          <TableCell>
                            {a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell className={a.daysToExpiry != null && a.daysToExpiry < 0 ? "text-red-600 font-semibold" : ""}>
                            {a.daysToExpiry != null ? a.daysToExpiry : "—"}
                          </TableCell>
                          <TableCell>
                            {a.renewalDate ? new Date(a.renewalDate).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            {a.isExpired ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : a.isOverdueRenewal ? (
                              <Badge variant="destructive">Overdue Renewal</Badge>
                            ) : a.isExpiringSoon ? (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Expiring Soon</Badge>
                            ) : a.needsRenewal ? (
                              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Needs Renewal</Badge>
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
        </div>
      ) : viewTab === "utilization" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Utilization Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={utilizationBuckets}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Utilization by Store</CardTitle>
              </CardHeader>
              <CardContent>
                {byStore.length === 0 ? (
                  <p className="text-sm text-muted-foreground h-64 flex items-center justify-center">No store data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={byStore.map((s: any) => ({
                        ...s,
                        store: storeLabel(s.storeId),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="store" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="avgUtilization" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} name="Avg %" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Asset Utilization Metrics</span>
                <Badge variant="outline">{assets.length} assets</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Condition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.assetName}</TableCell>
                        <TableCell>{storeLabel(a.storeId)}</TableCell>
                        <TableCell>{userLabel(a.userId)}</TableCell>
                        <TableCell>{getStatusBadge(a.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={rateClass(a.utilizationPercent || 0)}>
                            {a.utilizationPercent ?? 0}%
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{a.condition || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : viewTab === "history" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Asset Activity Trends</CardTitle>
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
                      <Line type="monotone" dataKey="renewed" stroke={CHART_COLORS[0]} strokeWidth={2} />
                      <Line type="monotone" dataKey="expired" stroke={CHART_COLORS[3]} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Asset History Reporting</span>
                <Badge variant="outline">{historyEvents.length} events</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyEvents.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No history events</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Store</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyEvents.map((h: any, idx: number) => (
                        <TableRow key={`${h.assetId}-${idx}`}>
                          <TableCell>
                            {h.date ? new Date(h.date).toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="font-medium">{h.assetName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{h.action}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[240px] truncate" title={h.note}>
                            {h.note || "—"}
                          </TableCell>
                          <TableCell>{h.user || "—"}</TableCell>
                          <TableCell>{storeLabel(h.storeId)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assets by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assets by Condition</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byCondition}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="condition" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Asset Status Tracking</span>
                <Badge variant="outline">{assets.length} records</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assets.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No assets found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead>Flag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium max-w-[200px] truncate" title={a.assetName}>
                            {a.assetName}
                            {a.customAssetId ? (
                              <div className="text-xs text-muted-foreground">{a.customAssetId}</div>
                            ) : null}
                          </TableCell>
                          <TableCell>{getStatusBadge(a.status)}</TableCell>
                          <TableCell className="capitalize">{a.condition || "—"}</TableCell>
                          <TableCell>{storeLabel(a.storeId)}</TableCell>
                          <TableCell>{userLabel(a.userId)}</TableCell>
                          <TableCell>
                            {a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={rateClass(a.utilizationPercent || 0)}>
                              {a.utilizationPercent ?? 0}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {a.isExpired ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : a.isExpiringSoon ? (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Expiring Soon</Badge>
                            ) : a.needsRenewal ? (
                              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Renewal</Badge>
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
        </div>
      )}
    </div>
  );
}
