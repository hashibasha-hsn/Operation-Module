import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Download,
  Search,
  Trophy,
  Users,
  XCircle,
  Percent,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  type DateFilter,
  exportRowsToCsv,
  fetchAssessmentAnalytics,
  fetchAssessmentComparison,
  fetchAssessments,
  fetchEntities,
} from "@/lib/reportApi";
import { buildStoreNameMap, humanLabel } from "@/lib/displayLabels";

function formatDuration(seconds?: number | null) {
  if (!seconds && seconds !== 0) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function AssessmentResultsDashboard() {
  const search = useSearch();
  const initialAssessmentId = useMemo(() => {
    try {
      return new URLSearchParams(search).get("assessmentId") || "all";
    } catch {
      return "all";
    }
  }, [search]);

  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [assessmentFilter, setAssessmentFilter] = useState(initialAssessmentId);
  const [compareMode, setCompareMode] = useState<"best" | "latest">("best");
  const [searchTerm, setSearchTerm] = useState("");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialAssessmentId && initialAssessmentId !== "all") {
      setAssessmentFilter(initialAssessmentId);
    }
  }, [initialAssessmentId]);

  useEffect(() => {
    fetchAssessments()
      .then((rows) => setAssessments(Array.isArray(rows) ? rows : []))
      .catch(() => setAssessments([]));
    fetchEntities()
      .then((entities) => setStoreNames(buildStoreNameMap(entities || [])))
      .catch(() => setStoreNames({}));
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [dateFilter, assessmentFilter]);

  useEffect(() => {
    if (assessmentFilter === "all") {
      setComparison(null);
      return;
    }
    loadComparison();
  }, [assessmentFilter, compareMode]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await fetchAssessmentAnalytics(
        dateFilter,
        assessmentFilter === "all" ? undefined : assessmentFilter,
      );
      setAnalytics(data);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to load assessment analytics");
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const loadComparison = async () => {
    try {
      const data = await fetchAssessmentComparison(assessmentFilter, compareMode);
      setComparison(data);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to load candidate comparison");
      setComparison(null);
    }
  };

  const kpis = analytics?.kpis || {};
  const storeLabel = (storeId?: string) =>
    storeId ? humanLabel(storeNames[storeId], "N/A") : "N/A";
  const candidateLabel = (row: any) =>
    humanLabel(row?.userName, row?.userEmail, "Unknown user");

  const filteredRecent = useMemo(() => {
    const rows = Array.isArray(analytics?.recentResults) ? analytics.recentResults : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((row: any) =>
      [row.userName, row.userId, row.assessmentTitle, row.storeId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [analytics, searchTerm]);

  const filteredCandidates = useMemo(() => {
    const rows = Array.isArray(comparison?.candidates) ? comparison.candidates : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((row: any) =>
      [row.userName, row.userId, row.storeId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [comparison, searchTerm]);

  const exportAnalytics = () => {
    exportRowsToCsv(
      "assessment-results.csv",
      [
        "Candidate",
        "Assessment",
        "Score %",
        "Result",
        "Attempt",
        "Store",
        "Completed",
        "Time Taken",
      ],
      filteredRecent.map((row: any) => [
        candidateLabel(row),
        row.assessmentTitle || "",
        String(row.percentage ?? 0),
        row.passed ? "Passed" : "Failed",
        String(row.attemptNumber ?? 1),
        storeLabel(row.storeId),
        row.completedAt ? new Date(row.completedAt).toLocaleString() : "",
        formatDuration(row.timeTaken),
      ]),
    );
  };

  const exportComparison = () => {
    if (!comparison) return;
    exportRowsToCsv(
      "candidate-comparison.csv",
      [
        "Rank",
        "Candidate",
        "Store",
        "Attempts",
        "Best %",
        "Latest %",
        "Selected %",
        "Pass/Fail",
        "Time Taken",
      ],
      filteredCandidates.map((row: any) => [
        String(row.rank),
        candidateLabel(row),
        storeLabel(row.storeId),
        String(row.attempts),
        String(row.bestPercentage),
        String(row.latestPercentage),
        String(row.percentage),
        row.passed ? "Passed" : "Failed",
        formatDuration(row.timeTaken),
      ]),
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/reporting">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Assessment Results Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Pass/fail reporting, score analytics, and candidate performance comparison.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-1" />
            Export Results
          </Button>
          <Link href="/standard-reports/assessment-org-report">
            <Button variant="outline">Org Report</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assessmentFilter} onValueChange={setAssessmentFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Assessment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assessments</SelectItem>
            {assessments.map((assessment) => (
              <SelectItem key={assessment.id} value={assessment.id}>
                {assessment.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search candidates or assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          Loading assessment analytics...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Completed Attempts</p>
                  <p className="text-2xl font-bold">{kpis.completedAttempts || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Pass Rate</p>
                  <p className="text-2xl font-bold">{kpis.passRate || 0}%</p>
                  <p className="text-xs text-muted-foreground">
                    {kpis.passed || 0} passed / {kpis.failed || 0} failed
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Percent className="w-8 h-8 text-violet-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{kpis.avgScore || 0}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Candidates</p>
                  <p className="text-2xl font-bold">{kpis.uniqueCandidates || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    Avg time {formatDuration(kpis.avgTimeTaken)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pass / Fail Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {(analytics?.trends || []).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No completed attempts in this range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="passed" stroke="#059669" name="Passed" />
                      <Line type="monotone" dataKey="failed" stroke="#dc2626" name="Failed" />
                      <Line type="monotone" dataKey="avgScore" stroke="#7c3aed" name="Avg Score" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.scoreDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" name="Candidates" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assessment Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Passed</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Pass Rate</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(analytics?.byAssessment || []).map((row: any) => (
                    <TableRow key={row.assessmentId}>
                      <TableCell className="font-medium">{row.title}</TableCell>
                      <TableCell>{row.attempts}</TableCell>
                      <TableCell>{row.passed}</TableCell>
                      <TableCell>{row.failed}</TableCell>
                      <TableCell>
                        <Badge variant={row.passRate >= 70 ? "default" : "destructive"}>
                          {row.passRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>{row.avgScore}%</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAssessmentFilter(row.assessmentId)}
                        >
                          Compare
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!(analytics?.byAssessment || []).length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No assessment results yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {assessmentFilter !== "all" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Candidate Performance Comparison
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {comparison?.assessment?.title || "Selected assessment"} · Passing score{" "}
                    {comparison?.assessment?.passingScore ?? 0}%
                  </p>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={compareMode}
                    onValueChange={(v) => setCompareMode(v as "best" | "latest")}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best">Best attempt</SelectItem>
                      <SelectItem value="latest">Latest attempt</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={exportComparison}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Candidates</p>
                    <p className="text-xl font-semibold">
                      {comparison?.summary?.candidates || 0}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Pass Rate</p>
                    <p className="text-xl font-semibold">
                      {comparison?.summary?.passRate || 0}%
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                    <p className="text-xl font-semibold">
                      {comparison?.summary?.avgScore || 0}%
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Top Score</p>
                    <p className="text-xl font-semibold">
                      {comparison?.summary?.topScore || 0}%
                    </p>
                  </div>
                </div>

                <div className="h-64">
                  {(filteredCandidates || []).length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No candidates to compare for this assessment.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredCandidates.slice(0, 12).map((c: any) => ({
                          name: candidateLabel(c).slice(0, 18),
                          score: c.percentage,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#0d9488" name="Score %" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Best %</TableHead>
                      <TableHead>Latest %</TableHead>
                      <TableHead>Selected %</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((row: any) => (
                      <TableRow key={row.userId}>
                        <TableCell>#{row.rank}</TableCell>
                        <TableCell className="font-medium">
                          {candidateLabel(row)}
                        </TableCell>
                        <TableCell>{storeLabel(row.storeId)}</TableCell>
                        <TableCell>{row.attempts}</TableCell>
                        <TableCell>{row.bestPercentage}%</TableCell>
                        <TableCell>{row.latestPercentage}%</TableCell>
                        <TableCell>{row.percentage}%</TableCell>
                        <TableCell>
                          {row.passed ? (
                            <Badge className="bg-emerald-100 text-emerald-800">Passed</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Failed</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDuration(row.timeTaken)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecent.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell>{candidateLabel(row)}</TableCell>
                      <TableCell className="font-medium">{row.assessmentTitle}</TableCell>
                      <TableCell>{row.percentage}%</TableCell>
                      <TableCell>
                        {row.passed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" /> Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700">
                            <XCircle className="w-4 h-4" /> Failed
                          </span>
                        )}
                      </TableCell>
                      <TableCell>#{row.attemptNumber}</TableCell>
                      <TableCell>{storeLabel(row.storeId)}</TableCell>
                      <TableCell>
                        {row.completedAt
                          ? new Date(row.completedAt).toLocaleString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(row.timeTaken)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredRecent.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No recent completed results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
