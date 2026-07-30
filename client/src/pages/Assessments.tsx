import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  Plus,
  Search,
  ClipboardList,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  BarChart3,
} from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation, Link } from "wouter";
import {
  apiAssessmentToDraft,
  clearAssessmentDraftLocal,
  deleteAssessment,
  emptyAssessmentDraft,
  fetchAssessments,
  saveAssessmentDraftLocal,
} from "@/lib/assessmentApi";

type TabKey = "published" | "draft" | "archived";

function formatAssessmentDate(value?: string) {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMM yyyy");
  } catch {
    return "—";
  }
}

function getAssessmentUserCount(assessment: any) {
  const profiles = assessment.assigneeProfiles;
  if (profiles?.assignBy === "designation") {
    return profiles.designationNames?.length ?? 0;
  }
  if (profiles?.assignBy === "profile") {
    return profiles.profileIds?.length ?? 0;
  }
  return assessment.assigneeIds?.length ?? 0;
}

function getAssessmentStoreCount(assessment: any) {
  return assessment.storeIds?.length ?? 0;
}

function getStatusLabel(assessment: any, t: (key: string) => string) {
  if (assessment.status === "published") return t("published");
  if (assessment.status === "archived") return t("archived");
  return t("draft");
}

export default function Assessments() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabKey>("published");
  const [searchTerm, setSearchTerm] = useState("");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const tabs: { key: TabKey; label: string }[] = [
    { key: "published", label: t("published") },
    { key: "draft", label: t("draft") },
    { key: "archived", label: t("archived") },
  ];

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const data = await fetchAssessments();
      setAssessments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const startNewAssessment = () => {
    clearAssessmentDraftLocal();
    saveAssessmentDraftLocal(emptyAssessmentDraft());
    navigate("/assessment-create-form");
  };

  const openAssessmentEditor = (assessment: any) => {
    saveAssessmentDraftLocal(apiAssessmentToDraft(assessment));
    navigate("/assessment-create-form");
  };

  const filteredAssessments = assessments
    .filter((assessment) => assessment.status === activeTab)
    .filter(
      (assessment) =>
        assessment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(assessment.id ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const handleArchiveAssessment = async (id: string) => {
    try {
      await deleteAssessment(id);
      setAssessments((current) =>
        current.map((assessment) =>
          assessment.id === id ? { ...assessment, status: "archived", isActive: false } : assessment,
        ),
      );
    } catch (error) {
      console.error("Failed to archive assessment:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t("assessmentsQuizzes")}</h1>
            <p className="text-muted-foreground mt-1">{t("createAndManage")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/standard-reports/assessment-results">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Results Dashboard
            </Button>
          </Link>
          <Button variant="outline" className="gap-2" onClick={loadAssessments}>
            <RefreshCw className="w-4 h-4" />
            {t("refresh")}
          </Button>
          <Button className="gap-2" onClick={startNewAssessment}>
            <Plus className="w-4 h-4" />
            Assessment
          </Button>
        </div>
      </div>

      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                className={`rounded-t-lg border-b-2 ${
                  activeTab === tab.key
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`${t("search")} ${t("assessments").toLowerCase()}...`}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {t("filter")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t("assessmentsList")}</span>
            <Badge variant="outline">
              {filteredAssessments.length} {t("records")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("loading")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("title")}</TableHead>
                    <TableHead>Creation Date</TableHead>
                    <TableHead>Last modified on</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Stores</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        {t("noDataFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.title}</TableCell>
                        <TableCell>{formatAssessmentDate(assessment.createdAt)}</TableCell>
                        <TableCell>{formatAssessmentDate(assessment.updatedAt)}</TableCell>
                        <TableCell>{getAssessmentUserCount(assessment)}</TableCell>
                        <TableCell>{getAssessmentStoreCount(assessment)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assessment.status === "published"
                                ? "default"
                                : assessment.status === "archived"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {getStatusLabel(assessment, t)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TableActionsMenu>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(
                                  `/standard-reports/assessment-results?assessmentId=${assessment.id}`,
                                )
                              }
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              View Results
                            </DropdownMenuItem>
                            {assessment.status !== "archived" && (
                              <DropdownMenuItem onClick={() => openAssessmentEditor(assessment)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t("edit")}
                              </DropdownMenuItem>
                            )}
                            {assessment.status !== "archived" && (
                              <DropdownMenuItem
                                onClick={() => handleArchiveAssessment(assessment.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t("delete")}
                              </DropdownMenuItem>
                            )}
                          </TableActionsMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
