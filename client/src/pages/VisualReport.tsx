import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, BarChart3, PieChart, TrendingUp, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { type DateFilter, exportRowsToCsv, fetchVisualReport } from "@/lib/reportApi";
import { fetchEntities } from "@/lib/processApi";
import { buildStoreNameMap, humanLabel } from "@/lib/displayLabels";

export default function VisualReport() {
  const { t } = useLanguage();
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [visualData, setVisualData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});

  const storeLabel = (id?: string) => (id ? humanLabel(storeNames[id], "—") : "—");

  const fetchVisualReportData = async () => {
    setLoading(true);
    try {
      const data = await fetchVisualReport(dateFilter);
      setVisualData(data);
    } catch (error) {
      console.error("Error fetching visual report:", error);
      setVisualData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities()
      .then((entities: any[]) => {
        setStoreNames(buildStoreNameMap(entities || []));
      })
      .catch(() => setStoreNames({}));
  }, []);

  useEffect(() => {
    fetchVisualReportData();
  }, [dateFilter]);

  const handleExport = () => {
    if (!visualData) return;
    exportRowsToCsv(
      "visual-report-summary.csv",
      ["Metric", "Value"],
      [
        ["Total Submissions", String(visualData.totalSubmissions ?? 0)],
        ["Completed", String(visualData.completedSubmissions ?? 0)],
        ["Pending", String(visualData.pendingSubmissions ?? 0)],
        ["Rejected", String(visualData.rejectedSubmissions ?? 0)],
        ["Process Submissions", String(visualData.processSubmissions ?? 0)],
        ["Audit Submissions", String(visualData.auditSubmissions ?? 0)],
      ],
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/reporting">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              {t("reportingAndInsights")}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t("visualReport")}</h1>
            <p className="text-muted-foreground mt-1">{t("visualReportDesc")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport} disabled={!visualData}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("dateRange")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTime")}</SelectItem>
            <SelectItem value="today">{t("today")}</SelectItem>
            <SelectItem value="week">{t("thisWeek")}</SelectItem>
            <SelectItem value="month">{t("thisMonth")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : visualData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {t("totalSubmissions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{visualData.totalSubmissions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t("completed")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{visualData.completedSubmissions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {visualData.totalSubmissions > 0
                  ? Math.round((visualData.completedSubmissions / visualData.totalSubmissions) * 100)
                  : 0}
                % {t("completionRate").toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t("pending")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{visualData.pendingSubmissions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                {t("rejected")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{visualData.rejectedSubmissions}</div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{t("workflowTypeDistribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("process")}</span>
                    <span className="font-medium">{visualData.processSubmissions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          visualData.totalSubmissions > 0
                            ? (visualData.processSubmissions / visualData.totalSubmissions) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("audit")}</span>
                    <span className="font-medium">{visualData.auditSubmissions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${
                          visualData.totalSubmissions > 0
                            ? (visualData.auditSubmissions / visualData.totalSubmissions) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{t("statusDistribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm">{t("completed")}</span>
                  </div>
                  <span className="text-sm font-medium">{visualData.completedSubmissions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span className="text-sm">{t("pending")}</span>
                  </div>
                  <span className="text-sm font-medium">{visualData.pendingSubmissions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                    <span className="text-sm">{t("correction")}</span>
                  </div>
                  <span className="text-sm font-medium">{visualData.correctionSubmissions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm">{t("rejected")}</span>
                  </div>
                  <span className="text-sm font-medium">{visualData.rejectedSubmissions}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{t("submissionsByStore")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(visualData.byStore || {}).map(([storeId, count]) => (
                  <div key={storeId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{storeLabel(storeId)}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
                {Object.keys(visualData.byStore || {}).length === 0 && (
                  <p className="text-muted-foreground text-sm">{t("noDataAvailable")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{t("submissionsByDate")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(visualData.byDate || {})
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([date, count]) => (
                    <div key={date} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{date}</span>
                      <Badge variant="outline">{count as number}</Badge>
                    </div>
                  ))}
                {Object.keys(visualData.byDate || {}).length === 0 && (
                  <p className="text-muted-foreground text-sm">{t("noDataAvailable")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("noTasksAvailableDateRange")}</p>
        </div>
      )}
    </div>
  );
}
