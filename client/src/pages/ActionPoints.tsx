import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import { Search, Filter, Download, Plus, AlertCircle, Clock, CheckCircle, XCircle, PauseCircle, LayoutGrid, LayoutList } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type ActionPointTab,
  addActionPointComment,
  exportActionPointsToCsv,
  fetchActionPointsByTab,
  updateActionPointStatus,
} from "@/lib/actionPointApi";
import { fetchUsers } from "@/lib/processApi";
import { buildIdLabelMap, humanLabel } from "@/lib/displayLabels";

export default function ActionPoints() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActionPointTab>("assigned");
  const [actionPoints, setActionPoints] = useState<any[]>([]);
  const [selectedActionPoint, setSelectedActionPoint] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [layout, setLayout] = useState<"grid" | "list">("list");
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchActionPoints();
  }, [activeTab]);

  useEffect(() => {
    fetchUsers(1000)
      .then((users) => {
        setUserNames(buildIdLabelMap(users, ["userId", "id"], ["name", "fullName", "email", "employeeId"]));
      })
      .catch(() => setUserNames({}));
  }, []);

  const userLabel = (id?: string) => {
    if (!id) return t("notAvailable") || "—";
    return humanLabel(userNames[id], "Unknown user");
  };

  const fetchActionPoints = async () => {
    try {
      const data = await fetchActionPointsByTab(activeTab);
      setActionPoints(data || []);
    } catch (err) {
      console.error('Failed to fetch action points:', err);
      setActionPoints([]);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateActionPointStatus(id, status);
      fetchActionPoints();
      setIsDetailDialogOpen(false);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAddComment = async () => {
    if (!selectedActionPoint || !comment) return;

    try {
      await addActionPointComment(selectedActionPoint.id, comment);
      setComment("");
      setIsCommentDialogOpen(false);
      fetchActionPoints();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleExport = (type: 'shown' | 'all') => {
    exportActionPointsToCsv(filteredActionPoints, type);
  };

  const getTimeLeft = (dueDate: string) => {
    if (!dueDate) return t('noDueDate');
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return t('overdue');
    if (days === 0) return t('today');
    if (days === 1) return t('oneDay');
    return `${days} ${t('days')}`;
  };

  const filteredActionPoints = actionPoints.filter((ap: any) => {
    const matchesSearch = ap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ap.description && ap.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || ap.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ap.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'on_hold':
        return <PauseCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('actionPoints')}</h1>
            <p className="text-muted-foreground mt-1">{t('actionPointsIntro')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => handleExport('shown')}>
            <Download className="w-4 h-4" />
            {t('exportShown')}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('all')}>
            <Download className="w-4 h-4" />
            {t('exportAll')}
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            {t('newActionPoint')}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {(
              [
                { key: 'assigned' as ActionPointTab, label: t('assignedToMe') },
                { key: 'created' as ActionPointTab, label: t('createdByMe') },
                { key: 'closure' as ActionPointTab, label: t('closureAssigned') },
              ] as const
            ).map(({ key, label }) => (
              <Button
                key={key}
                variant={activeTab === key ? "default" : "ghost"}
                className={`rounded-t-lg border-b-2 ${
                  activeTab === key
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchActionPoints')}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatus')}</SelectItem>
            <SelectItem value="open">{t('open')}</SelectItem>
            <SelectItem value="in_progress">{t('inProgress')}</SelectItem>
            <SelectItem value="on_hold">{t('onHold')}</SelectItem>
            <SelectItem value="completed">{t('completed')}</SelectItem>
            <SelectItem value="closed">{t('closed')}</SelectItem>
            <SelectItem value="rejected">{t('rejected')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('priority')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allPriority')}</SelectItem>
            <SelectItem value="low">{t('low')}</SelectItem>
            <SelectItem value="medium">{t('medium')}</SelectItem>
            <SelectItem value="high">{t('high')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {t('moreFilters')}
        </Button>
        <div className="flex border rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className={layout === "list" ? "bg-muted" : ""}
            onClick={() => setLayout("list")}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={layout === "grid" ? "bg-muted" : ""}
            onClick={() => setLayout("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalActionPoints')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionPoints.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('open')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {actionPoints.filter((ap: any) => ap.status === 'open').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('inProgress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {actionPoints.filter((ap: any) => ap.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('completed')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {actionPoints.filter((ap: any) => ap.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Points Table */}
      {layout === "list" && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('title')}</TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead>{t('priority')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('assignedTo')}</TableHead>
                  <TableHead>{t('dueDate')}</TableHead>
                  <TableHead>{t('timeLeft')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActionPoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      {t('noActionPointsAvailable')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActionPoints.map((ap: any) => (
                    <TableRow key={ap.id}>
                      <TableCell className="font-medium">{ap.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{ap.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant={ap.priority === 'high' ? 'destructive' : ap.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {t(ap.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ap.status)}
                          <Badge
                            variant={
                              ap.status === 'completed' || ap.status === 'closed' ? 'default' :
                              ap.status === 'rejected' ? 'destructive' :
                              ap.status === 'in_progress' ? 'secondary' : 'outline'
                            }
                          >
                            {t(ap.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{userLabel(ap.assignedTo)}</TableCell>
                      <TableCell>
                        {ap.dueDate ? new Date(ap.dueDate).toLocaleDateString() : t('notAvailable')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className={getTimeLeft(ap.dueDate) === t('overdue') ? 'text-red-600' : ''}>
                            {getTimeLeft(ap.dueDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TableActionsMenu>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedActionPoint(ap);
                              setIsDetailDialogOpen(true);
                            }}
                          >
                            {t('view')}
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
      )}

      {/* Grid Layout */}
      {layout === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActionPoints.map((ap: any) => (
            <Card key={ap.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{ap.title}</CardTitle>
                  <Badge
                    variant={ap.priority === 'high' ? 'destructive' : ap.priority === 'medium' ? 'default' : 'secondary'}
                  >
                    {t(ap.priority)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{ap.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('status')}:</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(ap.status)}
                      <span>{t(ap.status)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('assignedTo')}:</span>
                    <span>{userLabel(ap.assignedTo)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('dueDate')}:</span>
                    <span>{ap.dueDate ? new Date(ap.dueDate).toLocaleDateString() : t('notAvailable')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('timeLeft')}:</span>
                    <span className={getTimeLeft(ap.dueDate) === t('overdue') ? 'text-red-600' : ''}>
                      {getTimeLeft(ap.dueDate)}
                    </span>
                  </div>
                </div>
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={() => {
                    setSelectedActionPoint(ap);
                    setIsDetailDialogOpen(true);
                  }}
                >
                  {t('viewDetails')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Point Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('actionPointDetails')}</DialogTitle>
            <DialogDescription>
              {t('viewAndManageActionPointDetails')}
            </DialogDescription>
          </DialogHeader>
          {selectedActionPoint && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('title')}</Label>
                  <div className="text-sm mt-1 font-medium">{selectedActionPoint.title}</div>
                </div>
                <div>
                  <Label>{t('priority')}</Label>
                  <div className="mt-1">
                    <Badge
                      variant={selectedActionPoint.priority === 'high' ? 'destructive' : selectedActionPoint.priority === 'medium' ? 'default' : 'secondary'}
                    >
                      {t(selectedActionPoint.priority)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>{t('status')}</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedActionPoint.status === 'completed' || selectedActionPoint.status === 'closed' ? 'default' :
                        selectedActionPoint.status === 'rejected' ? 'destructive' :
                        selectedActionPoint.status === 'in_progress' ? 'secondary' : 'outline'
                      }
                    >
                      {t(selectedActionPoint.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>{t('dueDate')}</Label>
                  <div className="text-sm mt-1">
                    {selectedActionPoint.dueDate ? new Date(selectedActionPoint.dueDate).toLocaleString() : t('notAvailable')}
                  </div>
                </div>
                <div>
                  <Label>{t('assignedTo')}</Label>
                  <div className="text-sm mt-1">{userLabel(selectedActionPoint.assignedTo)}</div>
                </div>
                <div>
                  <Label>{t('createdBy')}</Label>
                  <div className="text-sm mt-1">{userLabel(selectedActionPoint.createdBy)}</div>
                </div>
              </div>

              <div>
                <Label>{t('description')}</Label>
                <div className="text-sm mt-1 p-3 border rounded-lg bg-muted">
                  {selectedActionPoint.description || t('noDescription')}
                </div>
              </div>

              {selectedActionPoint.comments && selectedActionPoint.comments.length > 0 && (
                <div>
                  <Label>{t('comments')}</Label>
                  <div className="mt-2 space-y-2">
                    {selectedActionPoint.comments.map((comment: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <div className="text-sm font-medium">{userLabel(comment.userId)}</div>
                        <div className="text-sm text-muted-foreground">{comment.text}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(true)}>
              {t('addComment')}
            </Button>
            {selectedActionPoint?.status === 'open' && (
              <>
                <Button variant="outline" onClick={() => handleUpdateStatus(selectedActionPoint.id, 'in_progress')}>
                  {t('startProgress')}
                </Button>
                <Button onClick={() => handleUpdateStatus(selectedActionPoint.id, 'completed')}>
                  {t('markComplete')}
                </Button>
              </>
            )}
            {selectedActionPoint?.status === 'in_progress' && (
              <>
                <Button variant="outline" onClick={() => handleUpdateStatus(selectedActionPoint.id, 'on_hold')}>
                  {t('putOnHold')}
                </Button>
                <Button onClick={() => handleUpdateStatus(selectedActionPoint.id, 'completed')}>
                  {t('markComplete')}
                </Button>
              </>
            )}
            {selectedActionPoint?.status === 'completed' && (
              <Button onClick={() => handleUpdateStatus(selectedActionPoint.id, 'closed')}>
                {t('close')}
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addComment')}</DialogTitle>
            <DialogDescription>
              {t('addComment')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comment">{t('comments')}</Label>
              <Textarea
                id="comment"
                placeholder={t('enterYourComment')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleAddComment}>
              {t('addComment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
