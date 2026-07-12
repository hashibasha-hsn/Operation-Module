import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Download, Clock, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ORG_API } from "@/lib/apiConfig";

export default function ActionPointsAdvanceReport() {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionPointIdSearch, setActionPointIdSearch] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchActionPointsAdvanceReport = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organizationId;

      const params = new URLSearchParams({ organizationId });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (actionPointIdSearch) params.append("actionPointId", actionPointIdSearch);

      const response = await fetch(
        `${ORG_API}/action-points/reports/advance-report?${params.toString()}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching action points advance report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionPointsAdvanceReport();
  }, [startDate, endDate, statusFilter]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "on_hold", label: "On Hold" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "rejected", label: "Reject" },
  ];

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      on_hold: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>{status.replace('_', ' ')}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors: Record<string, string> = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
    };
    return <Badge variant="outline" className="capitalize">{priority}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Action Points Advance Report</h1>
            <p className="text-muted-foreground mt-1">Historical action points with status changes</p>
          </div>
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
          <div className="flex flex-wrap gap-4 items-center">
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Point ID</label>
              <Input
                placeholder="Search by ID..."
                value={actionPointIdSearch}
                onChange={(e) => setActionPointIdSearch(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={fetchActionPointsAdvanceReport} className="mt-6">Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : data?.actionPoints?.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No action points found for the selected criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Closed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.actionPoints?.map((ap: any) => (
                    <TableRow key={ap.id}>
                      <TableCell className="font-mono text-sm">{ap.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{ap.title}</TableCell>
                      <TableCell>{getStatusBadge(ap.currentStatus)}</TableCell>
                      <TableCell>{getPriorityBadge(ap.priority)}</TableCell>
                      <TableCell className="text-sm">{ap.assignedTo}</TableCell>
                      <TableCell className="text-sm">{ap.storeId || 'N/A'}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(ap.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(ap.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ap.dueDate ? new Date(ap.dueDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ap.completedAt ? new Date(ap.completedAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ap.closedAt ? new Date(ap.closedAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Showing {data?.actionPoints?.length || 0} records
                </span>
                <Button variant="outline" size="sm">Load More</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
