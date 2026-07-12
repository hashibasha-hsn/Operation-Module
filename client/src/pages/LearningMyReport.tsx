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
import { Download, User, Trophy, Clock, BookOpen, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ORG_API } from "@/lib/apiConfig";

export default function LearningMyReport() {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningMyReport();
  }, [startDate, endDate]);

  const fetchLearningMyReport = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organizationId;
      const userId = user.id;

      const params = new URLSearchParams({ userId, organizationId });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `${ORG_API}/courses/reports/my-report?${params.toString()}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching learning my report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Learning My Report</h1>
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
            <Button onClick={fetchLearningMyReport} className="mt-6">Apply</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* At-a-glance Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Block */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">My Profile</h3>
                    <p className="text-sm text-muted-foreground">Learner</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rank:</span>
                    <span className="font-medium">#{data.currentUserRank || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Points:</span>
                    <span className="font-medium">{data.keyHighlights?.courseCompletedPercent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Badges:</span>
                    <Badge variant="outline">Master Learner</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Highlights */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Key Highlights</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time Spent</p>
                      <p className="font-semibold">{data.keyHighlights?.timeSpent || 0} mins</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Course Completed</p>
                      <p className="font-semibold">{data.keyHighlights?.courseCompletedPercent || 0}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Quiz Completed</p>
                      <p className="font-semibold">{data.keyHighlights?.quizCompletedPercent || 0}%</p>
                    </div>
                  </div>
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
                  {data.leaderboard?.slice(0, 5).map((user: any) => (
                    <div key={user.userId} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                      <span className="text-sm font-medium w-6">#{user.rank}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.userId.slice(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground">{user.completedCount} completed</p>
                      </div>
                      <span className="text-sm font-semibold">{user.averageProgress}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Your Courses Table */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Your Courses</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Spent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.courses?.map((course: any) => (
                      <TableRow key={course.courseId}>
                        <TableCell className="font-medium">{course.courseTitle}</TableCell>
                        <TableCell className="text-sm">{course.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2 w-24">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${course.progress}%` }}
                              />
                            </div>
                            <span className="text-sm">{course.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{course.timeSpent} mins</TableCell>
                        <TableCell className="text-sm">{course.quizScore || 'N/A'}</TableCell>
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
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No learning data found</p>
        </div>
      )}
    </div>
  );
}
