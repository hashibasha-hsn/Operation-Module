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
import { Download, Users, Clock, BookOpen, Trophy, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { humanLabel } from "@/lib/displayLabels";
import { fetchLearningTeamReport as fetchLearningTeamReportApi } from "@/lib/reportApi";

function employeeDisplayName(employee: any) {
  return humanLabel(employee.name, employee.userName, employee.fullName, employee.email, "—");
}

export default function LearningTeamReport() {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningTeamReport();
  }, [startDate, endDate]);

  const fetchLearningTeamReport = async () => {
    setLoading(true);
    try {
      const result = await fetchLearningTeamReportApi({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(result);
    } catch (error) {
      console.error("Error fetching learning team report:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Learning Team Report</h1>
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
            <Button onClick={fetchLearningTeamReport} className="mt-6">Apply</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Team Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Team Time Spent</p>
                    <p className="font-semibold">{data.teamProgressSummary?.timeSpent || 0} mins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Courses Completed</p>
                    <p className="font-semibold">{data.teamProgressSummary?.coursesCompleted || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quiz Score</p>
                    <p className="font-semibold">{data.teamProgressSummary?.quizScore || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* My Team Employee Grid */}
            <Card className="md:col-span-2">
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">My Team</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed Courses</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Spent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.employees?.map((employee: any) => (
                        <TableRow key={employee.userId}>
                          <TableCell className="font-medium">{employeeDisplayName(employee)}</TableCell>
                          <TableCell className="text-sm">{employee.supervisor}</TableCell>
                          <TableCell className="text-sm">{employee.role}</TableCell>
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
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Leaderboard</h3>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                <div className="space-y-2">
                  {data.leaderboard?.map((user: any, index: number) => (
                    <div key={user.userId} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                      <span className="text-sm font-medium w-6">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{employeeDisplayName(user)}</p>
                        <p className="text-xs text-muted-foreground">{user.completedCourses} completed</p>
                      </div>
                      <span className="text-sm font-semibold">{user.progress}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No team data found</p>
        </div>
      )}
    </div>
  );
}
