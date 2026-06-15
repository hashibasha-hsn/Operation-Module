import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, BarChart3, PieChart, TrendingUp, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function VisualReport() {
  const { t } = useLanguage();
  const [dateFilter, setDateFilter] = useState("all");
  const [visualData, setVisualData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisualReport();
  }, [dateFilter]);

  const fetchVisualReport = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organizationId;

      let startDate, endDate;
      if (dateFilter === "today") {
        startDate = new Date().toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
      } else if (dateFilter === "week") {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
      } else if (dateFilter === "month") {
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
      }

      const response = await fetch(
        `http://localhost:3001/submissions/reports/visual-report?organizationId=${organizationId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`
      );
      const data = await response.json();
      setVisualData(data);
    } catch (error) {
      console.error("Error fetching visual report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('visualReport')}</h1>
          <p className="text-muted-foreground mt-1">Visual analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : visualData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Submissions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{visualData.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{visualData.completedSubmissions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {visualData.totalSubmissions > 0 
                  ? Math.round((visualData.completedSubmissions / visualData.totalSubmissions) * 100) 
                  : 0}% completion rate
              </p>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{visualData.pendingSubmissions}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          {/* Rejected */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{visualData.rejectedSubmissions}</div>
              <p className="text-xs text-muted-foreground mt-1">Need attention</p>
            </CardContent>
          </Card>

          {/* Process vs Audit */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Workflow Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Process Submissions</span>
                    <span className="font-medium">{visualData.processSubmissions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${visualData.totalSubmissions > 0 ? (visualData.processSubmissions / visualData.totalSubmissions) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Audit Submissions</span>
                    <span className="font-medium">{visualData.auditSubmissions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${visualData.totalSubmissions > 0 ? (visualData.auditSubmissions / visualData.totalSubmissions) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className="text-sm font-medium">{visualData.completedSubmissions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="text-sm font-medium">{visualData.pendingSubmissions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                    <span className="text-sm">Correction</span>
                  </div>
                  <span className="text-sm font-medium">{visualData.correctionSubmissions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm">Rejected</span>
                  </div>
                  <span className="text-sm font-medium">{visualData.rejectedSubmissions}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* By Store */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Submissions by Store</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(visualData.byStore || {}).map(([storeId, count]) => (
                  <div key={storeId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{storeId}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
                {Object.keys(visualData.byStore || {}).length === 0 && (
                  <p className="text-muted-foreground text-sm">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* By Date */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Submissions by Date</CardTitle>
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
                  <p className="text-muted-foreground text-sm">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t('noTasksAvailableDateRange')}</p>
        </div>
      )}
    </div>
  );
}
