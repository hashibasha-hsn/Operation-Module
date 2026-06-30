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
  Search,
  Download,
  RefreshCw,
  Plus,
  BookOpen,
  Play,
  Edit,
  Trash2,
  CalendarIcon,
  Filter,
  Settings,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";

export default function Courses() {
  const [activeTab, setActiveTab] = useState("All Courses");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    categoryId: "",
    status: "draft",
    expiresAt: undefined as Date | undefined,
  });

  const tabs = ["All Courses", "My Courses", "Published", "Draft"];

  const mockCourses: any[] = [];

  const filteredCourses = mockCourses.filter((course: any) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCourse = () => {
    console.log("Creating course:", newCourse);
    setShowCreateDialog(false);
    setNewCourse({
      title: "",
      description: "",
      categoryId: "",
      status: "draft",
      expiresAt: undefined,
    });
  };

  const handleEditCourse = () => {
    console.log("Editing course:", selectedCourse);
    setShowEditDialog(false);
  };

  const handleDeleteCourse = (id: string) => {
    console.log("Deleting course:", id);
  };

  const handleStartCourse = (id: string) => {
    console.log("Starting course:", id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Courses</h1>
            <p className="text-muted-foreground mt-1">Manage and track learning content</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Categories
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" />
            Create Course
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

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockCourses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mockCourses.filter((c) => c.status === "published").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mockCourses.reduce((sum, c) => sum + c.enrolled, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mockCourses.reduce((sum, c) => sum + c.completed, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Courses</span>
            <Badge variant="outline">{filteredCourses.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No courses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course: any) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-mono text-sm">{course.id}</TableCell>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>{course.category}</TableCell>
                      <TableCell>
                        <Badge
                          variant={course.status === "published" ? "default" : "secondary"}
                        >
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 w-24">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                          <span className="text-sm">{course.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrolled}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {course.completed}
                        </div>
                      </TableCell>
                      <TableCell>
                        {course.expiresAt ? new Date(course.expiresAt).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        <TableActionsMenu>
                          <DropdownMenuItem onClick={() => handleStartCourse(course.id)}>
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedCourse(course);
                            setShowEditDialog(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteCourse(course.id)} className="text-destructive">
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
        </CardContent>
      </Card>

      {/* Create Course Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Create a new learning course with content and quizzes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                placeholder="Enter course title"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter course description"
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newCourse.categoryId}
                  onValueChange={(value) => setNewCourse({ ...newCourse, categoryId: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="skills">Skills</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newCourse.status}
                  onValueChange={(value) => setNewCourse({ ...newCourse, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newCourse.expiresAt ? format(newCourse.expiresAt, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newCourse.expiresAt}
                    onSelect={(date) => setNewCourse({ ...newCourse, expiresAt: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCourse}>
              Create Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Modify course details.
            </DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editTitle">Course Title</Label>
                <Input
                  id="editTitle"
                  defaultValue={selectedCourse.title}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  defaultValue={selectedCourse.description}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCourse}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
