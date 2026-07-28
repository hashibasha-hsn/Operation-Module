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
  BookOpen,
  Users,
  Trophy,
  ShieldCheck,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type DateFilter,
  exportRowsToCsv,
  fetchLearningOrgReport,
} from "@/lib/reportApi";
import { fetchUsers } from "@/lib/processApi";
import { buildUserNameMap, humanLabel } from "@/lib/displayLabels";
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

type ViewTab = "courses" | "learners" | "assessments" | "compliance";

const CHART_COLORS = ["#7c3aed", "#0d9488", "#2563eb", "#f59e0b"];

function rateClass(value: number) {
  if (value >= 80) return "text-emerald-700 bg-emerald-50";
  if (value >= 60) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

export default function LearningOrgReport() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [viewTab, setViewTab] = useState<ViewTab>("courses");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers(1000)
      .then((users) => setUserNames(buildUserNameMap(users || [])))
      .catch(() => setUserNames({}));
  }, []);

  useEffect(() => {
    fetchData();
  }, [statusFilter, categoryFilter, dateFilter]);

  const userLabel = (id?: string) =>
    id ? humanLabel(userNames[id], "Unknown user") : "—";

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchLearningOrgReport(dateFilter, viewTab, {
        status: statusFilter,
        categoryId: categoryFilter,
        search: searchTerm || undefined,
      });
      setData(result);
    } catch (error) {
      console.error("Error fetching learning org report:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const courses = useMemo(() => {
    const rows = Array.isArray(data?.courses) ? data.courses : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((c: any) =>
      [c.courseTitle, c.category, c.status, c.courseId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, searchTerm]);

  const learners = useMemo(() => {
    const rows = Array.isArray(data?.learners)
      ? data.learners
      : Array.isArray(data?.employees)
        ? data.employees
        : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((l: any) =>
      [l.userId, l.email, l.completedCourses]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, searchTerm]);

  const assessments = useMemo(() => {
    const rows = Array.isArray(data?.assessments) ? data.assessments : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((a: any) =>
      [a.name, a.user, a.status, a.type]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, searchTerm]);

  const compliance = useMemo(() => {
    const rows = Array.isArray(data?.compliance) ? data.compliance : [];
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((r: any) =>
      [r.userId, r.courseTitle, r.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [data, searchTerm]);

  const byCategory = Array.isArray(data?.byCategory) ? data.byCategory : [];
  const trends = Array.isArray(data?.trends) ? data.trends : [];
  const categories = Array.isArray(data?.categories) ? data.categories : [];
  const kpis = data?.kpis || {
    totalCourses: 0,
    totalLearners: 0,
    totalAssignments: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    overdue: 0,
    completionRate: 0,
    avgProgress: 0,
    totalTimeSpent: 0,
    assessmentPassRate: 0,
    avgAssessmentScore: 0,
    complianceRate: 0,
    assessmentCount: 0,
  };
  const statusCounts = data?.statusCounts || {};

  const statusChips = [
    { key: "all", label: "Total", countKey: "total" },
    { key: "completed", label: "Completed", countKey: "completed" },
    { key: "in_progress", label: "In Progress", countKey: "inProgress" },
    { key: "not_started", label: "Not Started", countKey: "notStarted" },
    { key: "overdue", label: "Overdue", countKey: "overdue" },
    { key: "compliant", label: "Compliant", countKey: "compliant" },
    { key: "nonCompliant", label: "Non-Compliant", countKey: "nonCompliant" },
  ];

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (viewTab === "learners") {
      exportRowsToCsv(
        `learning-learners-${stamp}.csv`,
        ["Learner", "Progress %", "Completed", "Assigned", "In Progress", "Overdue", "Time (mins)", "Quiz Avg", "Compliance %"],
        learners.map((l: any) => [
          userLabel(l.userId),
          String(l.progress),
          String(l.completed ?? l.completedCourses),
          String(l.assigned ?? ""),
          String(l.inProgress ?? 0),
          String(l.overdue ?? 0),
          String(l.timeSpent),
          l.avgQuizScore != null ? String(l.avgQuizScore) : "",
          String(l.complianceRate ?? 0),
        ]),
      );
      return;
    }
    if (viewTab === "assessments") {
      exportRowsToCsv(
        `learning-assessments-${stamp}.csv`,
        ["Name", "Type", "User", "Score", "Status", "Attempt", "Time (mins)", "Date"],
        assessments.map((a: any) => [
          a.name,
          a.type,
          humanLabel(a.user, userLabel(a.userId), "—"),
          String(a.score ?? ""),
          a.status,
          String(a.attempt ?? 1),
          String(a.timeTaken ?? 0),
          a.date ? new Date(a.date).toISOString() : "",
        ]),
      );
      return;
    }
    if (viewTab === "compliance") {
      exportRowsToCsv(
        `learning-compliance-${stamp}.csv`,
        ["Learner", "Course", "Status", "Progress %", "Expires", "Overdue", "Compliant"],
        compliance.map((r: any) => [
          userLabel(r.userId),
          r.courseTitle,
          r.status,
          String(r.progress),
          r.expiresAt ? new Date(r.expiresAt).toISOString() : "",
          r.isOverdue ? "Yes" : "No",
          r.isCompliant ? "Yes" : "No",
        ]),
      );
      return;
    }
    exportRowsToCsv(
      `learning-courses-${stamp}.csv`,
      ["Course", "Category", "Assigned", "Completed", "In Progress", "Completion %", "Avg Progress", "Overdue", "Status", "Expires"],
      courses.map((c: any) => [
        c.courseTitle,
        c.category,
        String(c.assigned),
        String(c.completed),
        String(c.inProgress),
        String(c.completionRate),
        String(c.avgProgress),
        String(c.overdue),
        c.status,
        c.expiresAt ? new Date(c.expiresAt).toISOString() : "",
      ]),
    );
  };

  const tabs: { key: ViewTab; label: string; icon: typeof BookOpen }[] = [
    { key: "courses", label: "Course Completion", icon: BookOpen },
    { key: "learners", label: "Learner Progress", icon: Users },
    { key: "assessments", label: "Assessment Performance", icon: Trophy },
    { key: "compliance", label: "Training Compliance", icon: ShieldCheck },
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
          <div className="p-2 rounded-lg bg-violet-50">
            <BookOpen className="w-7 h-7 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("learningReports")}</h1>
            <p className="text-sm text-muted-foreground">{t("learningReportsDesc")}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={loading}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Courses", value: kpis.totalCourses, icon: BookOpen },
          { label: "Learners", value: kpis.totalLearners, icon: Users },
          { label: "Completed", value: kpis.completed, icon: CheckCircle2 },
          { label: "In Progress", value: kpis.inProgress, icon: Clock },
          { label: "Overdue", value: kpis.overdue, icon: AlertTriangle },
          { label: "Completion", value: `${kpis.completionRate}%`, icon: TrendingUp },
          { label: "Avg Progress", value: `${kpis.avgProgress}%`, icon: Activity },
          { label: "Compliance", value: `${kpis.complianceRate}%`, icon: ShieldCheck },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3">
              <kpi.icon className="w-4 h-4 text-violet-600 mb-2" />
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
                    ? "bg-violet-100 text-violet-800 border-violet-200"
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
                  placeholder="Search course, learner, assessment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchData()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44">
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
      ) : viewTab === "learners" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Learner Progress Metrics</span>
              <Badge variant="outline">{learners.length} learners</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {learners.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No learner data</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Learner</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>In Progress</TableHead>
                      <TableHead>Overdue</TableHead>
                      <TableHead>Time (mins)</TableHead>
                      <TableHead>Quiz Avg</TableHead>
                      <TableHead>Compliance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {learners.map((l: any) => (
                      <TableRow key={l.userId}>
                        <TableCell className="font-medium">{userLabel(l.userId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2 w-20">
                              <div
                                className="h-2 rounded-full bg-violet-600"
                                style={{ width: `${l.progress}%` }}
                              />
                            </div>
                            <span className="text-sm">{l.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{l.completedCourses ?? `${l.completed}/${l.assigned}`}</TableCell>
                        <TableCell>{l.inProgress ?? 0}</TableCell>
                        <TableCell className={l.overdue > 0 ? "text-red-600 font-semibold" : ""}>
                          {l.overdue ?? 0}
                        </TableCell>
                        <TableCell>{l.timeSpent}</TableCell>
                        <TableCell>{l.avgQuizScore != null ? `${l.avgQuizScore}%` : "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={rateClass(l.complianceRate ?? 0)}>
                            {l.complianceRate ?? 0}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : viewTab === "assessments" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Submissions", value: kpis.assessmentCount },
              { label: "Pass Rate", value: `${kpis.assessmentPassRate}%` },
              { label: "Avg Score", value: `${kpis.avgAssessmentScore}%` },
              { label: "Time Spent (mins)", value: kpis.totalTimeSpent },
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
                <CardTitle className="text-base">Learning Activity Trends</CardTitle>
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
                      <Line type="monotone" dataKey="started" stroke={CHART_COLORS[2]} strokeWidth={2} />
                      <Line type="monotone" dataKey="completed" stroke={CHART_COLORS[1]} strokeWidth={2} />
                      <Line type="monotone" dataKey="assessments" stroke={CHART_COLORS[0]} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Assessment / Quiz Results</span>
                  <Badge variant="outline">{assessments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assessments.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No assessment data</p>
                ) : (
                  <div className="overflow-x-auto max-h-[280px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assessments.slice(0, 50).map((a: any) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium max-w-[160px] truncate" title={a.name}>
                              {a.name}
                            </TableCell>
                            <TableCell className="max-w-[120px] truncate">{a.user}</TableCell>
                            <TableCell>{a.score}%</TableCell>
                            <TableCell>
                              <Badge variant={a.status === "Passed" ? "default" : "destructive"}>
                                {a.status}
                              </Badge>
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
        </div>
      ) : viewTab === "compliance" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Training Compliance Reporting</span>
              <Badge variant="outline">{compliance.length} assignments</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compliance.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No compliance records</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Learner</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Flag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compliance.map((r: any) => (
                      <TableRow key={r.progressId}>
                        <TableCell className="font-medium">{userLabel(r.userId)}</TableCell>
                        <TableCell>{r.courseTitle}</TableCell>
                        <TableCell className="capitalize">{String(r.status).replace(/_/g, " ")}</TableCell>
                        <TableCell>{r.progress}%</TableCell>
                        <TableCell>
                          {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          {r.isOverdue ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : r.isDueSoon ? (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Due Soon</Badge>
                          ) : r.isCompliant ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Compliant</Badge>
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
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Completion by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground h-56 flex items-center justify-center">No category data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={byCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="completionRate" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Completion %" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Started / Completed Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {trends.length === 0 ? (
                  <p className="text-sm text-muted-foreground h-56 flex items-center justify-center">No trend data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="started" stroke={CHART_COLORS[2]} strokeWidth={2} />
                      <Line type="monotone" dataKey="completed" stroke={CHART_COLORS[1]} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Course Completion Tracking</span>
                <Badge variant="outline">{courses.length} courses</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No courses found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>In Progress</TableHead>
                        <TableHead>Completion</TableHead>
                        <TableHead>Avg Progress</TableHead>
                        <TableHead>Overdue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((c: any) => (
                        <TableRow key={c.courseId}>
                          <TableCell className="font-medium max-w-[220px] truncate" title={c.courseTitle}>
                            {c.courseTitle}
                          </TableCell>
                          <TableCell>{c.category}</TableCell>
                          <TableCell>{c.assigned}</TableCell>
                          <TableCell>{c.completed}</TableCell>
                          <TableCell>{c.inProgress}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={rateClass(c.completionRate)}>
                              {c.completionRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>{c.avgProgress}%</TableCell>
                          <TableCell className={c.overdue > 0 ? "text-red-600 font-semibold" : ""}>
                            {c.overdue}
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
