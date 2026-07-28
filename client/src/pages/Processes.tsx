import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, FileText, Settings, Users, Building2, Edit, Trash2, Play, Archive } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import { getOrganizationId, getCurrentUserId, getStoredUser } from "@/lib/authStorage";

const ORG_API = import.meta.env.VITE_ORG_API || "http://localhost:3009/api/org";
const USER_API = import.meta.env.VITE_USER_API || "http://localhost:3009/api/user";

export default function Processes() {
  const [processes, setProcesses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("List");
  const [processSubTab, setProcessSubTab] = useState("Details");
  const [processData, setProcessData] = useState({
    title: "",
    description: "",
    processTag: "",
    frequency: "",
    requiresApproval: false,
    assigneeIds: [] as string[],
    storeIds: [] as string[],
  });
  const [sections, setSections] = useState<any[]>([]);
  const [currentSection, setCurrentSection] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const organizationId = getOrganizationId();

  useEffect(() => {
    fetchProcesses();
    fetchUsers();
    fetchEntities();
  }, [organizationId]);

  const fetchProcesses = async () => {
    try {
      const response = await fetch(
        `${ORG_API}/processes?organizationId=${encodeURIComponent(organizationId)}`,
      );
      const data = await response.json();
      setProcesses(data || []);
    } catch (err) {
      console.error('Failed to fetch processes:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${USER_API}/users?organizationId=${encodeURIComponent(organizationId)}&limit=500`,
      );
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : data?.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchEntities = async () => {
    try {
      const response = await fetch(
        `${ORG_API}/entities?organizationId=${encodeURIComponent(organizationId)}`,
      );
      const data = await response.json();
      setEntities(Array.isArray(data) ? data : data?.value || []);
    } catch (err) {
      console.error('Failed to fetch entities:', err);
    }
  };

  const handleCreateProcess = async () => {
    try {
      const response = await fetch(`${ORG_API}/processes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...processData,
          organizationId,
          createdBy: getCurrentUserId() || getStoredUser().email || 'system',
        }),
      });

      if (response.ok) {
        setProcessData({
          title: "",
          description: "",
          processTag: "",
          frequency: "",
          requiresApproval: false,
          assigneeIds: [],
          storeIds: [],
        });
        setSections([]);
        setIsDialogOpen(false);
        fetchProcesses();
      } else {
        console.error('Failed to create process');
      }
    } catch (err) {
      console.error('Error creating process:', err);
    }
  };

  const handlePublishProcess = async (id: string) => {
    try {
await fetch(`${ORG_API}/processes/${id}/publish`, {
      method: 'PUT',
    });
      fetchProcesses();
    } catch (err) {
      console.error('Error publishing process:', err);
    }
  };

  const handleArchiveProcess = async (id: string) => {
    if (!confirm('Are you sure you want to archive this process?')) return;

    try {
      await fetch(`http://localhost:3009/api/org/processes/${id}/archive`, {
        method: 'PUT',
      });
      fetchProcesses();
    } catch (err) {
      console.error('Error archiving process:', err);
    }
  };

  const handleDeleteProcess = async (id: string) => {
    if (!confirm('Are you sure you want to delete this process?')) return;

    try {
      await fetch(`http://localhost:3009/api/org/processes/${id}`, {
        method: 'DELETE',
      });
      fetchProcesses();
    } catch (err) {
      console.error('Error deleting process:', err);
    }
  };

  const handleAddSection = () => {
    const newSection = {
      id: `temp-${Date.now()}`,
      title: "",
      description: "",
      displayOrder: sections.length,
      questions: [],
    };
    setSections([...sections, newSection]);
    setCurrentSection(newSection);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Processes</h1>
            <p className="text-muted-foreground mt-1">Manage workflows and checklists</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Process
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Process</DialogTitle>
              <DialogDescription>
                Create a new workflow or checklist for your team.
              </DialogDescription>
            </DialogHeader>
            
            {/* Process Sub Tabs */}
            <div className="border-b bg-card">
              <div className="px-6">
                <div className="flex gap-1 overflow-x-auto">
                  {["Details", "Build", "Properties", "Assign"].map((tab) => (
                    <Button
                      key={tab}
                      variant={processSubTab === tab ? "default" : "ghost"}
                      className={`rounded-t-lg border-b-2 ${
                        processSubTab === tab
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                      onClick={() => setProcessSubTab(tab)}
                    >
                      {tab}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 py-4">
              {processSubTab === "Details" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter process title"
                      value={processData.title}
                      onChange={(e) => setProcessData({ ...processData, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter process description"
                      value={processData.description}
                      onChange={(e) => setProcessData({ ...processData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="processTag">Process Tag</Label>
                    <Input
                      id="processTag"
                      placeholder="e.g., Opening, Hygiene, Operations"
                      value={processData.processTag}
                      onChange={(e) => setProcessData({ ...processData, processTag: e.target.value })}
                    />
                  </div>
                </>
              )}

              {processSubTab === "Build" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Sections & Questions</h3>
                    <Button variant="outline" size="sm" onClick={handleAddSection}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                  {sections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <p>No sections added yet. Click "Add Section" to start building your process.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sections.map((section: any, index: number) => (
                        <Card key={section.id}>
                          <CardHeader>
                            <CardTitle className="text-base">Section {index + 1}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Input
                                placeholder="Section title"
                                value={section.title}
                                onChange={(e) => {
                                  const newSections = [...sections];
                                  newSections[index].title = e.target.value;
                                  setSections(newSections);
                                }}
                              />
                              <Textarea
                                placeholder="Section description"
                                value={section.description}
                                onChange={(e) => {
                                  const newSections = [...sections];
                                  newSections[index].description = e.target.value;
                                  setSections(newSections);
                                }}
                                rows={2}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {processSubTab === "Properties" && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={processData.frequency}
                      onValueChange={(value) => setProcessData({ ...processData, frequency: value })}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="requiresApproval"
                      checked={processData.requiresApproval}
                      onCheckedChange={(checked) => setProcessData({ ...processData, requiresApproval: checked })}
                    />
                    <Label htmlFor="requiresApproval">Requires Approval</Label>
                  </div>
                </div>
              )}

              {processSubTab === "Assign" && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Select Users</Label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      {users.map((user: any) => (
                        <div key={user.userId} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`user-${user.userId}`}
                            checked={processData.assigneeIds.includes(user.userId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProcessData({
                                  ...processData,
                                  assigneeIds: [...processData.assigneeIds, user.userId],
                                });
                              } else {
                                setProcessData({
                                  ...processData,
                                  assigneeIds: processData.assigneeIds.filter((id) => id !== user.userId),
                                });
                              }
                            }}
                          />
                          <label htmlFor={`user-${user.userId}`} className="text-sm">
                            {user.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Select Stores</Label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      {entities.map((entity: any) => (
                        <div key={entity.id} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`store-${entity.id}`}
                            checked={processData.storeIds.includes(entity.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProcessData({
                                  ...processData,
                                  storeIds: [...processData.storeIds, entity.id],
                                });
                              } else {
                                setProcessData({
                                  ...processData,
                                  storeIds: processData.storeIds.filter((id) => id !== entity.id),
                                });
                              }
                            }}
                          />
                          <label htmlFor={`store-${entity.id}`} className="text-sm">
                            {entity.storeName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProcess}>
                Create Process
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {["List"].map((tab) => (
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
            placeholder="Search processes"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Processes Table */}
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
                <TableHead>Assignees</TableHead>
                <TableHead>Stores</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No processes available
                  </TableCell>
                </TableRow>
              ) : (
                processes.map((process: any) => (
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
                      <Badge variant="outline">{process.assigneeIds?.length || 0} users</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{process.storeIds?.length || 0} stores</Badge>
                    </TableCell>
                    <TableCell>
                      <TableActionsMenu>
                        {process.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handlePublishProcess(process.id)}>
                            <Play className="w-4 h-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleArchiveProcess(process.id)}>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteProcess(process.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </TableActionsMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
