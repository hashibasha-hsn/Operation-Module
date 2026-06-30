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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import { Search, AlertTriangle, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ExpiredSubmissions() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiredSubmissions();
  }, []);

  const fetchExpiredSubmissions = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organizationId;

      const response = await fetch(
        `http://localhost:3001/submissions/reports/expired-submissions?organizationId=${organizationId}`
      );
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching expired submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((submission) => {
    return (
      submission.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.process?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.audit?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.storeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold">{t('expiredSubmissions')}</h1>
            <p className="text-muted-foreground mt-1">Submissions past their due date</p>
          </div>
        </div>
        <Button onClick={fetchExpiredSubmissions} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900">Total Expired Submissions</p>
              <p className="text-2xl font-bold text-red-700">{submissions.length}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search expired submissions..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Expired Submissions</span>
            <Badge variant="destructive">{filteredSubmissions.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">No expired submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Store ID</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-mono text-sm">{submission.id.slice(0, 8)}...</TableCell>
                      <TableCell className="capitalize">{submission.workflowType}</TableCell>
                      <TableCell className="font-medium">
                        {submission.process?.title || submission.audit?.title || 'N/A'}
                      </TableCell>
                      <TableCell>{submission.storeId}</TableCell>
                      <TableCell>{submission.submittedBy}</TableCell>
                      <TableCell>
                        <Badge variant={submission.status === 'new' ? 'secondary' : 'outline'}>
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.dueDate 
                          ? new Date(submission.dueDate).toLocaleDateString() 
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {submission.dueDate ? (
                          <Badge variant="destructive">
                            {getDaysOverdue(submission.dueDate)} days
                          </Badge>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <TableActionsMenu>
                          <DropdownMenuItem>View</DropdownMenuItem>
                        </TableActionsMenu>
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
