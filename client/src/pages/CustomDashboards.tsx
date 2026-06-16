import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BarChart3,
  LineChart,
  PieChart,
  Plus,
  Settings,
  Edit,
  Trash2,
  Filter,
  Download,
  LayoutGrid,
  TrendingUp,
  Activity,
  FileText,
  Ticket,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CustomDashboards() {
  const [activeTab, setActiveTab] = useState("Process & Workflow");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<any>(null);

  const [newDashboard, setNewDashboard] = useState({
    name: "",
    type: "process",
    chartType: "bar",
  });

  const tabs = ["Process & Workflow", "Ticket & Action Point"];

  const mockDashboards: Record<string, any[]> = {
    "Process & Workflow": [],
    "Ticket & Action Point": [],
  };

  const chartTypes = [
    { value: "bar", label: "Bar Chart", icon: BarChart3 },
    { value: "line", label: "Line Chart", icon: LineChart },
    { value: "pie", label: "Pie Chart", icon: PieChart },
  ];

  const getChartIcon = (type: string) => {
    const ChartIcon = chartTypes.find((ct) => ct.value === type)?.icon || BarChart3;
    return <ChartIcon className="w-5 h-5" />;
  };

  const handleCreateDashboard = () => {
    console.log("Creating dashboard:", newDashboard);
    setShowCreateDialog(false);
    setNewDashboard({ name: "", type: "process", chartType: "bar" });
  };

  const handleEditDashboard = () => {
    console.log("Editing dashboard:", selectedDashboard);
    setShowEditDialog(false);
  };

  const handleDeleteDashboard = (id: string) => {
    console.log("Deleting dashboard:", id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Custom Dashboards</h1>
            <p className="text-muted-foreground mt-1">Build your own visualizations and KPIs</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Global Filters
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" />
            New Dashboard
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                className={`rounded-t-lg border-b-2 ${
                  activeTab === tab
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDashboards[activeTab as keyof typeof mockDashboards]?.map((dashboard) => (
          <Card key={dashboard.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getChartIcon(dashboard.chartType)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{dashboard.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {dashboard.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Updated: {dashboard.lastUpdated}
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedDashboard(dashboard);
                      setShowEditDialog(true);
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteDashboard(dashboard.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* KPIs */}
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(dashboard.kpis).map(([key, value]) => (
                    <div key={key} className="text-center p-2 bg-muted rounded">
                      <div className="text-lg font-bold">{value}</div>
                      <div className="text-xs text-muted-foreground capitalize">{key}</div>
                    </div>
                  ))}
                </div>

                {/* Chart Preview */}
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    {getChartIcon(dashboard.chartType)}
                    <p className="text-xs text-muted-foreground mt-2 capitalize">
                      {dashboard.chartType} Chart
                    </p>
                  </div>
                </div>

                <Button variant="outline" className="w-full" size="sm">
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Dashboard Card */}
        <Card
          className="border-dashed hover:border-primary cursor-pointer transition-colors"
          onClick={() => setShowCreateDialog(true)}
        >
          <CardContent className="flex flex-col items-center justify-center h-full py-12">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Create New Dashboard</p>
            <p className="text-xs text-muted-foreground mt-1">
              Build custom visualizations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Dashboard Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
            <DialogDescription>
              Build a custom dashboard with your preferred chart type and data source.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Dashboard Name *</Label>
              <Input
                id="name"
                placeholder="Enter dashboard name"
                value={newDashboard.name}
                onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Data Source</Label>
              <Select
                value={newDashboard.type}
                onValueChange={(value) => setNewDashboard({ ...newDashboard, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="process">Process</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="actionPoint">Action Point</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="chartType">Chart Type</Label>
              <Select
                value={newDashboard.chartType}
                onValueChange={(value) => setNewDashboard({ ...newDashboard, chartType: value })}
              >
                <SelectTrigger id="chartType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDashboard}>
              Create Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dashboard Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dashboard</DialogTitle>
            <DialogDescription>
              Modify dashboard settings and configuration.
            </DialogDescription>
          </DialogHeader>
          {selectedDashboard && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editName">Dashboard Name</Label>
                <Input
                  id="editName"
                  defaultValue={selectedDashboard.name}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editChartType">Chart Type</Label>
                <Select defaultValue={selectedDashboard.chartType}>
                  <SelectTrigger id="editChartType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chartTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Auto-KPIs</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Completion Rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Compliance Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Pending Items</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDashboard}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
