import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  BookOpen,
  Folder,
  ChevronUp,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Category {
  id: string;
  name: string;
  arabicName: string;
  lastUpdated: string;
  expanded: boolean;
  courses: Course[];
}

interface Course {
  id: string;
  name: string;
  arabicName: string;
  lastUpdated: string;
}

export default function CategoriesAndCourses() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [showQuizCreationDialog, setShowQuizCreationDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingCourse, setEditingCourse] = useState<{course: Course, categoryId: string} | null>(null);
  const { t } = useLanguage();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryArabicName, setNewCategoryArabicName] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseArabicName, setNewCourseArabicName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  
  // Quiz creation state
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizTimeLimit, setQuizTimeLimit] = useState(30);
  const [quizPassingScore, setQuizPassingScore] = useState(70);
  const [selectedCourseForQuiz, setSelectedCourseForQuiz] = useState("");
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedQuizForAssign, setSelectedQuizForAssign] = useState<any>(null);
  const [selectedQuizForPublish, setSelectedQuizForPublish] = useState<any>(null);

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:3009/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error(t('failedToLoadCategories'));
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch quizzes from database
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoadingQuizzes(true);
        const response = await fetch('http://localhost:3009/api/quizzes');
        if (response.ok) {
          const data = await response.json();
          setQuizzes(data);
        }
      } catch (error) {
        console.error('Failed to fetch quizzes:', error);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error(t('categoryNameIsRequired'));
      return;
    }

    try {
      const response = await fetch('http://localhost:3009/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName,
          arabicName: newCategoryArabicName || "",
        }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories([...categories, { ...newCategory, expanded: true, courses: [] }]);
        setNewCategoryName("");
        setNewCategoryArabicName("");
        setShowCategoryDialog(false);
        toast.success(t('categoryCreatedSuccessfully'));
      } else {
        toast.error(t('failedToCreateCategory'));
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error(t('failedToCreateCategory'));
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) {
      toast.error(t('courseNameIsRequired'));
      return;
    }

    if (!selectedCategoryId) {
      toast.error(t('pleaseSelectACategory'));
      return;
    }

    try {
      const response = await fetch('http://localhost:3009/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCourseName,
          arabicName: newCourseArabicName || "",
          categoryId: selectedCategoryId,
        }),
      });

      if (response.ok) {
        const newCourse = await response.json();
        setCategories(categories.map(cat =>
          cat.id === selectedCategoryId
            ? { ...cat, courses: [...cat.courses, newCourse] }
            : cat
        ));
        setNewCourseName("");
        setNewCourseArabicName("");
        setSelectedCategoryId("");
        setShowCourseDialog(false);
        toast.success(t('courseCreatedSuccessfully'));
      } else {
        toast.error(t('failedToCreateCourse'));
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      toast.error(t('failedToCreateCourse'));
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`http://localhost:3009/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== categoryId));
        toast.success(t('categoryDeletedSuccessfully'));
      } else {
        toast.error(t('failedToDeleteCategory'));
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error(t('failedToDeleteCategory'));
    }
  };

  const handleDeleteCourse = async (categoryId: string, courseId: string) => {
    try {
      const response = await fetch(`http://localhost:3009/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCategories(categories.map(cat =>
          cat.id === categoryId
            ? { ...cat, courses: cat.courses.filter(course => course.id !== courseId) }
            : cat
        ));
        toast.success(t('courseDeletedSuccessfully'));
      } else {
        toast.error(t('failedToDeleteCourse'));
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error(t('failedToDeleteCourse'));
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryArabicName(category.arabicName);
    setShowCategoryDialog(true);
  };

  const handleEditCourse = (course: Course, categoryId: string) => {
    setEditingCourse({ course, categoryId });
    setNewCourseName(course.name);
    setNewCourseArabicName(course.arabicName);
    setShowCourseDialog(true);
  };

  const handleUpdateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error(t('categoryNameIsRequired'));
      return;
    }

    if (editingCategory) {
      try {
        const response = await fetch(`http://localhost:3009/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newCategoryName,
            arabicName: newCategoryArabicName,
          }),
        });

        if (response.ok) {
          setCategories(categories.map(cat =>
            cat.id === editingCategory.id
              ? {
                  ...cat,
                  name: newCategoryName,
                  arabicName: newCategoryArabicName,
                  lastUpdated: new Date().toLocaleString()
                }
              : cat
          ));
          setEditingCategory(null);
          setNewCategoryName("");
          setNewCategoryArabicName("");
          setShowCategoryDialog(false);
          toast.success(t('categoryUpdatedSuccessfully'));
        } else {
          toast.error(t('failedToUpdateCategory'));
        }
      } catch (error) {
        console.error('Failed to update category:', error);
        toast.error(t('failedToUpdateCategory'));
      }
    }
  };

  const handleUpdateCourse = async () => {
    if (!newCourseName.trim()) {
      toast.error(t('courseNameIsRequired'));
      return;
    }

    if (editingCourse) {
      try {
        const response = await fetch(`http://localhost:3009/api/courses/${editingCourse.course.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newCourseName,
            arabicName: newCourseArabicName,
          }),
        });

        if (response.ok) {
          setCategories(categories.map(cat =>
            cat.id === editingCourse.categoryId
              ? {
                  ...cat,
                  courses: cat.courses.map(course =>
                    course.id === editingCourse.course.id
                      ? {
                          ...course,
                          name: newCourseName,
                          arabicName: newCourseArabicName,
                          lastUpdated: new Date().toLocaleString()
                        }
                      : course
                  )
                }
              : cat
          ));
          setEditingCourse(null);
          setNewCourseName("");
          setNewCourseArabicName("");
          setShowCourseDialog(false);
          toast.success(t('courseUpdatedSuccessfully'));
        } else {
          toast.error(t('failedToUpdateCourse'));
        }
      } catch (error) {
        console.error('Failed to update course:', error);
        toast.error(t('failedToUpdateCourse'));
      }
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, expanded: !cat.expanded }
        : cat
    ));
  };

  const collapseAll = () => {
    setCategories(categories.map(cat => ({ ...cat, expanded: false })));
  };

  const handleCreateQuiz = () => {
    setShowQuizCreationDialog(true);
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle.trim()) {
      toast.error(t('quizTitleIsRequired'));
      return;
    }

    if (!selectedCourseForQuiz) {
      toast.error(t('pleaseSelectACategory'));
      return;
    }

    try {
      const response = await fetch('http://localhost:3009/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: quizTitle,
          description: quizDescription,
          courseId: selectedCourseForQuiz,
          timeLimit: quizTimeLimit,
          passingScore: quizPassingScore,
        }),
      });

      if (response.ok) {
        toast.success(t('quizCreatedSuccessfully'));
        setShowQuizCreationDialog(false);
        setQuizTitle("");
        setQuizDescription("");
        setQuizTimeLimit(30);
        setQuizPassingScore(70);
        setSelectedCourseForQuiz("");
      } else {
        toast.error(t('failedToCreateQuiz'));
      }
    } catch (error) {
      console.error('Failed to create quiz:', error);
      toast.error(t('failedToCreateQuiz'));
    }
  };

  const handleAssignQuiz = (quiz: any) => {
    setSelectedQuizForAssign(quiz);
    setShowAssignDialog(true);
  };

  const handlePublishQuiz = (quiz: any) => {
    setSelectedQuizForPublish(quiz);
    setShowPublishDialog(true);
  };

  const handleSaveQuizAssignment = async () => {
    if (!selectedQuizForAssign) return;

    try {
      const response = await fetch('http://localhost:3009/api/quiz-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: selectedQuizForAssign.id,
          assigneeType: 'course',
          assigneeId: selectedQuizForAssign.course_id,
        }),
      });

      if (response.ok) {
        toast.success(t('quizAssignedSuccessfully'));
        setShowAssignDialog(false);
        setSelectedQuizForAssign(null);
      } else {
        toast.error(t('failedToAssignQuiz'));
      }
    } catch (error) {
      console.error('Failed to assign quiz:', error);
      toast.error(t('failedToAssignQuiz'));
    }
  };

  const handlePublishQuizAction = async () => {
    if (!selectedQuizForPublish) return;

    try {
      const response = await fetch(`http://localhost:3009/api/quizzes/${selectedQuizForPublish.id}/publish`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success(t('quizPublishedSuccessfully'));
        setShowPublishDialog(false);
        setSelectedQuizForPublish(null);
        // Refresh quizzes
        const quizResponse = await fetch('http://localhost:3009/api/quizzes');
        if (quizResponse.ok) {
          const data = await quizResponse.json();
          setQuizzes(data);
        }
      } else {
        toast.error(t('failedToPublishQuiz'));
      }
    } catch (error) {
      console.error('Failed to publish quiz:', error);
      toast.error(t('failedToPublishQuiz'));
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.arabicName.includes(searchQuery) ||
    cat.courses.some(course => 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.arabicName.includes(searchQuery)
    )
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t('categoriesAndCourses')}</h1>
        <p className="text-muted-foreground">{t('manageCategories')}</p>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`${t('search')} ${t('categories').toLowerCase()} ${t('or')} ${t('courses').toLowerCase()}...`}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={collapseAll}>
            {t('collapse')} {t('selectAll')}
          </Button>
        </div>

        <div className="flex gap-3">
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button>
                <Folder className="w-4 h-4 mr-2" />
                {t('createCategory')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? t('edit') + " " + t('categories').slice(0, -1) : t('createCategory')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">{t('categoryName')} *</Label>
                  <Input
                    id="categoryName"
                    placeholder={t('enterCategoryName')}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="categoryArabicName">{t('arabicName')}</Label>
                  <Input
                    id="categoryArabicName"
                    placeholder={t('enterArabicName')}
                    value={newCategoryArabicName}
                    onChange={(e) => setNewCategoryArabicName(e.target.value)}
                    dir="rtl"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => {
                    setShowCategoryDialog(false);
                    setEditingCategory(null);
                    setNewCategoryName("");
                    setNewCategoryArabicName("");
                  }}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                    {editingCategory ? t('saveChanges') : t('create')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Link href="/course-creation">
            <Button variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              {t('createCourse')}
            </Button>
          </Link>

          <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                {t('createCourseQuiz')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createCourseQuiz')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {t('createAndManage')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>{t('shortAnswer')}</li>
                  <li>{t('singleAnswer')}</li>
                  <li>{t('multipleAnswer')}</li>
                </ul>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowQuizDialog(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleCreateQuiz}>
                    {t('create')} {t('assessments').slice(0, -1)}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quiz Creation Dialog */}
          <Dialog open={showQuizCreationDialog} onOpenChange={setShowQuizCreationDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('createNewAssessment')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quizTitle">{t('quizTitle')} *</Label>
                  <Input
                    id="quizTitle"
                    placeholder={t('enterAssessmentTitle')}
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="quizDescription">{t('description')}</Label>
                  <Input
                    id="quizDescription"
                    placeholder={t('enterAssessmentDescription')}
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="quizCourse">{t('selectCategory')} *</Label>
                  <select
                    id="quizCourse"
                    className="w-full p-2 border rounded-md"
                    value={selectedCourseForQuiz}
                    onChange={(e) => setSelectedCourseForQuiz(e.target.value)}
                  >
                    <option value="">{t('selectCategory')}</option>
                    {categories.flatMap(cat => cat.courses).map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quizTimeLimit">{t('timeLimit')}</Label>
                    <Input
                      id="quizTimeLimit"
                      type="number"
                      value={quizTimeLimit}
                      onChange={(e) => setQuizTimeLimit(parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quizPassingScore">{t('passingScorePercent')}</Label>
                    <Input
                      id="quizPassingScore"
                      type="number"
                      value={quizPassingScore}
                      onChange={(e) => setQuizPassingScore(parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowQuizCreationDialog(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleSaveQuiz}>
                    {t('create')} {t('assessments').slice(0, -1)}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quiz Assign Dialog */}
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('assign')} {t('assessments').slice(0, -1)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedQuizForAssign && (
                  <div>
                    <p className="font-medium">{selectedQuizForAssign.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedQuizForAssign.description || t('noDataFound')}</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="assignee">{t('assign')} {t('to')}</Label>
                  <select
                    id="assignee"
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">{t('select')}</option>
                    <option value="all">{t('selectAll')} {t('users')}</option>
                    {categories.flatMap(cat => cat.courses).map(course => (
                      <option key={course.id} value={course.id}>
                        {t('courses')}: {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleSaveQuizAssignment}>
                    {t('assign')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quiz Publish Dialog */}
          <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('publishQuiz')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedQuizForPublish && (
                  <div>
                    <p className="font-medium">{selectedQuizForPublish.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedQuizForPublish.description || t('noDescription')}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {t('publishingQuizConfirmation')}
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handlePublishQuizAction}>
                    {t('publish')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories and Courses List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p>{t('loadingCategoriesAndCourses')}</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('noCategoriesOrCoursesFound')}</p>
                <p className="text-sm mt-2">{t('createNewCategoryToGetStarted')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-0">
                {/* Category Header */}
                <div 
                  className="flex items-center justify-between p-4 border-b hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {category.expanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <Folder className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground" dir="rtl">{category.arabicName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {t('lastUpdatedAt')} {category.lastUpdated}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Courses List */}
                {category.expanded && (
                  <div className="divide-y">
                    {category.courses.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{t('noCoursesInThisCategory')}</p>
                      </div>
                    ) : (
                      category.courses.map((course) => (
                        <div 
                          key={course.id} 
                          className="flex items-center justify-between p-4 pl-16 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{course.name}</div>
                              <div className="text-xs text-muted-foreground" dir="rtl">{course.arabicName}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">
                              {t('lastUpdatedAt')} {course.lastUpdated}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleEditCourse(course, category.id)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteCourse(category.id, course.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Available Quizzes Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4 text-purple-800">{t('availableQuizzes')}</h2>
        {loadingQuizzes ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p>{t('loadingQuizzes')}</p>
              </div>
            </CardContent>
          </Card>
        ) : quizzes.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('noQuizzesFound')}</p>
                <p className="text-sm mt-2">{t('createNewQuizToGetStarted')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-800">{quiz.title}</h3>
                      <p className="text-sm text-purple-600 mt-1">{quiz.description || t('noDescription')}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
                    <span>{t('time')}: {quiz.time_limit} min</span>
                    <span>{t('passing')}: {quiz.passing_score}%</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleAssignQuiz(quiz)}>
                      {t('assign')}
                    </Button>
                    <Button variant="default" size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => handlePublishQuiz(quiz)}>
                      {t('publish')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
