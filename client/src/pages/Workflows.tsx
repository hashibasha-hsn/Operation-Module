import { useState, useEffect } from "react";
import { GATEWAY } from "@/lib/apiConfig";
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
import { Plus, Search, FileText, ClipboardCheck, MoreVertical, Edit, Trash2, Copy, Download, Filter, Upload, History, GitBranch, Save } from "lucide-react";
import { reviewLevelSummary } from "@/lib/reviewConfig";

export default function Workflows() {
  const [activeTab, setActiveTab] = useState("Processes");
  const [processes, setProcesses] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editItem, setEditItem] = useState<any>(null);
  const [timelineItem, setTimelineItem] = useState<any>(null);
  const [childBusyId, setChildBusyId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchProcesses();
    fetchAudits();
  }, []);

  const fetchProcesses = async () => {
    try {
      const response = await fetch(`${GATEWAY}/api/org/processes?organizationId=${encodeURIComponent(getOrganizationId())}`);
      const data = await response.json();
      setProcesses(data || []);
    } catch (err) {
      console.error('Failed to fetch processes:', err);
    }
  };

  const fetchAudits = async () => {
    try {
      const response = await fetch(`${GATEWAY}/api/org/audits?organizationId=${encodeURIComponent(getOrganizationId())}`);
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
      await fetch(`${GATEWAY}/api/org/${endpoint}/${id}`, {
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
      await fetch(`${GATEWAY}/api/org/${endpoint}/${id}`, {
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
      const response = await fetch(`${GATEWAY}/api/org/${endpoint}/${id}`);
      const original = await response.json();
      
      const duplicate = {
        ...original,
        title: `${original.title} (Copy)`,
        status: 'draft',
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        parentId: null,
        statusHistory: undefined,
      };

      await fetch(`${GATEWAY}/api/org/${endpoint}`, {
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

  const openEdit = (item: any, type: 'process' | 'audit') => {
    setEditItem({
      id: item.id,
      type,
      title: item.title,
      description: item.description || '',
      status: item.status,
      frequency: item.frequency || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editItem?.title?.trim()) return;
    setEditSaving(true);
    try {
      const endpoint = editItem.type === 'process' ? 'processes' : 'audits';
      await fetch(`${GATEWAY}/api/org/${endpoint}/${editItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editItem.title.trim(),
          description: editItem.description,
          status: editItem.status,
          frequency: editItem.frequency || null,
        }),
      });
      if (editItem.type === 'process') {
        fetchProcesses();
      } else {
        fetchAudits();
      }
      setEditItem(null);
    } catch (err) {
      console.error('Error editing workflow:', err);
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddChild = async (item: any, type: 'process' | 'audit') => {
    setChildBusyId(item.id);
    try {
      const endpoint = type === 'process' ? 'processes' : 'audits';
      await fetch(`${GATEWAY}/api/org/${endpoint}/${item.id}/child`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (type === 'process') {
        fetchProcesses();
      } else {
        fetchAudits();
      }
    } catch (err) {
      console.error('Error creating child workflow:', err);
    } finally {
      setChildBusyId(null);
    }
  };

  const openTimeline = (item: any) => {
    setTimelineItem(item);
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
                            <DropdownMenuItem onClick={() => openEdit(process, 'process')}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openTimeline(process)}>
                              <History className="w-4 h-4 mr-2" />
                              Status Timeline
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(process.id, 'process')}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAddChild(process, 'process')}
                              disabled={childBusyId === process.id}
                            >
                              <GitBranch className="w-4 h-4 mr-2" />
                              {childBusyId === process.id ? "Adding child..." : "Add child"}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
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
                            <DropdownMenuItem onClick={() => openEdit(audit, 'audit')}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openTimeline(audit)}>
                              <History className="w-4 h-4 mr-2" />
                              Status Timeline
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(audit.id, 'audit')}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAddChild(audit, 'audit')}
                              disabled={childBusyId === audit.id}
                            >
                              <GitBranch className="w-4 h-4 mr-2" />
                              {childBusyId === audit.id ? "Adding child..." : "Add child"}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
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

      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editItem?.type === 'audit' ? 'Audit' : 'Process'}</DialogTitle>
            <DialogDescription>
              Update the title, description, and status of this workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editItem?.title || ''}
                onChange={(e) => setEditItem((prev: any) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editItem?.description || ''}
                onChange={(e) => setEditItem((prev: any) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editItem?.status || 'draft'}
                onValueChange={(value) => setEditItem((prev: any) => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editSaving}>
              <Save className="w-4 h-4 mr-2" />
              {editSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!timelineItem} onOpenChange={(open) => !open && setTimelineItem(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Status Timeline</DialogTitle>
            <DialogDescription>
              {timelineItem?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {(timelineItem?.statusHistory?.length ?? 0) > 0 ? (
              <div className="relative space-y-0">
                {timelineItem.statusHistory.map((entry: any, index: number) => (
                  <div key={index} className="flex gap-3 pb-5">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
                      {index < timelineItem.statusHistory.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Badge variant={entry.status === 'published' ? 'default' : entry.status === 'archived' ? 'destructive' : 'secondary'}>
                        {entry.status}
                      </Badge>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {entry.actor ? `${entry.actor} · ` : ''}{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
