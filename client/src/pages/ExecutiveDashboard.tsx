import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, BarChart3, Store, Map, Grid, Tag, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchExecutiveDashboard } from "@/lib/reportApi";

export default function ExecutiveDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("org-summary");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [metricType, setMetricType] = useState<"count" | "percentage">("percentage");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setData(null);
    fetchData();
  }, [activeTab, startDate, endDate, tagFilter, metricType]);

  const fetchData = async () => {
    setLoading(true);
    setData(null);
    try {
      const result = await fetchExecutiveDashboard(activeTab, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        tagFilter: tagFilter || undefined,
        metricType,
        periodicity: "daily",
        viewType: "completion",
      });
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const orgSummaryItems = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const allStoresItems = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const processTagItems = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const heatMapData = useMemo(
    () => ({
      processes: Array.isArray(data?.processes) ? data.processes : [],
      stores: Array.isArray(data?.stores) ? data.stores : [],
      matrix: data?.matrix ?? {},
    }),
    [data],
  );

  const snapshotData = useMemo(
    () => ({
      processes: Array.isArray(data?.processes) ? data.processes : [],
      stores: Array.isArray(data?.stores) ? data.stores : [],
      snapshot: data?.snapshot ?? {},
    }),
    [data],
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/reporting">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              {t("reportingAndInsights")}
            </Button>
          </Link>
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t("storeHealthCompliance")}</h1>
            <p className="text-sm text-muted-foreground">{t("storeHealthComplianceDesc")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tag Filter</label>
              <Input
                placeholder="Enter tag..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-40"
              />
            </div>
            {activeTab === "org-summary" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Metric Type</label>
                <Select value={metricType} onValueChange={(v: any) => setMetricType(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={fetchData} className="mt-6">Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "org-summary" ? "default" : "ghost"}
          onClick={() => setActiveTab("org-summary")}
          className="gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Org Summary
        </Button>
        <Button
          variant={activeTab === "all-stores" ? "default" : "ghost"}
          onClick={() => setActiveTab("all-stores")}
          className="gap-2"
        >
          <Store className="w-4 h-4" />
          All Stores
        </Button>
        <Button
          variant={activeTab === "heat-map" ? "default" : "ghost"}
          onClick={() => setActiveTab("heat-map")}
          className="gap-2"
        >
          <Map className="w-4 h-4" />
          Heat Map
        </Button>
        <Button
          variant={activeTab === "snapshot" ? "default" : "ghost"}
          onClick={() => setActiveTab("snapshot")}
          className="gap-2"
        >
          <Grid className="w-4 h-4" />
          Snapshot
        </Button>
        <Button
          variant={activeTab === "process-tag-insights" ? "default" : "ghost"}
          onClick={() => setActiveTab("process-tag-insights")}
          className="gap-2"
        >
          <Tag className="w-4 h-4" />
          Process Tag Insights
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : data !== null ? (
        <Card>
          <CardContent className="p-6">
            {activeTab === "org-summary" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Organization Summary</h3>
                {orgSummaryItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No summary data for the selected filters.</p>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orgSummaryItems.map((item: any) => (
                    <div key={item.tag} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{item.tag}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Completion:</span>
                          <span className="font-semibold">{item.completion}{metricType === 'percentage' ? '%' : ''}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Compliance:</span>
                          <span className="font-semibold">{item.compliance}{metricType === 'percentage' ? '%' : ''}</span>
                        </div>
                        {metricType === 'count' && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Expected:</span>
                            <span className="font-semibold">{item.expected}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            {activeTab === "all-stores" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">All Stores Performance</h3>
                {allStoresItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No store performance data for the selected filters.</p>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion %</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance %</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allStoresItems.map((store: any) => (
                        <tr key={store.storeId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{store.storeId}</td>
                          <td className="px-4 py-3">{store.completionPercentage}%</td>
                          <td className="px-4 py-3">{store.compliancePercentage}%</td>
                          <td className="px-4 py-3">{store.totalSubmitted}</td>
                          <td className="px-4 py-3">{store.totalExpected}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            )}

            {activeTab === "heat-map" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Heat Map</h3>
                {heatMapData.stores.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No heat map data for the selected filters.</p>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                        {heatMapData.processes.map((proc: string) => (
                          <th key={proc} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {proc.slice(0, 8)}...
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {heatMapData.stores.map((storeId: string) => (
                        <tr key={storeId}>
                          <td className="px-4 py-3 font-medium">{storeId}</td>
                          {heatMapData.processes.map((procId: string) => {
                            const cell = heatMapData.matrix[storeId]?.[procId];
                            const bgColor = cell?.color === 'green' ? 'bg-green-100 text-green-800' 
                              : cell?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800';
                            return (
                              <td key={procId} className={`px-4 py-3 text-center ${bgColor}`}>
                                {cell?.compliancePercentage || 0}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            )}

            {activeTab === "snapshot" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Snapshot (Process - Store)</h3>
                {snapshotData.stores.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No snapshot data for the selected filters.</p>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
                        {snapshotData.processes.map((proc: string) => (
                          <th key={proc} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {proc.slice(0, 8)}...
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {snapshotData.stores.map((storeId: string) => (
                        <tr key={storeId}>
                          <td className="px-4 py-3 font-medium">{storeId}</td>
                          <td className="px-4 py-3 font-semibold">{snapshotData.snapshot[storeId]?.average || 0}%</td>
                          {snapshotData.processes.map((procId: string) => {
                            const cell = snapshotData.snapshot[storeId]?.processes[procId];
                            const bgColor = cell?.color === 'green' ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800';
                            return (
                              <td key={procId} className={`px-4 py-3 text-center ${bgColor}`}>
                                {cell?.completionPercentage || 0}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            )}

            {activeTab === "process-tag-insights" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Process Tag Insights</h3>
                {processTagItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No process tag insights for the selected filters.</p>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {processTagItems.map((item: any) => (
                    <div key={item.tag} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{item.tag}</h4>
                      <div className="space-y-2">
                        {item.expectedSubmissions !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Expected:</span>
                            <span className="font-semibold">{item.expectedSubmissions}</span>
                          </div>
                        )}
                        {item.totalSubmissions !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Submitted:</span>
                            <span className="font-semibold">{item.totalSubmissions}</span>
                          </div>
                        )}
                        {item.averageCompliance !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avg Compliance:</span>
                            <span className="font-semibold">{item.averageCompliance}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data found</p>
        </div>
      )}
    </div>
  );
}
