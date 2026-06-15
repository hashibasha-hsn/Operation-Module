import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Search,
  CalendarIcon,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Settings,
  Filter,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StoreHealth() {
  const [activeTab, setActiveTab] = useState("Executive");
  const [dateRange, setDateRange] = useState({ from: undefined as Date | undefined, to: undefined as Date | undefined });
  const [metricType, setMetricType] = useState("percentage");
  const [tagFilter, setTagFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);

  const tabs = ["Executive", "Snapshot", "Process Tag Insights"];

  const mockData = {
    overallCompliance: 78,
    totalStores: 150,
    activeStores: 142,
    completedProcesses: 1250,
    pendingProcesses: 85,
    complianceTrend: "+5.2%",
    storeHealth: [
      { store: "Store A", compliance: 92, completion: 95 },
      { store: "Store B", compliance: 78, completion: 82 },
      { store: "Store C", compliance: 65, completion: 70 },
      { store: "Store D", compliance: 88, completion: 90 },
      { store: "Store E", compliance: 72, completion: 75 },
    ],
    processCompliance: [
      { process: "Opening Checklist", compliance: 85 },
      { process: "Hygiene Check", compliance: 92 },
      { process: "Closing Checklist", compliance: 78 },
      { process: "Safety Inspection", compliance: 88 },
      { process: "Inventory Check", compliance: 65 },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Store Health & Compliance</h1>
            <p className="text-muted-foreground mt-1">Executive dashboard for store performance</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4" />
            Settings
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

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, "PPP") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.to ? format(dateRange.to, "PPP") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline">Apply</Button>
        </div>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tag Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            <SelectItem value="brand">Brand</SelectItem>
            <SelectItem value="region">Region</SelectItem>
            <SelectItem value="area">Area Manager</SelectItem>
          </SelectContent>
        </Select>

        <Select value={metricType} onValueChange={setMetricType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Metric Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="count">Count</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dashboard Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label>Show/Hide Charts</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Overall Compliance</DropdownMenuItem>
                    <DropdownMenuItem>Store Health</DropdownMenuItem>
                    <DropdownMenuItem>Process Compliance</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between">
                <Label>Graph Ranges</Label>
                <Select defaultValue="auto">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="0-100">0-100%</SelectItem>
                    <SelectItem value="50-100">50-100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Reorder Store Tags</Label>
                <Button variant="outline" size="sm">
                  Reorder
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowSettings(false)}>
                  Save & Exit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockData.overallCompliance}%</div>
            <div className="flex items-center gap-1 mt-2 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">{mockData.complianceTrend}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockData.totalStores}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {mockData.activeStores} active
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockData.completedProcesses}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {mockData.pendingProcesses} pending
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {mockData.complianceTrend}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              vs last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Dashboard Content */}
      {activeTab === "Executive" && (
        <div className="space-y-6">
          {/* Store Health Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Store Health Overview</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">Above 80%</Badge>
                  <Badge variant="outline">60-80%</Badge>
                  <Badge variant="outline">Below 60%</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.storeHealth.map((store) => (
                  <div key={store.store} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium">{store.store}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              store.compliance >= 80 ? 'bg-green-500' :
                              store.compliance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${store.compliance}%` }}
                          />
                        </div>
                        <span className="text-sm w-12">{store.compliance}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Completion: {store.completion}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Process Compliance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Process Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.processCompliance.map((process) => (
                  <div key={process.process} className="flex items-center gap-4">
                    <div className="w-48 text-sm font-medium">{process.process}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              process.compliance >= 80 ? 'bg-green-500' :
                              process.compliance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${process.compliance}%` }}
                          />
                        </div>
                        <span className="text-sm w-12">{process.compliance}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Snapshot Tab */}
      {activeTab === "Snapshot" && (
        <Card>
          <CardHeader>
            <CardTitle>Heat Map View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <PieChart className="w-12 h-12 mx-auto mb-4" />
              <p>Heat map view coming soon</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Tag Insights Tab */}
      {activeTab === "Process Tag Insights" && (
        <Card>
          <CardHeader>
            <CardTitle>Process Tag Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4" />
              <p>Tag-based analysis coming soon</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
