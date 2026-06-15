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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AssessmentReport() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assessmentId, setAssessmentId] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessmentReport();
  }, [assessmentId, dateFilter, statusFilter]);

  const fetchAssessmentReport = async () => {
    if (!assessmentId) return;
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
        `http://localhost:3001/assessments/reports/assessment-report?assessmentId=${assessmentId}&organizationId=${organizationId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching assessment report:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((result) => {
    const matchesSearch = 
      result.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "passed" && result.passed) ||
      (statusFilter === "failed" && !result.passed);
    return matchesSearch && matchesStatus;
  });

  const getPassBadge = (passed: boolean) => {
    return passed 
      ? <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Passed</Badge>
      : <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Failed</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('assessmentReport')}</h1>
            <p className="text-muted-foreground mt-1">Specific assessment results and performance</p>
          </div>
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
        <Input
          placeholder="Enter Assessment ID"
          value={assessmentId}
          onChange={(e) => setAssessmentId(e.target.value)}
          className="w-48"
        />
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search results..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Assessment Results</span>
            <Badge variant="outline">{filteredResults.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!assessmentId ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Please enter an Assessment ID to view reports</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">{t('noTasksAvailableDateRange')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Time Taken</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-mono text-sm">{result.userId.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium">
                        {result.assessment?.title || 'Unknown Assessment'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{result.score}%</Badge>
                      </TableCell>
                      <TableCell>{getPassBadge(result.passed)}</TableCell>
                      <TableCell>#{result.attemptNumber}</TableCell>
                      <TableCell>
                        {result.startedAt 
                          ? new Date(result.startedAt).toLocaleDateString() 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {result.completedAt 
                          ? new Date(result.completedAt).toLocaleDateString() 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {result.timeTaken 
                          ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
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
  );
}
