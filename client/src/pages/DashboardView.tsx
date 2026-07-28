import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  Table2,
  Download,
  Filter,
  Plus,
  Share2,
  Trash2,
  Settings2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardChart, KpiGrid } from "@/components/DashboardCharts";
import {
  createChart,
  deleteChart,
  fetchDashboard,
  fetchDashboardData,
  loadGlobalFilters,
  shareDashboard,
  updateChart,
  updateDashboard,
  type DashboardDataFilters,
} from "@/lib/dashboardApi";
import { fetchUsers, getUserDisplayName } from "@/lib/processApi";
import { exportRowsToCsv, getReportContext } from "@/lib/reportApi";

const chartTypes = [
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "line", label: "Line Chart", icon: LineChartIcon },
  { value: "pie", label: "Pie Chart", icon: PieChartIcon },
  { value: "table", label: "Table", icon: Table2 },
  { value: "kpi", label: "KPI Cards", icon: Activity },
];

function getChartIcon(type: string) {
  if (type === "line") return LineChartIcon;
  if (type === "pie") return PieChartIcon;
  if (type === "kpi") return Activity;
  if (type === "table") return Table2;
  return BarChart3;
}

export default function DashboardView() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/custom-dashboards/:id");
  const dashboardId = params?.id;
  const { userId } = getReportContext();

  const [dashboard, setDashboard] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState<DashboardDataFilters>(() => loadGlobalFilters());
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAddChartDialog, setShowAddChartDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [filterDraft, setFilterDraft] = useState<DashboardDataFilters>(filters);
  const [newChart, setNewChart] = useState({ title: "", chartType: "bar" });
  const [configChart, setConfigChart] = useState<any>(null);
  const [configForm, setConfigForm] = useState({ title: "", chartType: "bar" });
  const [shareForm, setShareForm] = useState({
    ownerIds: [] as string[],
    assigneeIds: [] as string[],
    readOnlyAssigneeIds: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const load = async (nextFilters = filters) => {
    if (!dashboardId) return;
    setLoading(true);
    try {
      const [dash, dashData] = await Promise.all([
        fetchDashboard(dashboardId),
        fetchDashboardData(dashboardId, nextFilters),
      ]);
      setDashboard(dash);
      setData(dashData);
    } catch {
      setDashboard(null);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    fetchUsers(200).then(setUsers).catch(() => setUsers([]));
  }, [dashboardId]);

  const canEdit = dashboard?.permission !== "view";

  const applyFilters = async () => {
    setFilters(filterDraft);
    setShowFilterDialog(false);
    await load(filterDraft);
    if (dashboardId) {
      try {
        await updateDashboard(dashboardId, {
          config: {
            statusFilter: filterDraft.status,
            priorityFilter: filterDraft.priority,
            search: filterDraft.search,
            startDate: filterDraft.startDate,
            endDate: filterDraft.endDate,
          },
        });
      } catch {
        /* non-blocking */
      }
    }
  };

  const handleExport = () => {
    if (!dashboard || !data) return;
    const stamp = Date.now();
    if (data.tableRows?.length) {
      const cols = Object.keys(data.tableRows[0]);
      exportRowsToCsv(
        `${dashboard.title}-table-${stamp}.csv`,
        cols,
        data.tableRows.map((row: any) => cols.map((c) => String(row[c] ?? ""))),
      );
      return;
    }
    const kpiRows = Object.entries(data.kpis ?? {}).map(([k, v]) => [k, String(v)]);
    exportRowsToCsv(`${dashboard.title}-kpis-${stamp}.csv`, ["Metric", "Value"], kpiRows);
  };

  const handleAddChart = async () => {
    if (!dashboardId || !newChart.title.trim()) return;
    setSaving(true);
    try {
      await createChart(dashboardId, {
        title: newChart.title.trim(),
        chartType: newChart.chartType,
        config: { metric: "status" },
        positionX: 0,
        positionY: dashboard?.charts?.length || 0,
        width: 2,
        height: 1,
      });
      setShowAddChartDialog(false);
      setNewChart({ title: "", chartType: "bar" });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChartConfig = async () => {
    if (!configChart?.id) return;
    setSaving(true);
    try {
      await updateChart(configChart.id, {
        title: configForm.title.trim() || configChart.title,
        chartType: configForm.chartType,
      });
      setShowConfigDialog(false);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChart = async (chartId: string) => {
    try {
      await deleteChart(chartId);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    if (!dashboardId) return;
    setSaving(true);
    try {
      await shareDashboard(dashboardId, {
        ownerIds: shareForm.ownerIds.length ? shareForm.ownerIds : [userId || "admin"],
        assigneeIds: shareForm.assigneeIds,
        readOnlyAssigneeIds: shareForm.readOnlyAssigneeIds,
      });
      setShowShareDialog(false);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleId = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate("/custom-dashboards")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("customDashboards")}
        </Button>
        <p className="text-muted-foreground">Dashboard not found or you do not have access.</p>
      </div>
    );
  }

  const charts = [...(dashboard.charts || [])].sort(
    (a: any, b: any) => (a.positionY ?? 0) - (b.positionY ?? 0) || (a.positionX ?? 0) - (b.positionX ?? 0),
  );
  const activeFilterCount = [filters.startDate, filters.endDate, filters.status, filters.priority, filters.search].filter(Boolean).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/custom-dashboards">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              {t("customDashboards")}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{dashboard.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline">{dashboard.type}</Badge>
              <Badge variant="secondary">{charts.length} charts</Badge>
              <Badge variant={canEdit ? "default" : "outline"}>{canEdit ? "Editor" : "Viewer"}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setFilterDraft(filters);
              setShowFilterDialog(true);
            }}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          {canEdit && (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setShareForm({
                    ownerIds: dashboard.ownerIds?.length ? dashboard.ownerIds : [userId || "admin"],
                    assigneeIds: dashboard.assigneeIds || [],
                    readOnlyAssigneeIds: dashboard.readOnlyAssigneeIds || [],
                  });
                  setShowShareDialog(true);
                }}
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                className="gap-2"
                onClick={() => {
                  setNewChart({ title: "New Chart", chartType: "bar" });
                  setShowAddChartDialog(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Add Chart
              </Button>
            </>
          )}
        </div>
      </div>

      {data?.kpis && <KpiGrid kpis={data.kpis} />}

      {charts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <p className="text-muted-foreground">No charts yet. Add a visualization to get started.</p>
            {canEdit && (
              <Button onClick={() => setShowAddChartDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Chart
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {charts.map((chart: any) => {
            const ChartIcon = getChartIcon(chart.chartType);
            return (
              <Card key={chart.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <div className="flex items-center gap-2">
                    <ChartIcon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{chart.title}</CardTitle>
                    <Badge variant="outline" className="capitalize">{chart.chartType}</Badge>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setConfigChart(chart);
                          setConfigForm({ title: chart.title, chartType: chart.chartType });
                          setShowConfigDialog(true);
                        }}
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteChart(chart.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <DashboardChart
                    chartType={chart.chartType}
                    dashboardType={dashboard.type}
                    data={data}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {dashboard.type === "process-workflow" && data?.actionPointsData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Action Points</CardTitle>
          </CardHeader>
          <CardContent>
            <KpiGrid kpis={data.actionPointsData} />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chart Filters</DialogTitle>
            <DialogDescription>Filter the data used by all charts on this dashboard.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filterDraft.startDate || ""}
                  onChange={(e) => setFilterDraft({ ...filterDraft, startDate: e.target.value || undefined })}
                />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filterDraft.endDate || ""}
                  onChange={(e) => setFilterDraft({ ...filterDraft, endDate: e.target.value || undefined })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Input
                placeholder="e.g. open, completed"
                value={filterDraft.status || ""}
                onChange={(e) => setFilterDraft({ ...filterDraft, status: e.target.value || undefined })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select
                value={filterDraft.priority || "all"}
                onValueChange={(v) => setFilterDraft({ ...filterDraft, priority: v === "all" ? undefined : v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="highest">Highest</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Search</Label>
              <Input
                placeholder="Search title / status"
                value={filterDraft.search || ""}
                onChange={(e) => setFilterDraft({ ...filterDraft, search: e.target.value || undefined })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={async () => {
                setFilterDraft({});
                setFilters({});
                setShowFilterDialog(false);
                await load({});
              }}
            >
              Clear
            </Button>
            <Button onClick={applyFilters}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Chart */}
      <Dialog open={showAddChartDialog} onOpenChange={setShowAddChartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Chart</DialogTitle>
            <DialogDescription>Add another visualization to this dashboard.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={newChart.title} onChange={(e) => setNewChart({ ...newChart, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Chart Type</Label>
              <Select value={newChart.chartType} onValueChange={(v) => setNewChart({ ...newChart, chartType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {chartTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddChartDialog(false)}>Cancel</Button>
            <Button onClick={handleAddChart} disabled={saving}>{saving ? t("loading") : "Add Chart"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Chart */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Chart</DialogTitle>
            <DialogDescription>Change the chart title and visualization type.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={configForm.title} onChange={(e) => setConfigForm({ ...configForm, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Chart Type</Label>
              <Select value={configForm.chartType} onValueChange={(v) => setConfigForm({ ...configForm, chartType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {chartTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveChartConfig} disabled={saving}>{saving ? t("loading") : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share Dashboard</DialogTitle>
            <DialogDescription>
              Owners and editors can modify. Viewers have read-only access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {[
              { key: "ownerIds" as const, label: "Owners" },
              { key: "assigneeIds" as const, label: "Editors" },
              { key: "readOnlyAssigneeIds" as const, label: "Viewers" },
            ].map((section) => (
              <div key={section.key} className="grid gap-2">
                <Label>{section.label}</Label>
                <div className="max-h-28 overflow-y-auto border rounded-md p-2 space-y-1">
                  {users.slice(0, 50).map((u) => {
                    const id = String(u.userId ?? u.id);
                    return (
                      <label key={id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={shareForm[section.key].includes(id)}
                          onCheckedChange={() =>
                            setShareForm({
                              ...shareForm,
                              [section.key]: toggleId(shareForm[section.key], id),
                            })
                          }
                        />
                        {getUserDisplayName(u)}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>Cancel</Button>
            <Button onClick={handleShare} disabled={saving}>{saving ? t("loading") : "Save Sharing"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
