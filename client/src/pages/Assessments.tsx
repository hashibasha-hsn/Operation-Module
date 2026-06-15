import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Plus,
  Search,
  ClipboardList,
  Edit,
  Trash2,
  Play,
  CalendarIcon,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  Users,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Assessments() {
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const [newAssessment, setNewAssessment] = useState({
    title: "",
    description: "",
    passingScore: 70,
    duration: 30,
    status: "draft",
    allowRetake: false,
    maxAttempts: 1,
    expiresAt: undefined as Date | undefined,
  });

  const tabs = ["All", t('published'), t('draft'), t('archived')];

  // Fetch assessments from database
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await fetch('http://localhost:3009/api/assessments');
        if (response.ok) {
          const data = await response.json();
          setAssessments(data);
        }
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const filteredAssessments = assessments.filter((assessment: any) =>
    assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAssessment = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAssessment),
      });

      if (response.ok) {
        const createdAssessment = await response.json();
        setAssessments([...assessments, createdAssessment]);
        setShowCreateDialog(false);
        setNewAssessment({
          title: "",
          description: "",
          passingScore: 70,
          duration: 30,
          status: "draft",
          allowRetake: false,
          maxAttempts: 1,
          expiresAt: undefined,
        });
      } else {
        console.error('Failed to create assessment');
      }
    } catch (error) {
      console.error('Failed to create assessment:', error);
    }
  };

  const handleEditAssessment = async () => {
    if (!selectedAssessment) return;

    try {
      const response = await fetch(`http://localhost:3009/api/assessments/${selectedAssessment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedAssessment),
      });

      if (response.ok) {
        const updatedAssessment = await response.json();
        setAssessments(assessments.map(assessment => assessment.id === updatedAssessment.id ? updatedAssessment : assessment));
        setShowEditDialog(false);
      } else {
        console.error('Failed to update assessment');
      }
    } catch (error) {
      console.error('Failed to update assessment:', error);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3009/api/assessments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAssessments(assessments.filter(assessment => assessment.id !== id));
      } else {
        console.error('Failed to delete assessment');
      }
    } catch (error) {
      console.error('Failed to delete assessment:', error);
    }
  };

  const handleStartAssessment = (id: string) => {
    console.log("Starting assessment:", id);
    // Navigate to assessment taking page
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('assessmentsQuizzes')}</h1>
            <p className="text-muted-foreground mt-1">{t('createAndManage')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('refresh')}
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" />
            {t('newAssessment')}
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
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`${t('search')} ${t('assessments').toLowerCase()}...`}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {t('filter')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('published')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.filter((a: any) => a.status === "published").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalTasks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.reduce((sum: number, a: any) => sum + (a.attempts || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('avgScore')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.length > 0
                ? Math.round(
                    assessments.reduce((sum: number, a: any) => sum + (a.avgScore || 0), 0) /
                      assessments.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('assessmentsList')}</span>
            <Badge variant="outline">{filteredAssessments.length} {t('records')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('loading')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>{t('title')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('passingScore')}</TableHead>
                    <TableHead>{t('duration')}</TableHead>
                    <TableHead>{t('attempts')}</TableHead>
                    <TableHead>{t('passed')}</TableHead>
                    <TableHead>{t('avgScore')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        {t('noDataFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssessments.map((assessment: any) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-mono text-sm">{assessment.id}</TableCell>
                      <TableCell className="font-medium">{assessment.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            assessment.status === "published" ? "default" : "secondary"
                          }
                        >
                          {assessment.status === "published" ? t('published') : t('draft')}
                        </Badge>
                      </TableCell>
                      <TableCell>{assessment.passingScore}%</TableCell>
                      <TableCell>{assessment.duration} min</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {assessment.attempts}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {assessment.passed}
                        </div>
                      </TableCell>
                      <TableCell>{assessment.avgScore}%</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartAssessment(assessment.id)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedAssessment(assessment);
                                setShowEditDialog(true);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t('edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteAssessment(assessment.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t('delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Create Assessment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('createNewAssessment')}</DialogTitle>
            <DialogDescription>
              {t('createAndManage')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t('assessmentTitle')} *</Label>
              <Input
                id="title"
                placeholder={t('enterAssessmentTitle')}
                value={newAssessment.title}
                onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                placeholder={t('enterAssessmentDescription')}
                value={newAssessment.description}
                onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="passingScore">{t('passingScore')} (%)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  value={newAssessment.passingScore}
                  onChange={(e) => setNewAssessment({ ...newAssessment, passingScore: parseInt(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">{t('duration')} ({t('minutes')})</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newAssessment.duration}
                  onChange={(e) => setNewAssessment({ ...newAssessment, duration: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">{t('status')}</Label>
                <Select
                  value={newAssessment.status}
                  onValueChange={(value) => setNewAssessment({ ...newAssessment, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('draft')}</SelectItem>
                    <SelectItem value="published">{t('published')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxAttempts">{t('maxAttempts')}</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  value={newAssessment.maxAttempts}
                  onChange={(e) => setNewAssessment({ ...newAssessment, maxAttempts: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newAssessment.allowRetake}
                onChange={(e) => setNewAssessment({ ...newAssessment, allowRetake: e.target.checked })}
              />
              <Label>{t('allowRetake')}</Label>
            </div>
            <div className="grid gap-2">
              <Label>{t('assessmentExpiryDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newAssessment.expiresAt ? format(newAssessment.expiresAt, "PPP") : t('pickADate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newAssessment.expiresAt}
                    onSelect={(date) => setNewAssessment({ ...newAssessment, expiresAt: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreateAssessment}>
              {t('createAssessment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assessment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('editAssessment')}</DialogTitle>
            <DialogDescription>
              {t('modifyAssessmentDetails')}
            </DialogDescription>
          </DialogHeader>
          {selectedAssessment && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editTitle">{t('assessmentTitle')}</Label>
                <Input
                  id="editTitle"
                  defaultValue={selectedAssessment.title}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editDescription">{t('description')}</Label>
                <Textarea
                  id="editDescription"
                  defaultValue={selectedAssessment.description}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEditAssessment}>
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
