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
import {
  assignCourse,
  createCategory,
  createCourse,
  createQuiz,
  deleteCategory,
  deleteCourse,
  deleteQuiz,
  fetchCategories,
  fetchCourses,
  fetchQuizzes,
  updateCategory,
  updateCourse,
  updateQuiz,
} from "@/lib/courseApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStoredUser } from "@/lib/authStorage";

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
  createdBy?: string;
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
  const [quizShowCorrectAnswer, setQuizShowCorrectAnswer] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [selectedCourseForQuiz, setSelectedCourseForQuiz] = useState("");
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedQuizForAssign, setSelectedQuizForAssign] = useState<any>(null);
  const [selectedQuizForPublish, setSelectedQuizForPublish] = useState<any>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  const currentUserId = String(getStoredUser().userId ?? getStoredUser().id ?? "");

  const mapCategory = (cat: any, courses: any[] = []): Category => ({
    id: cat.id,
    name: cat.categoryName || cat.name || "Untitled",
    arabicName: cat.description || cat.arabicName || "",
    lastUpdated: cat.updatedAt ? new Date(cat.updatedAt).toLocaleString() : "",
    expanded: true,
    courses: courses
      .filter((course) => course.categoryId === cat.id)
      .map((course) => ({
        id: course.id,
        name: course.title || course.name || "Untitled",
        arabicName: course.description || course.arabicName || "",
        lastUpdated: course.updatedAt ? new Date(course.updatedAt).toLocaleString() : "",
        createdBy: course.createdBy,
      })),
  });

  const reloadCatalog = async () => {
    const [cats, courses] = await Promise.all([fetchCategories(), fetchCourses()]);
    setCategories((cats || []).map((cat) => mapCategory(cat, courses || [])));
  };

  useEffect(() => {
    reloadCatalog()
      .catch((error) => {
        console.error("Failed to fetch categories:", error);
        toast.error(t("failedToLoadCategories"));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoadingQuizzes(true);
    fetchQuizzes()
      .then((data) => setQuizzes(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Failed to fetch quizzes:", error))
      .finally(() => setLoadingQuizzes(false));
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error(t("categoryNameIsRequired"));
      return;
    }

    try {
      await createCategory({
        categoryName: newCategoryName.trim(),
        description: newCategoryArabicName || undefined,
      });
      await reloadCatalog();
      setNewCategoryName("");
      setNewCategoryArabicName("");
      setShowCategoryDialog(false);
      toast.success(t("categoryCreatedSuccessfully"));
    } catch (error) {
      console.error("Failed to create category:", error);
      toast.error(t("failedToCreateCategory"));
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) {
      toast.error(t("courseNameIsRequired"));
      return;
    }

    if (!selectedCategoryId) {
      toast.error(t("pleaseSelectACategory"));
      return;
    }

    try {
      await createCourse({
        title: newCourseName.trim(),
        description: newCourseArabicName || undefined,
        categoryId: selectedCategoryId,
        status: "draft",
      });
      await reloadCatalog();
      setNewCourseName("");
      setNewCourseArabicName("");
      setSelectedCategoryId("");
      setShowCourseDialog(false);
      toast.success(t("courseCreatedSuccessfully"));
    } catch (error) {
      console.error("Failed to create course:", error);
      toast.error(t("failedToCreateCourse"));
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      setCategories(categories.filter((cat) => cat.id !== categoryId));
      toast.success(t("categoryDeletedSuccessfully"));
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error(t("failedToDeleteCategory"));
    }
  };

  const handleDeleteCourse = async (categoryId: string, courseId: string) => {
    try {
      await deleteCourse(courseId);
      setCategories(
        categories.map((cat) =>
          cat.id === categoryId
            ? { ...cat, courses: cat.courses.filter((course) => course.id !== courseId) }
            : cat,
        ),
      );
      toast.success(t("courseDeletedSuccessfully"));
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error(t("failedToDeleteCourse"));
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
      toast.error(t("categoryNameIsRequired"));
      return;
    }

    if (!editingCategory) return;

    try {
      await updateCategory(editingCategory.id, {
        categoryName: newCategoryName.trim(),
        description: newCategoryArabicName || undefined,
      });
      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id
            ? {
                ...cat,
                name: newCategoryName,
                arabicName: newCategoryArabicName,
                lastUpdated: new Date().toLocaleString(),
              }
            : cat,
        ),
      );
      setEditingCategory(null);
      setNewCategoryName("");
      setNewCategoryArabicName("");
      setShowCategoryDialog(false);
      toast.success(t("categoryUpdatedSuccessfully"));
    } catch (error) {
      console.error("Failed to update category:", error);
      toast.error(t("failedToUpdateCategory"));
    }
  };

  const handleUpdateCourse = async () => {
    if (!newCourseName.trim()) {
      toast.error(t("courseNameIsRequired"));
      return;
    }

    if (!editingCourse) return;

    try {
      await updateCourse(editingCourse.course.id, {
        title: newCourseName.trim(),
        description: newCourseArabicName || undefined,
      });
      setCategories(
        categories.map((cat) =>
          cat.id === editingCourse.categoryId
            ? {
                ...cat,
                courses: cat.courses.map((course) =>
                  course.id === editingCourse.course.id
                    ? {
                        ...course,
                        name: newCourseName,
                        arabicName: newCourseArabicName,
                        lastUpdated: new Date().toLocaleString(),
                      }
                    : course,
                ),
              }
            : cat,
        ),
      );
      setEditingCourse(null);
      setNewCourseName("");
      setNewCourseArabicName("");
      setShowCourseDialog(false);
      toast.success(t("courseUpdatedSuccessfully"));
    } catch (error) {
      console.error("Failed to update course:", error);
      toast.error(t("failedToUpdateCourse"));
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat,
      ),
    );
  };

  const collapseAll = () => {
    setCategories(categories.map((cat) => ({ ...cat, expanded: false })));
  };

  const handleCreateQuiz = () => {
    setEditingQuizId(null);
    setQuizTitle("");
    setQuizDescription("");
    setQuizTimeLimit(30);
    setQuizPassingScore(70);
    setQuizShowCorrectAnswer(false);
    setQuizQuestions([]);
    setSelectedCourseForQuiz("");
    setShowQuizCreationDialog(true);
  };

  const handleEditQuiz = (quiz: any) => {
    setEditingQuizId(quiz.id);
    setQuizTitle(quiz.quizTitle || quiz.title || "");
    setQuizDescription(quiz.description || "");
    setQuizTimeLimit(Number(quiz.duration ?? quiz.time_limit) || 30);
    setQuizPassingScore(Number(quiz.passingScore ?? quiz.passing_score) || 70);
    setQuizShowCorrectAnswer(Boolean(quiz.showCorrectAnswer ?? quiz.show_correct_answer));
    setQuizQuestions(
      (Array.isArray(quiz.questions) ? quiz.questions : []).map((q: any) => ({
        id: q.id || `q-${Date.now()}-${Math.random()}`,
        text: q.questionText ?? q.text ?? "",
        type: q.questionType ?? q.type ?? "short-answer",
        correctAnswer: q.correctAnswer ?? q.correct_answer ?? "",
        options: Array.isArray(q.options)
          ? q.options.map((opt: any) => ({
              label: opt.label ?? "",
              correct: Boolean(opt.isCorrect ?? opt.correct),
            }))
          : [],
      })),
    );
    setSelectedCourseForQuiz("");
    setShowQuizCreationDialog(true);
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle.trim()) {
      toast.error(t("quizTitleIsRequired"));
      return;
    }

    const isEditing = Boolean(editingQuizId);

    if (!isEditing && !selectedCourseForQuiz) {
      toast.error(t("pleaseSelectACategory"));
      return;
    }

    const payload = {
      quizTitle: quizTitle.trim(),
      description: quizDescription || undefined,
      duration: quizTimeLimit,
      passingScore: quizPassingScore,
      showCorrectAnswer: quizShowCorrectAnswer,
      questions: quizQuestions.map((q, i) => ({
        id: q.id || `q-${Date.now()}-${i}`,
        questionText: q.text,
        questionType: q.type,
        correctAnswer: q.type === "short-answer" || q.type === "long-answer"
          ? q.correctAnswer?.trim() || undefined
          : undefined,
        options: q.type === "single-answer" || q.type === "dropdown"
          ? q.options.map((opt: any) => ({ label: opt.label, isCorrect: opt.correct }))
          : undefined,
      })),
    };

    try {
      if (isEditing) {
        await updateQuiz(editingQuizId, payload);
      } else {
        await createQuiz(payload);
        // Link quiz id onto the selected course content when possible
        try {
          const linkedCourse = categories
            .flatMap(cat => cat.courses)
            .find(course => course.id === selectedCourseForQuiz);
          if (linkedCourse) {
            await updateCourse(selectedCourseForQuiz, {
              content: { quizLinkedAt: new Date().toISOString() },
            });
          }
        } catch {
          // non-blocking
        }
      }
      const data = await fetchQuizzes();
      setQuizzes(Array.isArray(data) ? data : []);
      toast.success(isEditing ? t("quizUpdatedSuccessfully") : t("quizCreatedSuccessfully"));
      setShowQuizCreationDialog(false);
      setEditingQuizId(null);
      setQuizTitle("");
      setQuizDescription("");
      setQuizTimeLimit(30);
      setQuizPassingScore(70);
      setQuizShowCorrectAnswer(false);
      setQuizQuestions([]);
      setSelectedCourseForQuiz("");
    } catch (error) {
      console.error("Failed to save quiz:", error);
      toast.error(isEditing ? t("failedToUpdateQuiz") : t("failedToCreateQuiz"));
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

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm(t("confirmDeleteQuiz"))) return;
    try {
      await deleteQuiz(quizId);
      setQuizzes(quizzes.filter((quiz) => quiz.id !== quizId));
      toast.success(t("quizDeletedSuccessfully"));
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      toast.error(t("failedToDeleteQuiz"));
    }
  };

  const handleSaveQuizAssignment = async () => {
    if (!selectedQuizForAssign) return;

    try {
      const courseId = selectedQuizForAssign.courseId || selectedCourseForQuiz;
      if (!courseId) {
        toast.error(t("pleaseSelectACategory"));
        return;
      }
      await assignCourse(courseId, {});
      toast.success(t("quizAssignedSuccessfully"));
      setShowAssignDialog(false);
      setSelectedQuizForAssign(null);
    } catch (error) {
      console.error("Failed to assign quiz:", error);
      toast.error(t("failedToAssignQuiz"));
    }
  };

  const handlePublishQuizAction = async () => {
    if (!selectedQuizForPublish) return;

    try {
      await updateQuiz(selectedQuizForPublish.id, { isActive: true });
      toast.success(t("quizPublishedSuccessfully"));
      setShowPublishDialog(false);
      setSelectedQuizForPublish(null);
      const data = await fetchQuizzes();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to publish quiz:", error);
      toast.error(t("failedToPublishQuiz"));
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
                <DialogTitle>{editingQuizId ? t('editAssessment') : t('createNewAssessment')}</DialogTitle>
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
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
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

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quizShowCorrectAnswer}
                    onChange={(e) => setQuizShowCorrectAnswer(e.target.checked)}
                  />
                  <span className="text-sm">{t('showCorrectAnswer')}</span>
                </label>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t('quizQuestions')}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setQuizQuestions([
                          ...quizQuestions,
                          { id: `q-${Date.now()}`, text: "", type: "short-answer", options: [] },
                        ])
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('addQuestion')}
                    </Button>
                  </div>

                  {quizQuestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noQuestionsHint')}</p>
                  ) : (
                    quizQuestions.map((q, qIndex) => (
                      <div key={q.id} className="rounded-md border p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder={t('questionTextPlaceholder')}
                            value={q.text}
                            onChange={(e) => {
                              const next = [...quizQuestions];
                              next[qIndex] = { ...q, text: e.target.value };
                              setQuizQuestions(next);
                            }}
                          />
                          <select
                            className="p-2 border rounded-md shrink-0"
                            value={q.type}
                            onChange={(e) => {
                              const next = [...quizQuestions];
                              next[qIndex] = {
                                ...q,
                                type: e.target.value,
                                options: e.target.value === "short-answer" || e.target.value === "long-answer" ? [] : q.options,
                              };
                              setQuizQuestions(next);
                            }}
                          >
                            <option value="short-answer">{t('shortAnswer')}</option>
                            <option value="long-answer">{t('longAnswer')}</option>
                            <option value="dropdown">{t('dropdownQuestion')}</option>
                          </select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive shrink-0"
                            onClick={() =>
                              setQuizQuestions(quizQuestions.filter((_, i) => i !== qIndex))
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {(q.type === "short-answer" || q.type === "long-answer") && (
                          <div className="pl-1">
                            <Label className="text-xs text-muted-foreground">{t('correctAnswer')}</Label>
                            <Input
                              placeholder={t('correctAnswerPlaceholder')}
                              value={q.correctAnswer ?? ""}
                              onChange={(e) => {
                                const next = [...quizQuestions];
                                next[qIndex] = { ...q, correctAnswer: e.target.value };
                                setQuizQuestions(next);
                              }}
                            />
                          </div>
                        )}

                        {(q.type === "dropdown") && (
                          <div className="pl-1 space-y-2">
                            {q.options.map((opt: any, optIndex: number) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={Boolean(opt.correct)}
                                  onChange={() => {
                                    const next = [...quizQuestions];
                                    next[qIndex] = {
                                      ...q,
                                      options: q.options.map((o: any, oi: number) => ({
                                        ...o,
                                        correct: oi === optIndex,
                                      })),
                                    };
                                    setQuizQuestions(next);
                                  }}
                                  title={t('markCorrect')}
                                />
                                <Input
                                  placeholder={t('optionPlaceholder')}
                                  value={opt.label}
                                  onChange={(e) => {
                                    const next = [...quizQuestions];
                                    next[qIndex] = {
                                      ...q,
                                      options: q.options.map((o: any, oi: number) =>
                                        oi === optIndex ? { ...o, label: e.target.value } : o,
                                      ),
                                    };
                                    setQuizQuestions(next);
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive shrink-0"
                                  onClick={() => {
                                    const next = [...quizQuestions];
                                    next[qIndex] = {
                                      ...q,
                                      options: q.options.filter((_: any, oi: number) => oi !== optIndex),
                                    };
                                    setQuizQuestions(next);
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const next = [...quizQuestions];
                                next[qIndex] = {
                                  ...q,
                                  options: [...q.options, { label: "", correct: q.options.length === 0 }],
                                };
                                setQuizQuestions(next);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              {t('addOption')}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowQuizCreationDialog(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleSaveQuiz}>
                    {editingQuizId ? t('saveChanges') : `${t('create')} ${t('assessments').slice(0, -1)}`}
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
                              {(!course.createdBy || course.createdBy === currentUserId) && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteCourse(category.id, course.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
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
                      <h3 className="font-semibold text-purple-800">{quiz.quizTitle || quiz.title}</h3>
                      <p className="text-sm text-purple-600 mt-1">{quiz.description || t('noDescription')}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditQuiz(quiz)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteQuiz(quiz.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
                    <span>{t('time')}: {Number(quiz.duration ?? quiz.time_limit) || 0} min</span>
                    <span>{t('passing')}: {Number(quiz.passingScore ?? quiz.passing_score) || 0}%</span>
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
