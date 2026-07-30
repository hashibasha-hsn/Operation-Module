import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  BarChart3,
  LineChart,
  PieChart,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  LayoutGrid,
  LayoutTemplate,
  Activity,
  Table2,
  Share2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  createDashboard,
  createDashboardFromTemplate,
  deleteDashboard,
  dashboardMatchesTab,
  fetchDashboardData,
  fetchDashboardTemplates,
  fetchDashboards,
  loadGlobalFilters,
  saveGlobalFilters,
  shareDashboard,
  tabToDashboardType,
  updateDashboard,
  updateChart,
  type DashboardDataFilters,
  type DashboardTemplateDefinition,
} from "@/lib/dashboardApi";
import { templatesForTab } from "@/lib/dashboardTemplates";
import { fetchProcesses, fetchUsers, getUserDisplayName } from "@/lib/processApi";
import { exportRowsToCsv, getReportContext } from "@/lib/reportApi";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";

const emptyCreateForm = {
  name: "",
  type: "process",
  chartType: "bar",
  includeActionPoints: true,
  ticketType: "all",
  processIds: [] as string[],
  assigneeIds: [] as string[],
  readOnlyAssigneeIds: [] as string[],
};

export default function CustomDashboards() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const { userId } = getReportContext();

  const chartTypes = [
    { value: "bar", label: t("barChart"), icon: BarChart3 },
    { value: "line", label: t("lineChart"), icon: LineChart },
    { value: "pie", label: t("pieChart"), icon: PieChart },
    { value: "table", label: t("table"), icon: Table2 },
    { value: "kpi", label: t("kpiCards"), icon: Activity },
  ];

  function getChartIcon(type: string) {
    const ChartIcon = chartTypes.find((ct) => ct.value === type)?.icon || BarChart3;
    return <ChartIcon className="w-5 h-5" />;
  }

  function getChartTypeLabel(type: string) {
    return chartTypes.find((ct) => ct.value === type)?.label || type;
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      "process-workflow": t("processAndWorkflow"),
      "ticket": t("ticket"),
      "action-point": t("actionPoint"),
    };
    return labels[type] || type;
  }

  const categoryLabels: Record<string, string> = {
    "process-workflow": t("processAndWorkflow"),
    "ticket": t("ticket"),
    "action-point": t("actionPoint"),
  };

  const [activeTab, setActiveTab] = useState("Process & Workflow");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplateDefinition | null>(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    chartType: "bar",
    includeActionPoints: false,
    ticketType: "all",
    processIds: [] as string[],
  });
  const [shareForm, setShareForm] = useState({
    ownerIds: [] as string[],
    assigneeIds: [] as string[],
    readOnlyAssigneeIds: [] as string[],
  });
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [newDashboard, setNewDashboard] = useState(emptyCreateForm);
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [templates, setTemplates] = useState<DashboardTemplateDefinition[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewData, setViewData] = useState<Record<string, any>>({});
  const [globalFilters, setGlobalFilters] = useState<DashboardDataFilters>(() => loadGlobalFilters());
  const [filterDraft, setFilterDraft] = useState<DashboardDataFilters>(globalFilters);

  const tabs = ["Process & Workflow", "Ticket & Action Point"];

  const visibleTemplates = useMemo(() => {
    if (templates.length) {
      if (activeTab === "Ticket & Action Point") {
        return templates.filter((t) => t.category === "ticket" || t.category === "action-point");
      }
      return templates.filter((t) => t.category === "process-workflow");
    }
    return templatesForTab(activeTab);
  }, [templates, activeTab]);

  const loadDashboards = async () => {
    setLoading(true);
    try {
      const type = tabToDashboardType(activeTab);
      const data = await fetchDashboards(type);
      setDashboards((data || []).filter((d) => dashboardMatchesTab(d, activeTab)));
    } catch {
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboards();
  }, [activeTab]);

  useEffect(() => {
    fetchDashboardTemplates().then(setTemplates).catch(() => setTemplates(templatesForTab(activeTab)));
    const { organizationId } = getReportContext();
    fetchProcesses(organizationId)
      .then(setProcesses)
      .catch((err) => {
        console.error(err);
        toast.error(err?.message || t("failedToLoadProcesses"));
        setProcesses([]);
      });
    fetchUsers(200).then(setUsers).catch(() => setUsers([]));
  }, []);

  const openCreateDialog = () => {
    const defaultType =
      activeTab === "Ticket & Action Point" ? "ticket" : "process";
    setNewDashboard({ ...emptyCreateForm, type: defaultType });
    setShowCreateDialog(true);
  };

  const loadDashboardKpis = async (id: string) => {
    try {
      const data = await fetchDashboardData(id, globalFilters);
      setViewData((prev) => ({ ...prev, [id]: data }));
    } catch {
      setViewData((prev) => ({ ...prev, [id]: null }));
    }
  };

  useEffect(() => {
    setViewData({});
    dashboards.forEach((d) => loadDashboardKpis(d.id));
  }, [dashboards, globalFilters]);

  const resolveType = (type: string): "process-workflow" | "ticket" | "action-point" => {
    if (type === "ticket") return "ticket";
    if (type === "actionPoint") return "action-point";
    return "process-workflow";
  };

  const handleCreateDashboard = async () => {
    if (!newDashboard.name.trim()) return;
    try {
      const type = resolveType(newDashboard.type);
      const dashboard = await createDashboard({
        title: newDashboard.name.trim(),
        type,
        chartType: newDashboard.chartType,
        includeActionPoints: type === "process-workflow" ? newDashboard.includeActionPoints : false,
        ticketType:
          type === "ticket"
            ? newDashboard.ticketType === "all"
              ? null
              : (newDashboard.ticketType as "normal" | "asset")
            : null,
        processIds: type === "process-workflow" || type === "action-point" ? newDashboard.processIds : [],
        ownerIds: [userId || "admin"],
        assigneeIds: newDashboard.assigneeIds,
        readOnlyAssigneeIds: newDashboard.readOnlyAssigneeIds,
        config: { createdVia: "builder" },
      });
      setShowCreateDialog(false);
      setNewDashboard(emptyCreateForm);
      await loadDashboards();
      toast.success(t("dashboardCreated"));
      if (dashboard?.id) navigate(`/custom-dashboards/${dashboard.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || t("failedToCreateDashboard"));
    }
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;
    setCreatingTemplate(true);
    try {
      const dashboard = await createDashboardFromTemplate(
        selectedTemplate.id,
        templateTitle.trim() || undefined,
      );
      setShowTemplateDialog(false);
      setSelectedTemplate(null);
      setTemplateTitle("");
      await loadDashboards();
      toast.success(t("dashboardCreatedFromTemplate"));
      if (dashboard?.id) navigate(`/custom-dashboards/${dashboard.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || t("failedToCreateFromTemplate"));
    } finally {
      setCreatingTemplate(false);
    }
  };

  const openTemplateDialog = (template: DashboardTemplateDefinition) => {
    setSelectedTemplate(template);
    setTemplateTitle(template.name);
    setShowTemplateDialog(true);
  };

  const handleEditDashboard = async () => {
    if (!selectedDashboard?.id || !editForm.name.trim()) return;
    try {
      await updateDashboard(selectedDashboard.id, {
        title: editForm.name.trim(),
        includeActionPoints: editForm.includeActionPoints,
        ticketType:
          selectedDashboard.type === "ticket"
            ? editForm.ticketType === "all"
              ? null
              : (editForm.ticketType as "normal" | "asset")
            : selectedDashboard.ticketType,
        processIds: editForm.processIds,
      });
      const chartId = selectedDashboard.charts?.[0]?.id;
      if (chartId && editForm.chartType) {
        await updateChart(chartId, { chartType: editForm.chartType });
      }
      setShowEditDialog(false);
      toast.success(t("dashboardUpdated"));
      loadDashboards();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || t("failedToUpdateDashboard"));
    }
  };

  const handleShareDashboard = async () => {
    if (!selectedDashboard?.id) return;
    try {
      await shareDashboard(selectedDashboard.id, {
        ownerIds: shareForm.ownerIds.length ? shareForm.ownerIds : [userId || "admin"],
        assigneeIds: shareForm.assigneeIds,
        readOnlyAssigneeIds: shareForm.readOnlyAssigneeIds,
      });
      setShowShareDialog(false);
      toast.success(t("sharingUpdated"));
      loadDashboards();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || t("failedToShareDashboard"));
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    try {
      await deleteDashboard(id);
      toast.success(t("dashboardDeleted"));
      loadDashboards();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || t("failedToDeleteDashboard"));
    }
  };

  const applyGlobalFilters = () => {
    saveGlobalFilters(filterDraft);
    setGlobalFilters(filterDraft);
    setShowFilterDialog(false);
  };

  const handleExportList = () => {
    const rows = dashboards.map((d) => {
      const kpis = viewData[d.id]?.kpis ?? {};
      return [
        d.title,
        d.type,
        d.charts?.[0]?.chartType ?? "bar",
        String(Object.values(kpis)[0] ?? ""),
        String(Object.values(kpis)[1] ?? ""),
        String(Object.values(kpis)[2] ?? ""),
        d.updatedAt ? new Date(d.updatedAt).toISOString().slice(0, 10) : "",
      ];
    });
    exportRowsToCsv(
      `custom-dashboards-${Date.now()}.csv`,
      ["Title", "Type", "Chart", "KPI1", "KPI2", "KPI3", "Updated"],
      rows,
    );
  };

  const toggleId = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const mapDashboard = (dashboard: any) => {
    const data = viewData[dashboard.id];
    const kpis = data?.kpis ?? {};
    const firstChart = dashboard.charts?.[0];
    const shareCount =
      (dashboard.assigneeIds?.length || 0) + (dashboard.readOnlyAssigneeIds?.length || 0);
    return {
      id: dashboard.id,
      name: dashboard.title,
      type: dashboard.type,
      chartType: firstChart?.chartType ?? "bar",
      chartsCount: dashboard.chartsCount || dashboard.charts?.length || 0,
      permission: dashboard.permission || "edit",
      shareCount,
      lastUpdated: dashboard.updatedAt
        ? new Date(dashboard.updatedAt).toLocaleDateString()
        : "—",
      kpis: {
        total: kpis.totalSubmissions ?? kpis.open ?? kpis.total ?? "—",
        open: kpis.pendingSubmissions ?? kpis.onHold ?? kpis.inProgress ?? kpis.open ?? "—",
        done: kpis.completedSubmissions ?? kpis.completed ?? kpis.completionRate ?? kpis.closed ?? "—",
      },
    };
  };

  const visibleDashboards = dashboards.map(mapDashboard);
  const activeFilterCount = [globalFilters.startDate, globalFilters.endDate, globalFilters.status, globalFilters.priority, globalFilters.search].filter(Boolean).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t("customDashboards")}</h1>
            <p className="text-muted-foreground mt-1">{t("customDashboardsDesc")}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="gap-2" onClick={() => { setFilterDraft(globalFilters); setShowFilterDialog(true); }}>
            <Filter className="w-4 h-4" />
            {t("globalFilters")}
            {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportList}>
            <Download className="w-4 h-4" />
            {t("export")}
          </Button>
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="w-4 h-4" />
            {t("newDashboard")}
          </Button>
        </div>
      </div>

      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                className={`rounded-t-lg border-b-2 ${
                  activeTab === tab ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "Process & Workflow" ? t("processAndWorkflow") : t("ticketAndActionPoint")}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">{t("dashboardTemplateLibrary")}</h2>
            <p className="text-sm text-muted-foreground">{t("dashboardTemplateLibraryDesc")}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">{getChartIcon(template.chartType)}</div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {categoryLabels[template.category] || template.category.replace("-", " ")}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-2">{template.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => openTemplateDialog(template)}>
                  {t("useTemplate")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-muted-foreground col-span-full text-center py-12">{t("loading")}</p>
        ) : (
          visibleDashboards.map((dashboard) => (
            <Card key={dashboard.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">{getChartIcon(dashboard.chartType)}</div>
                    <div>
                      <CardTitle className="text-base">{dashboard.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{getTypeLabel(dashboard.type)}</Badge>
                        <Badge variant="secondary" className="text-xs capitalize">{getChartTypeLabel(dashboard.chartType)}</Badge>
                        {dashboard.shareCount > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Share2 className="w-3 h-3" />
                            {dashboard.shareCount}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{t("updated")}: {dashboard.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <TableActionsMenu>
                    <DropdownMenuItem
                      onClick={() => {
                        const raw = dashboards.find((d) => d.id === dashboard.id);
                        setSelectedDashboard(raw);
                        setEditForm({
                          name: raw?.title ?? dashboard.name,
                          chartType: raw?.charts?.[0]?.chartType ?? dashboard.chartType,
                          includeActionPoints: !!raw?.includeActionPoints,
                          ticketType: raw?.ticketType || "all",
                          processIds: raw?.processIds || [],
                        });
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const raw = dashboards.find((d) => d.id === dashboard.id);
                        setSelectedDashboard(raw);
                        setShareForm({
                          ownerIds: raw?.ownerIds?.length ? raw.ownerIds : [userId || "admin"],
                          assigneeIds: raw?.assigneeIds || [],
                          readOnlyAssigneeIds: raw?.readOnlyAssigneeIds || [],
                        });
                        setShowShareDialog(true);
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {t("share")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteDashboard(dashboard.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("delete")}
                    </DropdownMenuItem>
                  </TableActionsMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(dashboard.kpis).map(([key, value]) => (
                      <div key={key} className="text-center p-2 bg-muted rounded">
                        <div className="text-lg font-bold">{value}</div>
                        <div className="text-xs text-muted-foreground capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-24 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      {getChartIcon(dashboard.chartType)}
                      <p className="text-xs text-muted-foreground mt-2">
                        {dashboard.chartsCount} {dashboard.chartsCount === 1 ? t("chart") : t("charts")}
                      </p>
                    </div>
                  </div>
                  <Link href={`/custom-dashboards/${dashboard.id}`}>
                    <Button variant="outline" className="w-full" size="sm">
                      {t("viewDashboard")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {!loading && (
          <Card className="border-dashed hover:border-primary cursor-pointer transition-colors" onClick={openCreateDialog}>
            <CardContent className="flex flex-col items-center justify-center h-full py-12">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{t("createNewDashboardCard")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("buildCustomVisualizations")}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("createNewDashboard")}</DialogTitle>
            <DialogDescription>
              {t("createDashboardDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{t("dashboardName")} *</Label>
              <Input
                placeholder={t("enterDashboardName")}
                value={newDashboard.name}
                onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("dataSource")}</Label>
              <Select value={newDashboard.type} onValueChange={(value) => setNewDashboard({ ...newDashboard, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="process">{t("processAndWorkflow")}</SelectItem>
                  <SelectItem value="ticket">{t("ticket")}</SelectItem>
                  <SelectItem value="actionPoint">{t("actionPoint")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("chartType")}</Label>
              <Select value={newDashboard.chartType} onValueChange={(value) => setNewDashboard({ ...newDashboard, chartType: value })}>
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
            {(newDashboard.type === "process" || newDashboard.type === "actionPoint") && (
              <>
                {newDashboard.type === "process" && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeAp"
                      checked={newDashboard.includeActionPoints}
                      onCheckedChange={(v) => setNewDashboard({ ...newDashboard, includeActionPoints: !!v })}
                    />
                    <Label htmlFor="includeAp">{t("includeActionPoints")}</Label>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>{t("processes")} ({t("optional")})</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                    {processes.slice(0, 40).map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={newDashboard.processIds.includes(p.id)}
                          onCheckedChange={() =>
                            setNewDashboard({
                              ...newDashboard,
                              processIds: toggleId(newDashboard.processIds, p.id),
                            })
                          }
                        />
                        {p.title || p.name || t("untitled")}
                      </label>
                    ))}
                    {!processes.length && <p className="text-xs text-muted-foreground">{t("noProcessesFound")}</p>}
                  </div>
                </div>
              </>
            )}
            {newDashboard.type === "ticket" && (
              <div className="grid gap-2">
                <Label>{t("ticketType")}</Label>
                <Select value={newDashboard.ticketType} onValueChange={(value) => setNewDashboard({ ...newDashboard, ticketType: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allTickets")}</SelectItem>
                    <SelectItem value="normal">{t("normal")}</SelectItem>
                    <SelectItem value="asset">{t("asset")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label>{t("shareWithEditors")}</Label>
              <div className="max-h-28 overflow-y-auto border rounded-md p-2 space-y-1">
                {users.slice(0, 50).map((u) => {
                  const id = String(u.userId ?? u.id);
                  return (
                    <label key={id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={newDashboard.assigneeIds.includes(id)}
                        onCheckedChange={() =>
                          setNewDashboard({
                            ...newDashboard,
                            assigneeIds: toggleId(newDashboard.assigneeIds, id),
                          })
                        }
                      />
                      {getUserDisplayName(u)}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleCreateDashboard}>{t("createDashboard")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createFromTemplate")}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t("templateNameOptional")}</Label>
              <Input value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} placeholder={selectedTemplate?.name} />
            </div>
            {selectedTemplate && (
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize">{categoryLabels[selectedTemplate.category] || selectedTemplate.category.replace("-", " ")}</Badge>
                <Badge variant="secondary" className="capitalize">{getChartTypeLabel(selectedTemplate.chartType)}</Badge>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleUseTemplate} disabled={creatingTemplate}>
              {creatingTemplate ? t("loading") : t("useTemplate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / Configure */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editDashboard")}</DialogTitle>
            <DialogDescription>{t("configureDashboardDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{t("dashboardName")}</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("primaryChartType")}</Label>
              <Select value={editForm.chartType} onValueChange={(value) => setEditForm({ ...editForm, chartType: value })}>
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
            {selectedDashboard?.type === "process-workflow" && (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={editForm.includeActionPoints}
                    onCheckedChange={(v) => setEditForm({ ...editForm, includeActionPoints: !!v })}
                  />
                  <Label>{t("includeActionPoints")}</Label>
                </div>
                <div className="grid gap-2">
                  <Label>{t("processes")}</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                    {processes.slice(0, 40).map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={editForm.processIds.includes(p.id)}
                          onCheckedChange={() =>
                            setEditForm({ ...editForm, processIds: toggleId(editForm.processIds, p.id) })
                          }
                        />
                        {p.title || p.name || p.id}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
            {selectedDashboard?.type === "ticket" && (
              <div className="grid gap-2">
                <Label>{t("ticketType")}</Label>
                <Select value={editForm.ticketType} onValueChange={(value) => setEditForm({ ...editForm, ticketType: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allTickets")}</SelectItem>
                    <SelectItem value="normal">{t("normal")}</SelectItem>
                    <SelectItem value="asset">{t("asset")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleEditDashboard}>{t("saveChanges")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("shareDashboard")}</DialogTitle>
            <DialogDescription>
              {t("shareDashboardDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {[
              { key: "ownerIds" as const, label: t("owners") },
              { key: "assigneeIds" as const, label: t("editors") },
              { key: "readOnlyAssigneeIds" as const, label: t("viewers") },
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
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>{t("cancel")}</Button>
            <Button onClick={handleShareDashboard}>{t("saveSharing")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Filters */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("globalFilters")}</DialogTitle>
            <DialogDescription>{t("globalFiltersDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>{t("startDate")}</Label>
                <Input type="date" value={filterDraft.startDate || ""} onChange={(e) => setFilterDraft({ ...filterDraft, startDate: e.target.value || undefined })} />
              </div>
              <div className="grid gap-2">
                <Label>{t("endDate")}</Label>
                <Input type="date" value={filterDraft.endDate || ""} onChange={(e) => setFilterDraft({ ...filterDraft, endDate: e.target.value || undefined })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("status")}</Label>
              <Input placeholder={t("egOpenCompleted")} value={filterDraft.status || ""} onChange={(e) => setFilterDraft({ ...filterDraft, status: e.target.value || undefined })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("priority")}</Label>
              <Select
                value={filterDraft.priority || "all"}
                onValueChange={(v) => setFilterDraft({ ...filterDraft, priority: v === "all" ? undefined : v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="highest">{t("highest")}</SelectItem>
                  <SelectItem value="high">{t("high")}</SelectItem>
                  <SelectItem value="medium">{t("medium")}</SelectItem>
                  <SelectItem value="low">{t("low")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("search")}</Label>
              <Input placeholder={t("searchTitleStatus")} value={filterDraft.search || ""} onChange={(e) => setFilterDraft({ ...filterDraft, search: e.target.value || undefined })} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFilterDraft({});
                saveGlobalFilters({});
                setGlobalFilters({});
                setShowFilterDialog(false);
              }}
            >
              {t("clearFilters")}
            </Button>
            <Button onClick={applyGlobalFilters}>{t("applyFilters")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}