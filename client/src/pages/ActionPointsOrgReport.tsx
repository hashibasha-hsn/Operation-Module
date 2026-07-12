import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter, ChevronDown, Settings } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ORG_API } from "@/lib/apiConfig";

export default function ActionPointsOrgReport() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [statusFilter, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organizationId;

      const params = new URLSearchParams({ organizationId });
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(
        `${ORG_API}/action-points/reports/org-report?${params.toString()}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusChips = [
    { key: "all", label: "Total", color: "bg-gray-100 text-gray-800" },
    { key: "on_hold", label: "On Hold", color: "bg-orange-100 text-orange-800" },
    { key: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
    { key: "onTime", label: "On Time", color: "bg-green-100 text-green-800" },
    { key: "open", label: "Open", color: "bg-blue-100 text-blue-800" },
    { key: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
    { key: "overdue", label: "Over Due", color: "bg-red-100 text-red-800" },
    { key: "inProgress", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
    { key: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" },
    { key: "dueToday", label: "Due Today", color: "bg-purple-100 text-purple-800" },
  ];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      on_hold: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Action Points Org Report</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            Column Settings
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {statusChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === chip.key ? chip.color : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {chip.label}
                {data?.statusCounts && (
                  <span className="ml-2 font-bold">
                    {chip.key === "all" ? data.statusCounts.total :
                     chip.key === "onTime" ? data.statusCounts.onTime :
                     chip.key === "overdue" ? data.statusCounts.overdue :
                     chip.key === "dueToday" ? data.statusCounts.dueToday :
                     chip.key === "inProgress" ? data.statusCounts.inProgress :
                     data.statusCounts[chip.key as keyof typeof data.statusCounts] || 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search action points..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Advanced Filters
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button onClick={fetchData}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Points Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : data?.actionPoints?.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No action points found</p>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.actionPoints?.map((ap: any) => (
                    <tr key={ap.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{ap.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-sm font-medium">{ap.title}</td>
                      <td className="px-4 py-3">{getStatusBadge(ap.status)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">{ap.priority}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{ap.assignedTo}</td>
                      <td className="px-4 py-3 text-sm">{ap.storeId || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        {ap.dueDate ? new Date(ap.dueDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(ap.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
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
