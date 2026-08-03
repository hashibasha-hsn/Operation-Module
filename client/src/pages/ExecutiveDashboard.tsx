import { useState, useEffect, useMemo, useCallback } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Download,
  BarChart3,
  Store,
  Map,
  Grid,
  Tag,
  ArrowLeft,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchExecutiveDashboard,
  fetchExecutiveFilterOptions,
  fetchExecutiveStoreDetail,
  exportRowsToCsv,
} from "@/lib/reportApi";
import { humanLabel, truncateLabel } from "@/lib/displayLabels";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CHART_COLORS = ["#0d9488", "#2563eb", "#f59e0b", "#ef4444", "#7c3aed", "#0891b2"];

type TabKey =
  | "overview"
  | "all-stores"
  | "heat-map"
  | "snapshot"
  | "tag-analysis";

function processDisplayName(proc: any) {
  const { t } = useLanguage();
  return humanLabel(proc?.processName, proc?.title, proc?.name, t('untitled'));
}

function storeDisplayName(store: any) {
  const { t } = useLanguage();
  return humanLabel(store?.storeName, store?.name, t('unnamedStore'));
}

function complianceColor(value: number) {
  if (value >= 80) return "text-emerald-700 bg-emerald-50";
  if (value >= 60) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

function heatCellClass(color?: string) {
  if (color === "green") return "bg-emerald-100 text-emerald-800";
  if (color === "yellow") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default function ExecutiveDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [snapshotDate, setSnapshotDate] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [region, setRegion] = useState("all");
  const [brand, setBrand] = useState("all");
  const [department, setDepartment] = useState("all");
  const [metricType, setMetricType] = useState<"count" | "percentage">("percentage");
  const [periodicity, setPeriodicity] = useState<"daily" | "weekly" | "monthly">("daily");
  const [tagDimension, setTagDimension] = useState<"region" | "brand" | "department" | "processTag">("region");
  const [filterOptions, setFilterOptions] = useState<any>({
    regions: [],
    brands: [],
    departments: [],
    processTags: [],
    stores: [],
    processes: [],
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [drillStoreId, setDrillStoreId] = useState<string | null>(null);
  const [storeDetail, setStoreDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [snapshotStoreId, setSnapshotStoreId] = useState<string | undefined>();

  const filters = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      tagFilter,
      region,
      brand,
      department,
      metricType,
      periodicity,
      dimension: tagDimension,
      date: snapshotDate || undefined,
      storeId: activeTab === "snapshot" ? snapshotStoreId : undefined,
      viewType: "compliance" as const,
    }),
    [
      startDate,
      endDate,
      tagFilter,
      region,
      brand,
      department,
      metricType,
      periodicity,
      tagDimension,
      snapshotDate,
      snapshotStoreId,
      activeTab,
    ],
  );

  useEffect(() => {
    fetchExecutiveFilterOptions()
      .then((opts) => setFilterOptions(opts || {}))
      .catch(() => undefined);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchExecutiveDashboard(activeTab, filters);
      setData(result);
    } catch (error) {
      console.error("Error fetching executive dashboard:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openStoreDrillDown = async (storeId: string) => {
    setDrillStoreId(storeId);
    setDetailLoading(true);
    setStoreDetail(null);
    try {
      const detail = await fetchExecutiveStoreDetail(storeId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        tagFilter,
      });
      setStoreDetail(detail);
    } catch (error) {
      console.error("Error fetching store detail:", error);
      setStoreDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const viewStoreInSnapshot = (storeId: string) => {
    setDrillStoreId(null);
    setSnapshotStoreId(storeId);
    setActiveTab("snapshot");
  };

  const handleExport = () => {
    if (!data) return;
    const stamp = new Date().toISOString().slice(0, 10);

    if (activeTab === "overview") {
      const rows = (data.tagSummary || []).map((item: any) => [
        item.tag,
        String(item.completion ?? ""),
        String(item.compliance ?? ""),
        String(item.expected ?? item.totalSubmitted ?? ""),
      ]);
      exportRowsToCsv(`store-health-overview-${stamp}.csv`, [t('tag'), t('completion'), t('compliance'), t('expected')], rows);
      return;
    }

    if (activeTab === "all-stores") {
      const rows = (Array.isArray(data) ? data : []).map((s: any) => [
        storeDisplayName(s),
        s.region || "",
        s.brand || "",
        s.department || "",
        String(s.completionPercentage ?? 0),
        String(s.compliancePercentage ?? 0),
        String(s.totalSubmitted ?? 0),
        String(s.totalExpected ?? 0),
      ]);
      exportRowsToCsv(
        `store-health-stores-${stamp}.csv`,
        [t('store'), t('region'), t('brand'), t('department'), t('completion') + " %", t('compliance') + " %", t('submitted'), t('expected')],
        rows,
      );
      return;
    }

    if (activeTab === "tag-analysis") {
      const rows = (Array.isArray(data) ? data : []).map((item: any) => [
        item.name,
        item.dimension || tagDimension,
        String(item.storeCount ?? 0),
        String(item.totalSubmitted ?? item.totalSubmissions ?? 0),
        String(item.totalCompliant ?? 0),
        String(item.compliancePercentage ?? item.averageCompliance ?? 0),
      ]);
      exportRowsToCsv(
        `store-health-tags-${stamp}.csv`,
        [t('name'), t('dimension'), t('stores'), t('submitted'), t('compliant'), t('compliance') + " %"],
        rows,
      );
      return;
    }

    if (activeTab === "heat-map") {
      const processes = data.processes || [];
      const headers = [t('store'), t('region'), ...processes.map((p: any) => processDisplayName(p))];
      const rows = (data.stores || []).map((store: any) => {
        const storeId = store.storeId || store;
        const name = storeDisplayName(store);
        const cells = processes.map((p: any) => {
          const pid = p.processId || p;
          return String(data.matrix?.[storeId]?.[pid]?.compliancePercentage ?? 0);
        });
        return [name, store.region || "", ...cells];
      });
      exportRowsToCsv(`store-health-heatmap-${stamp}.csv`, headers, rows);
      return;
    }

    if (activeTab === "snapshot") {
      const processes = data.processes || [];
      const headers = [t('store'), t('averagePercent'), ...processes.map((p: any) => processDisplayName(p))];
      const rows = (data.stores || []).map((store: any) => {
        const storeId = store.storeId || store;
        const snap = data.snapshot?.[storeId];
        const cells = processes.map((p: any) => {
          const pid = p.processId || p;
          return String(snap?.processes?.[pid]?.completionPercentage ?? 0);
        });
        return [storeDisplayName(store), String(snap?.average ?? 0), ...cells];
      });
      exportRowsToCsv(`store-health-snapshot-${stamp}.csv`, headers, rows);
    }
  };

  const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
    { key: "overview", label: t('overview'), icon: BarChart3 },
    { key: "all-stores", label: t('allStores'), icon: Store },
    { key: "heat-map", label: t('heatMap'), icon: Map },
    { key: "snapshot", label: t('snapshot'), icon: Grid },
    { key: "tag-analysis", label: t('tagAnalysis'), icon: Tag },
  ];

  const kpis = data?.kpis;
  const trends = Array.isArray(data?.trends) ? data.trends : [];
  const processCompletion = Array.isArray(data?.processCompletion) ? data.processCompletion : [];
  const regionCompliance = Array.isArray(data?.regionCompliance) ? data.regionCompliance : [];
  const tagSummary = Array.isArray(data?.tagSummary) ? data.tagSummary : [];
  const allStores = Array.isArray(data) && activeTab === "all-stores" ? data : [];
  const tagItems = Array.isArray(data) && activeTab === "tag-analysis" ? data : [];

  const heatMapData = useMemo(() => {
    if (activeTab !== "heat-map" || !data) {
      return { stores: [], processes: [], matrix: {} };
    }
    return {
      stores: Array.isArray(data.stores) ? data.stores : [],
      processes: Array.isArray(data.processes) ? data.processes : [],
      matrix: data.matrix ?? {},
    };
  }, [activeTab, data]);

  const snapshotData = useMemo(() => {
    if (activeTab !== "snapshot" || !data) {
      return { stores: [], processes: [], snapshot: {} };
    }
    return {
      stores: Array.isArray(data.stores) ? data.stores : [],
      processes: Array.isArray(data.processes) ? data.processes : [],
      snapshot: data.snapshot ?? {},
    };
  }, [activeTab, data]);

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
            <BarChart3 className="w-7 h-7 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("storeHealthCompliance")}</h1>
            <p className="text-sm text-muted-foreground">{t("storeHealthComplianceDesc")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {t('refresh')}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={!data}>
            <Download className="w-4 h-4" />
            {t('exportCsv')}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('startDate')}</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('endDate')}</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            {activeTab === "snapshot" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('snapshotDate')}</label>
                <Input type="date" value={snapshotDate} onChange={(e) => setSnapshotDate(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('region')}</label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder={t('region')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allRegions')}</SelectItem>
                  {(filterOptions.regions || []).map((r: string) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('brand')}</label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue placeholder={t('brand')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allBrands')}</SelectItem>
                  {(filterOptions.brands || []).map((b: string) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('department')}</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder={t('department')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allDepartments')}</SelectItem>
                  {(filterOptions.departments || []).map((d: string) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('processTag')}</label>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('tag')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTags')}</SelectItem>
                  {(filterOptions.processTags || []).map((tag: string) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('periodicity')}</label>
              <Select value={periodicity} onValueChange={(v: any) => setPeriodicity(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('daily')}</SelectItem>
                  <SelectItem value="weekly">{t('weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('monthly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeTab === "overview" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('metricType')}</label>
                <Select value={metricType} onValueChange={(v: any) => setMetricType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t('percentage')}</SelectItem>
                    <SelectItem value="count">{t('count')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {activeTab === "tag-analysis" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('groupBy')}</label>
                <Select value={tagDimension} onValueChange={(v: any) => setTagDimension(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="region">{t('region')}</SelectItem>
                    <SelectItem value="brand">{t('brand')}</SelectItem>
                    <SelectItem value="department">{t('department')}</SelectItem>
                    <SelectItem value="processTag">{t('processTag')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={fetchData} className="h-10">{t('apply')}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={activeTab === key ? "default" : "ghost"}
            onClick={() => setActiveTab(key)}
            className="gap-2 rounded-b-none"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t('loadingDashboard')}</p>
        </div>
      ) : data == null ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t('noDataForFilters')}</p>
        </div>
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: t('overallCompliance'), value: `${kpis?.overallCompliance ?? 0}%`, icon: Activity },
                  { label: t('processCompletion'), value: `${kpis?.overallCompletion ?? 0}%`, icon: TrendingUp },
                  { label: t('activeStores'), value: kpis?.activeStores ?? 0, icon: Store },
                  { label: t('submitted'), value: kpis?.totalSubmitted ?? 0, icon: BarChart3 },
                  { label: t('compliant'), value: kpis?.totalCompliant ?? 0, icon: Activity },
                  { label: t('pending'), value: kpis?.pending ?? 0, icon: Grid },
                ].map((kpi) => (
                  <Card key={kpi.label}>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <kpi.icon className="w-4 h-4 text-teal-700" />
                      </div>
                      <div className="text-2xl font-bold">{kpi.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('complianceSubmissionTrends')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {trends.length === 0 ? (
                      <p className="text-sm text-muted-foreground h-64 flex items-center justify-center">{t('noTrendData')}</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="compliancePercentage" name={t('compliancePercent')} stroke={CHART_COLORS[0]} strokeWidth={2} />
                          <Line type="monotone" dataKey="submitted" name={t('submitted')} stroke={CHART_COLORS[1]} strokeWidth={2} />
                          <Line type="monotone" dataKey="compliant" name={t('compliant')} stroke={CHART_COLORS[2]} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('processCompletionMetrics')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {processCompletion.length === 0 ? (
                      <p className="text-sm text-muted-foreground h-64 flex items-center justify-center">{t('noProcessMetrics')}</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={processCompletion} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="compliancePercentage" name={t('compliancePercent')} radius={[0, 4, 4, 0]}>
                            {processCompletion.map((_: any, i: number) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('complianceByRegion')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {regionCompliance.length === 0 ? (
                      <p className="text-sm text-muted-foreground h-64 flex items-center justify-center">{t('noRegionData')}</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={regionCompliance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="compliancePercentage" name={t('compliancePercent')} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t('tagSummary')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tagSummary.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('noTagSummaryData')}</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
                        {tagSummary.map((item: any) => (
                          <div key={item.tag} className="border rounded-lg p-3 space-y-2">
                            <div className="font-medium text-sm truncate">{item.tag}</div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t('completion')}</span>
                              <span className="font-semibold">
                                {item.completion}{metricType === "percentage" ? "%" : ""}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t('compliance')}</span>
                              <Badge variant="outline" className={complianceColor(Number(item.compliance) || 0)}>
                                {item.compliance}{metricType === "percentage" ? "%" : ""}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "all-stores" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('storeComplianceTracking')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('clickStoreForDetails')}</p>
              </CardHeader>
              <CardContent>
                {allStores.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noStorePerformanceData')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase">{t('store')}</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase">{t('region')}</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase">{t('brand')}</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase">{t('department')}</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase">{t('completion')}</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase">{t('compliance')}</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase">{t('submitted')}</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase">{t('expected')}</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {allStores.map((store: any) => (
                          <tr
                            key={store.storeId}
                            className="hover:bg-muted/40 cursor-pointer"
                            onClick={() => openStoreDrillDown(store.storeId)}
                          >
                            <td className="px-3 py-3 font-medium">{storeDisplayName(store)}</td>
                            <td className="px-3 py-3">{store.region}</td>
                            <td className="px-3 py-3">{store.brand}</td>
                            <td className="px-3 py-3">{store.department}</td>
                            <td className="px-3 py-3">{store.completionPercentage}%</td>
                            <td className="px-3 py-3">
                              <Badge variant="outline" className={complianceColor(store.compliancePercentage)}>
                                {store.compliancePercentage}%
                              </Badge>
                            </td>
                            <td className="px-3 py-3">{store.totalSubmitted}</td>
                            <td className="px-3 py-3">{store.totalExpected}</td>
                            <td className="px-3 py-3">
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "heat-map" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('snapshotHeatMap')}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t('heatMapDesc')}
                </p>
              </CardHeader>
              <CardContent>
                {heatMapData.stores.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noHeatMapData')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase sticky left-0 bg-muted/50">{t('store')}</th>
                          {heatMapData.processes.map((proc: any) => {
                            const pid = proc.processId || proc;
                            const name = processDisplayName(proc);
                            return (
                              <th key={pid} className="px-3 py-3 text-left text-xs font-medium uppercase whitespace-nowrap" title={name}>
                                <div className="flex items-center gap-1.5">
                                  {truncateLabel(name, 18)}
                                  {proc.priority ? (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      P{proc.priority}
                                    </Badge>
                                  ) : null}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {heatMapData.stores.map((store: any) => {
                          const storeId = store.storeId || store;
                          return (
                            <tr key={storeId} className="hover:bg-muted/30">
                              <td
                                className="px-3 py-3 font-medium sticky left-0 bg-background cursor-pointer hover:text-teal-700"
                                onClick={() => openStoreDrillDown(storeId)}
                              >
                                {storeDisplayName(store)}
                              </td>
                              {heatMapData.processes.map((proc: any) => {
                                const pid = proc.processId || proc;
                                const cell = heatMapData.matrix[storeId]?.[pid];
                                return (
                                  <td key={pid} className={`px-3 py-3 text-center font-medium ${heatCellClass(cell?.color)}`}>
                                    {cell?.compliancePercentage ?? 0}%
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "snapshot" && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-lg">{t('processStoreSnapshot')}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t('completionStatusByStoreAndProcess')}
                      {snapshotDate ? ` ${t('forDate')} ${snapshotDate}` : ""}
                      {snapshotStoreId ? ` (${t('filteredToOneStore')})` : ""}
                    </p>
                  </div>
                  {snapshotStoreId && (
                    <Button variant="outline" size="sm" onClick={() => setSnapshotStoreId(undefined)}>
                      {t('clearStoreFilter')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {snapshotData.stores.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noSnapshotData')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase sticky left-0 bg-muted/50">{t('store')}</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase">{t('average')}</th>
                          {snapshotData.processes.map((proc: any) => {
                            const pid = proc.processId || proc;
                            const name = processDisplayName(proc);
                            return (
                              <th key={pid} className="px-3 py-3 text-left text-xs font-medium uppercase whitespace-nowrap" title={name}>
                                <div className="flex items-center gap-1.5">
                                  {truncateLabel(name, 18)}
                                  {proc.priority ? (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      P{proc.priority}
                                    </Badge>
                                  ) : null}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {snapshotData.stores.map((store: any) => {
                          const storeId = store.storeId || store;
                          const snap = snapshotData.snapshot[storeId];
                          return (
                            <tr key={storeId}>
                              <td
                                className="px-3 py-3 font-medium sticky left-0 bg-background cursor-pointer hover:text-teal-700"
                                onClick={() => openStoreDrillDown(storeId)}
                              >
                                {storeDisplayName(store)}
                              </td>
                              <td className="px-3 py-3 font-semibold">{snap?.average ?? 0}%</td>
                              {snapshotData.processes.map((proc: any) => {
                                const pid = proc.processId || proc;
                                const cell = snap?.processes?.[pid];
                                return (
                                  <td key={pid} className={`px-3 py-3 text-center ${heatCellClass(cell?.color)}`}>
                                    {cell?.completionPercentage ?? 0}%
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "tag-analysis" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('tagBasedAnalysis')} — {tagDimension === "processTag" ? t('processTag') : tagDimension.charAt(0).toUpperCase() + tagDimension.slice(1)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t('tagAnalysisDesc')}
                  </p>
                </CardHeader>
                <CardContent>
                  {tagItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noTagAnalysisData')}</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={tagItems}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="compliancePercentage" name={t('compliancePercent')} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase">{t('name')}</th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase">{t('stores')}</th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase">{t('submitted')}</th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase">{t('compliant')}</th>
                              <th className="px-3 py-2 text-left text-xs font-medium uppercase">{t('compliance')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {tagItems.map((item: any) => (
                              <tr key={item.name}>
                                <td className="px-3 py-2 font-medium">{item.name}</td>
                                <td className="px-3 py-2">{item.storeCount ?? "—"}</td>
                                <td className="px-3 py-2">{item.totalSubmitted ?? item.totalSubmissions ?? 0}</td>
                                <td className="px-3 py-2">{item.totalCompliant ?? "—"}</td>
                                <td className="px-3 py-2">
                                  <Badge variant="outline" className={complianceColor(item.compliancePercentage ?? item.averageCompliance ?? 0)}>
                                    {item.compliancePercentage ?? item.averageCompliance ?? 0}%
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      <Sheet open={Boolean(drillStoreId)} onOpenChange={(open) => !open && setDrillStoreId(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{humanLabel(storeDetail?.storeName, t('storeDetails'))}</SheetTitle>
            <SheetDescription>
              {[storeDetail?.region, storeDetail?.brand, storeDetail?.department].filter(Boolean).join(" · ") ||
                t('storeLevelCompliance')}
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">{t('loadingStoreDetails')}</p>
          ) : !storeDetail ? (
            <p className="mt-6 text-sm text-muted-foreground">{t('unableToLoadStoreDetails')}</p>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">{t('compliance')}</div>
                  <div className="text-xl font-bold">{storeDetail.compliancePercentage}%</div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">{t('completion')}</div>
                  <div className="text-xl font-bold">{storeDetail.completionPercentage}%</div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">{t('submitted')}</div>
                  <div className="text-xl font-bold">{storeDetail.totalSubmitted}</div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">{t('expected')}</div>
                  <div className="text-xl font-bold">{storeDetail.totalExpected}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">{t('processBreakdown')}</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(storeDetail.processes || []).map((p: any) => (
                    <div key={p.processId} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {p.processName}
                          {p.priority ? (
                            <span className="ml-2 text-xs text-muted-foreground">P{p.priority}</span>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">{p.processTag}</div>
                      </div>
                      <Badge variant="outline" className={complianceColor(p.compliancePercentage)}>
                        {p.compliancePercentage}%
                      </Badge>
                    </div>
                  ))}
                  {(storeDetail.processes || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">{t('noProcessesAssigned')}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">{t('recentSubmissions')}</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(storeDetail.recentSubmissions || []).map((s: any) => (
                    <div key={s.id} className="flex justify-between text-sm border-b pb-2">
                      <span className="truncate mr-2">{s.processName}</span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {s.status}
                        {s.submittedAt ? ` · ${new Date(s.submittedAt).toLocaleDateString()}` : ""}
                      </span>
                    </div>
                  ))}
                  {(storeDetail.recentSubmissions || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">{t('noRecentSubmissions')}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (drillStoreId) viewStoreInSnapshot(drillStoreId);
                  }}
                >
                  {t('viewInSnapshot')}
                </Button>
                <Link href={`/standard-reports/store-report`} className="flex-1">
                  <Button className="w-full">{t('openStoreReport')}</Button>
                </Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}