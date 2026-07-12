import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Download, Building2, BookOpen, Users, Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ORG_API } from "@/lib/apiConfig";

export default function LearningOrgReport() {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("courses");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningOrgReport();
  }, [activeTab, startDate, endDate]);

  const fetchLearningOrgReport = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organizationId;

      const params = new URLSearchParams({ organizationId, tab: activeTab });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `${ORG_API}/courses/reports/org-report?${params.toString()}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching learning org report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Learning Org Report</h1>
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
          <div className="flex gap-4 items-center">
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
            <Button onClick={fetchLearningOrgReport} className="mt-6">Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "courses" ? "default" : "ghost"}
          onClick={() => setActiveTab("courses")}
          className="gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Courses
        </Button>
        <Button
          variant={activeTab === "employees" ? "default" : "ghost"}
          onClick={() => setActiveTab("employees")}
          className="gap-2"
        >
          <Users className="w-4 h-4" />
          Employees
        </Button>
        <Button
          variant={activeTab === "quiz" ? "default" : "ghost"}
          onClick={() => setActiveTab("quiz")}
          className="gap-2"
        >
          <Trophy className="w-4 h-4" />
          Quiz
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : data ? (
        <Card>
          <CardContent className="p-0">
            {activeTab === "courses" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Files</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Launch Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.courses?.map((course: any) => (
                      <TableRow key={course.courseId}>
                        <TableCell className="font-medium">{course.courseTitle}</TableCell>
                        <TableCell className="text-sm">{course.files}</TableCell>
                        <TableCell className="text-sm">{course.category}</TableCell>
                        <TableCell className="text-sm">{course.launchDate ? new Date(course.launchDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={course.status === 'Active' ? 'default' : 'secondary'}>
                            {course.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === "employees" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed Courses</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.employees?.map((employee: any) => (
                      <TableRow key={employee.userId}>
                        <TableCell className="font-medium">{employee.userId.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm">{employee.email}</TableCell>
                        <TableCell className="text-sm">{employee.designation}</TableCell>
                        <TableCell className="text-sm">{employee.supervisor}</TableCell>
                        <TableCell className="text-sm">{employee.storeName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2 w-24">
                              <div className="h-2 rounded-full bg-primary" style={{ width: `${employee.progress}%` }} />
                            </div>
                            <span className="text-sm">{employee.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{employee.completedCourses}</TableCell>
                        <TableCell className="text-sm">{employee.timeSpent} mins</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === "quiz" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz Submission ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ended At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempt</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitter Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Taken</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.quizSubmissions?.map((quiz: any) => (
                      <TableRow key={quiz.quizSubmissionId}>
                        <TableCell className="font-mono text-sm">{quiz.quizSubmissionId.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm">{new Date(quiz.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm">{quiz.startedAt ? new Date(quiz.startedAt).toLocaleString() : 'N/A'}</TableCell>
                        <TableCell className="text-sm">{quiz.endedAt ? new Date(quiz.endedAt).toLocaleString() : 'N/A'}</TableCell>
                        <TableCell className="text-sm">{quiz.attempt}</TableCell>
                        <TableCell className="text-sm">{quiz.storeId}</TableCell>
                        <TableCell className="text-sm">{quiz.submittedBy?.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm">{quiz.submitterEmail}</TableCell>
                        <TableCell className="text-sm">{quiz.employeeId?.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm">{quiz.timeTaken} mins</TableCell>
                        <TableCell className="text-sm">{quiz.totalScore}%</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
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
