import { useState, useEffect } from "react";
import { getOrganizationId } from '@/lib/authStorage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, FileText, ClipboardCheck, MoreVertical, Edit, Trash2, Copy, Download, QrCode, Link, Filter, Upload } from "lucide-react";
import { reviewLevelSummary } from "@/lib/reviewConfig";

export default function Workflows() {
  const [activeTab, setActiveTab] = useState("Processes");
  const [processes, setProcesses] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchProcesses();
    fetchAudits();
  }, []);

  const fetchProcesses = async () => {
    try {
      const response = await fetch(`http://localhost:3009/api/org/processes?organizationId=${encodeURIComponent(getOrganizationId())}`);
      const data = await response.json();
      setProcesses(data || []);
    } catch (err) {
      console.error('Failed to fetch processes:', err);
    }
  };

  const fetchAudits = async () => {
    try {
      const response = await fetch(`http://localhost:3009/api/org/audits?organizationId=${encodeURIComponent(getOrganizationId())}`);
      const data = await response.json();
      setAudits(data || []);
    } catch (err) {
      console.error('Failed to fetch audits:', err);
    }
  };

  const getReviewSummary = (item: any) => {
    const enabled = item.properties?.processWithReview || item.requiresApproval;
    if (!enabled) return "No review";
    return reviewLevelSummary(item.properties?.reviewConfig ?? { levels: item.reviewLevels ?? 1, assignees: {} });
  };

  const handleToggleStatus = async (id: string, type: 'process' | 'audit', currentStatus: boolean) => {
    try {
      const endpoint = type === 'process' ? 'processes' : 'audits';
      await fetch(`http://localhost:3009/api/org/${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (type === 'process') {
        fetchProcesses();
      } else {
        fetchAudits();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDelete = async (id: string, type: 'process' | 'audit') => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const endpoint = type === 'process' ? 'processes' : 'audits';
      await fetch(`http://localhost:3009/api/org/${endpoint}/${id}`, {
        method: 'DELETE',
      });
      if (type === 'process') {
        fetchProcesses();
      } else {
        fetchAudits();
      }
    } catch (err) {
      console.error('Error deleting workflow:', err);
    }
  };

  const handleDuplicate = async (id: string, type: 'process' | 'audit') => {
    try {
      const endpoint = type === 'process' ? 'processes' : 'audits';
      const response = await fetch(`http://localhost:3009/api/org/${endpoint}/${id}`);
      const original = await response.json();
      
      const duplicate = {
        ...original,
        title: `${original.title} (Copy)`,
        status: 'draft',
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      await fetch(`http://localhost:3009/api/org/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicate),
      });

      if (type === 'process') {
        fetchProcesses();
      } else {
        fetchAudits();
      }
    } catch (err) {
      console.error('Error duplicating workflow:', err);
    }
  };

  const filteredProcesses = processes.filter((p: any) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && p.isActive) ||
                          (statusFilter === 'inactive' && !p.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredAudits = audits.filter((a: any) => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && a.isActive) ||
                          (statusFilter === 'inactive' && !a.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Manage & Track Workflows</h1>
            <p className="text-muted-foreground mt-1">Manage processes and audits</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {["Processes", "Audits", "Drafts", "Completed Submissions"].map((tab) => (
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

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processes.length + audits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processes.filter((p: any) => p.status === 'published').length + 
               audits.filter((a: any) => a.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processes.filter((p: any) => p.status === 'draft').length + 
               audits.filter((a: any) => a.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processes.filter((p: any) => p.status === 'archived').length + 
               audits.filter((a: any) => a.status === 'archived').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows Table */}
      {activeTab === "Processes" && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Assignees</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Stores</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      No processes available
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProcesses.map((process: any) => (
                    <TableRow key={process.id}>
                      <TableCell className="font-medium">{process.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{process.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{process.processTag || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{process.frequency || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={process.status === 'published' ? 'default' : process.status === 'draft' ? 'secondary' : 'outline'}>
                          {process.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={process.isActive}
                          onCheckedChange={() => handleToggleStatus(process.id, 'process', process.isActive)}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{process.assigneeIds?.length || 0} users</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{getReviewSummary(process)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{process.storeIds?.length || 0} stores</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(process.id, 'process')}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <QrCode className="w-4 h-4 mr-2" />
                              QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link className="w-4 h-4 mr-2" />
                              Public Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(process.id, 'process')} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {activeTab === "Audits" && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Pass Threshold</TableHead>
                  <TableHead>Review Levels</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No audits available
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAudits.map((audit: any) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">{audit.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{audit.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{audit.processTag || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{audit.frequency || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={audit.status === 'published' ? 'default' : audit.status === 'draft' ? 'secondary' : 'outline'}>
                          {audit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={audit.isActive}
                          onCheckedChange={() => handleToggleStatus(audit.id, 'audit', audit.isActive)}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{audit.passThreshold || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{getReviewSummary(audit)}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(audit.id, 'audit')}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <QrCode className="w-4 h-4 mr-2" />
                              QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link className="w-4 h-4 mr-2" />
                              Public Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(audit.id, 'audit')} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {activeTab === "Drafts" && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4" />
          <p>Drafts management coming soon</p>
        </div>
      )}

      {activeTab === "Completed Submissions" && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-4" />
          <p>Completed submissions coming soon</p>
        </div>
      )}
    </div>
  );
}
