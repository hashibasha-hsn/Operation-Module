import { useState } from "react";
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
import {
  Search,
  Download,
  Filter,
  FileText,
  AlertCircle,
  Ticket,
  Package,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Calendar,
  User,
} from "lucide-react";

export default function FeatureReports() {
  const [activeReport, setActiveReport] = useState("Process Reports");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const reportTypes = [
    { name: "Process Reports", icon: FileText, description: "View process completion and compliance data" },
    { name: "Action Points Reports", icon: AlertCircle, description: "Track action point status and resolution" },
    { name: "Ticket Reports", icon: Ticket, description: "Analyze ticket trends and performance" },
    { name: "Asset Reports", icon: Package, description: "Monitor asset management and status" },
    { name: "Learning Reports", icon: BookOpen, description: "Review course completion and progress" },
    { name: "Assessment Reports", icon: CheckCircle, description: "View assessment scores and results" },
  ];

  const mockReportData = {
    "Process Reports": [
      { id: "PROC-001", name: "Opening Checklist", store: "Store A", status: "Completed", completion: 95, date: "2024-01-15" },
      { id: "PROC-002", name: "Hygiene Check", store: "Store B", status: "In Progress", completion: 60, date: "2024-01-15" },
      { id: "PROC-003", name: "Closing Checklist", store: "Store C", status: "Pending", completion: 0, date: "2024-01-15" },
      { id: "PROC-004", name: "Safety Inspection", store: "Store A", status: "Completed", completion: 88, date: "2024-01-14" },
      { id: "PROC-005", name: "Inventory Check", store: "Store D", status: "Completed", completion: 72, date: "2024-01-14" },
    ],
    "Action Points Reports": [
      { id: "AP-001", title: "Fix AC Unit", store: "Store A", priority: "High", status: "Open", assignee: "John Doe", dueDate: "2024-01-20" },
      { id: "AP-002", title: "Replace Light Bulb", store: "Store B", priority: "Medium", status: "In Progress", assignee: "Jane Smith", dueDate: "2024-01-18" },
      { id: "AP-003", title: "Clean Storage Area", store: "Store C", priority: "Low", status: "Completed", assignee: "Bob Johnson", dueDate: "2024-01-15" },
      { id: "AP-004", title: "Update Signage", store: "Store A", priority: "Medium", status: "On Hold", assignee: "Alice Brown", dueDate: "2024-01-22" },
    ],
    "Ticket Reports": [
      { id: "TKT-001", title: "Equipment Failure", store: "Store A", priority: "Highest", status: "Open", assignedTo: "John Doe", createdAt: "2024-01-15" },
      { id: "TKT-002", title: "Inventory Discrepancy", store: "Store B", priority: "High", status: "In Progress", assignedTo: "Jane Smith", createdAt: "2024-01-14" },
      { id: "TKT-003", title: "Customer Complaint", store: "Store C", priority: "Medium", status: "Closed", assignedTo: "Bob Johnson", createdAt: "2024-01-13" },
      { id: "TKT-004", title: "Schedule Conflict", store: "Store D", priority: "Low", status: "Completed", assignedTo: "Alice Brown", createdAt: "2024-01-12" },
    ],
    "Asset Reports": [
      { id: "AST-001", name: "Refrigerator Unit", store: "Store A", status: "Active", condition: "Good", lastMaintenance: "2024-01-10" },
      { id: "AST-002", name: "POS Terminal", store: "Store B", status: "Active", condition: "Fair", lastMaintenance: "2024-01-08" },
      { id: "AST-003", name: "Security Camera", store: "Store C", status: "Maintenance", condition: "Poor", lastMaintenance: "2024-01-05" },
      { id: "AST-004", name: "Display Shelf", store: "Store A", status: "Active", condition: "Good", lastMaintenance: "2024-01-12" },
    ],
    "Learning Reports": [
      { id: "LRN-001", course: "Safety Training", user: "John Doe", progress: 100, status: "Completed", completedDate: "2024-01-15" },
      { id: "LRN-002", course: "Customer Service", user: "Jane Smith", progress: 75, status: "In Progress", completedDate: null },
      { id: "LRN-003", course: "Product Knowledge", user: "Bob Johnson", progress: 45, status: "In Progress", completedDate: null },
      { id: "LRN-004", course: "Compliance Training", user: "Alice Brown", progress: 100, status: "Completed", completedDate: "2024-01-14" },
    ],
    "Assessment Reports": [
      { id: "ASM-001", name: "Monthly Quiz", user: "John Doe", score: 85, status: "Passed", date: "2024-01-15" },
      { id: "ASM-002", name: "Safety Test", user: "Jane Smith", score: 92, status: "Passed", date: "2024-01-15" },
      { id: "ASM-003", name: "Product Knowledge Test", user: "Bob Johnson", score: 68, status: "Failed", date: "2024-01-14" },
      { id: "ASM-004", name: "Compliance Exam", user: "Alice Brown", score: 78, status: "Passed", date: "2024-01-13" },
    ],
  };

  const currentData = mockReportData[activeReport as keyof typeof mockReportData] || [];

  const filteredData = currentData.filter((item: any) => {
    const matchesSearch = Object.values(item).some((value: any) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      Completed: "default",
      "In Progress": "secondary",
      Pending: "outline",
      Open: "destructive",
      Closed: "default",
      Active: "default",
      Maintenance: "secondary",
      Passed: "default",
      Failed: "destructive",
      "On Hold": "secondary",
    };
    return <Badge variant={statusColors[status] as any || "outline"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors: Record<string, string> = {
      Highest: "destructive",
      High: "destructive",
      Medium: "default",
      Low: "secondary",
    };
    return <Badge variant={priorityColors[priority] as any || "outline"}>{priority}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Feature Reports</h1>
            <p className="text-muted-foreground mt-1">Module-specific analytics and detailed records</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.name}
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeReport === report.name ? "border-primary border-2" : ""
              }`}
              onClick={() => setActiveReport(report.name)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{report.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
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
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </Button>
      </div>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{activeReport}</span>
            <Badge variant="outline">{filteredData.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  {activeReport === "Process Reports" && (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Date</TableHead>
                    </>
                  )}
                  {activeReport === "Action Points Reports" && (
                    <>
                      <TableHead>Title</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Due Date</TableHead>
                    </>
                  )}
                  {activeReport === "Ticket Reports" && (
                    <>
                      <TableHead>Title</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created At</TableHead>
                    </>
                  )}
                  {activeReport === "Asset Reports" && (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Last Maintenance</TableHead>
                    </>
                  )}
                  {activeReport === "Learning Reports" && (
                    <>
                      <TableHead>Course</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completed Date</TableHead>
                    </>
                  )}
                  {activeReport === "Assessment Reports" && (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </>
                  )}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.id}</TableCell>
                      {activeReport === "Process Reports" && (
                        <>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.store}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2 w-24">
                                <div
                                  className={`h-2 rounded-full ${
                                    item.completion >= 80 ? 'bg-green-500' :
                                    item.completion >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${item.completion}%` }}
                                />
                              </div>
                              <span className="text-sm">{item.completion}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{item.date}</TableCell>
                        </>
                      )}
                      {activeReport === "Action Points Reports" && (
                        <>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{item.store}</TableCell>
                          <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{item.assignee}</TableCell>
                          <TableCell>{item.dueDate}</TableCell>
                        </>
                      )}
                      {activeReport === "Ticket Reports" && (
                        <>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{item.store}</TableCell>
                          <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{item.assignedTo}</TableCell>
                          <TableCell>{item.createdAt}</TableCell>
                        </>
                      )}
                      {activeReport === "Asset Reports" && (
                        <>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.store}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{item.condition}</TableCell>
                          <TableCell>{item.lastMaintenance}</TableCell>
                        </>
                      )}
                      {activeReport === "Learning Reports" && (
                        <>
                          <TableCell className="font-medium">{item.course}</TableCell>
                          <TableCell>{item.user}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2 w-24">
                                <div
                                  className="h-2 rounded-full bg-primary"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <span className="text-sm">{item.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{item.completedDate || "N/A"}</TableCell>
                        </>
                      )}
                      {activeReport === "Assessment Reports" && (
                        <>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.user}</TableCell>
                          <TableCell>
                            <Badge variant={item.score >= 70 ? "default" : "destructive"}>
                              {item.score}%
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{item.date}</TableCell>
                        </>
                      )}
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
