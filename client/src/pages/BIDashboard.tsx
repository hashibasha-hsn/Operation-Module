import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  LayoutGrid,
  Ticket,
  CheckSquare,
  BarChart3,
  LineChart,
  PieChart,
  Table,
  Gauge,
} from "lucide-react";
import { ORG_API } from "@/lib/apiConfig";

export default function BIDashboard() {
  const [activeTab, setActiveTab] = useState<"process-workflow" | "ticket" | "action-point">("process-workflow");
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "view">("grid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    type: "process-workflow" as "process-workflow" | "ticket" | "action-point",
    includeActionPoints: false,
    ticketType: "normal" as "normal" | "asset",
    processIds: [] as string[],
    ownerIds: [] as string[],
    assigneeIds: [] as string[],
    readOnlyAssigneeIds: [] as string[],
  });

  useEffect(() => {
    fetchDashboards();
  }, [activeTab]);

  const fetchDashboards = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organizationId;

      const response = await fetch(
        `${ORG_API}/bi-dashboard?organizationId=${organizationId}&type=${activeTab}`
      );
      const data = await response.json();
      setDashboards(data);
    } catch (error) {
      console.error("Error fetching dashboards:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (dashboardId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `${ORG_API}/bi-dashboard/${dashboardId}/data?${params.toString()}`
      );
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const organizationId = user.organizationId;

      const response = await fetch(`${ORG_API}/bi-dashboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          organizationId,
          createdBy: user.id,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          title: "",
          type: activeTab,
          includeActionPoints: false,
          ticketType: "normal",
          processIds: [],
          ownerIds: [user.id],
          assigneeIds: [],
          readOnlyAssigneeIds: [],
        });
        fetchDashboards();
      }
    } catch (error) {
      console.error("Error creating dashboard:", error);
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this dashboard?")) {
      try {
        await fetch(`${ORG_API}/bi-dashboard/${id}`, {
          method: "DELETE",
        });
        fetchDashboards();
      } catch (error) {
        console.error("Error deleting dashboard:", error);
      }
    }
  };

  const handleViewDashboard = (dashboard: any) => {
    setSelectedDashboard(dashboard);
    setViewMode("view");
    fetchDashboardData(dashboard.id);
  };

  const handleBackToGrid = () => {
    setSelectedDashboard(null);
    setViewMode("grid");
    setDashboardData(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">BI Dashboard</h1>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Dashboard
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "process-workflow" ? "default" : "ghost"}
          onClick={() => setActiveTab("process-workflow")}
          className="gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Process & Workflow
        </Button>
        <Button
          variant={activeTab === "ticket" ? "default" : "ghost"}
          onClick={() => setActiveTab("ticket")}
          className="gap-2"
        >
          <Ticket className="w-4 h-4" />
          Ticket
        </Button>
        <Button
          variant={activeTab === "action-point" ? "default" : "ghost"}
          onClick={() => setActiveTab("action-point")}
          className="gap-2"
        >
          <CheckSquare className="w-4 h-4" />
          Action Point
        </Button>
      </div>

      {viewMode === "grid" ? (
        /* Dashboard Grid */
        <Card>
          <CardHeader>
            <CardTitle>Dashboards</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : dashboards.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No dashboards found. Create one to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Modified</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Process Count</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Charts</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboards.map((dashboard) => (
                      <tr key={dashboard.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{dashboard.title}</td>
                        <td className="px-4 py-3">
                          {new Date(dashboard.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{dashboard.processIds?.length || 0}</td>
                        <td className="px-4 py-3">{dashboard.chartsCount || 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDashboard(dashboard)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedDashboard(dashboard);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDashboard(dashboard.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Dashboard View */
        <div className="space-y-4">
          {/* View Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleBackToGrid}>
                ← Back
              </Button>
              <h2 className="text-xl font-semibold">{selectedDashboard?.title}</h2>
            </div>
            <div className="flex gap-2">
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
              <Button onClick={() => fetchDashboardData(selectedDashboard?.id)}>
                Apply
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Dashboard Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : dashboardData ? (
            <div className="space-y-6">
              {/* KPI Cards */}
              {dashboardData.kpis && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.entries(dashboardData.kpis).map(([key, value]) => (
                    <Card key={key}>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-2xl font-bold">{value as string}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Process-wise Data */}
              {dashboardData.processWiseData && dashboardData.processWiseData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Process-wise Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Process</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {dashboardData.processWiseData.map((item: any) => (
                            <tr key={item.processName} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{item.processName}</td>
                              <td className="px-4 py-3">{item.total}</td>
                              <td className="px-4 py-3">{item.completed}</td>
                              <td className="px-4 py-3">{item.pending}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Time Series Data */}
              {dashboardData.timeSeriesData && dashboardData.timeSeriesData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Time Series</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Closed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {dashboardData.timeSeriesData.map((item: any) => (
                            <tr key={item.date} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{item.date}</td>
                              <td className="px-4 py-3">{item.created}</td>
                              <td className="px-4 py-3">{item.completed}</td>
                              <td className="px-4 py-3">{item.closed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Priority-wise Data */}
              {dashboardData.priorityWiseData && dashboardData.priorityWiseData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Priority-wise Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Open</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Progress</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Closed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {dashboardData.priorityWiseData.map((item: any) => (
                            <tr key={item.priority} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium capitalize">{item.priority}</td>
                              <td className="px-4 py-3">{item.total}</td>
                              <td className="px-4 py-3">{item.open}</td>
                              <td className="px-4 py-3">{item.inProgress}</td>
                              <td className="px-4 py-3">{item.completed}</td>
                              <td className="px-4 py-3">{item.closed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Points Data */}
              {dashboardData.actionPointsData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Action Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{dashboardData.actionPointsData.total}</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Open</p>
                        <p className="text-2xl font-bold">{dashboardData.actionPointsData.open}</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">In Progress</p>
                        <p className="text-2xl font-bold">{dashboardData.actionPointsData.inProgress}</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold">{dashboardData.actionPointsData.completed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </div>
      )}

      {/* Create Dashboard Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter dashboard title"
              />
            </div>

            {activeTab === "process-workflow" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeActionPoints"
                  checked={formData.includeActionPoints}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, includeActionPoints: checked as boolean })
                  }
                />
                <Label htmlFor="includeActionPoints">Include Action Points</Label>
              </div>
            )}

            {activeTab === "ticket" && (
              <div className="space-y-2">
                <Label htmlFor="ticketType">Ticket Type</Label>
                <Select
                  value={formData.ticketType}
                  onValueChange={(value: any) => setFormData({ ...formData, ticketType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal Ticket</SelectItem>
                    <SelectItem value="asset">Asset Ticket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="processIds">Process IDs (comma-separated)</Label>
              <Input
                id="processIds"
                value={formData.processIds.join(",")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    processIds: e.target.value.split(",").map((id) => id.trim()),
                  })
                }
                placeholder="Enter process IDs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDashboard}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
