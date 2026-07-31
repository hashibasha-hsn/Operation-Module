import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Upload, 
  Paperclip, 
  Lightbulb, 
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Save,
  X,
  Percent,
  FileText,
  Clock,
  Eye,
  EyeOff,
  Award,
  RefreshCw,
  BookOpen,
  Calendar,
  Timer,
  Layers,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  createCourse,
  assignCourse,
  fetchCategories,
  fetchStores,
  fetchProfiles,
  type CoursePayload,
  type CategoryResponse,
} from "@/lib/courseApi";
import { useLanguage } from "@/contexts/LanguageContext";

interface Lesson {
  id: string;
  name: string;
  file: File | null;
  type: string;
  downloadEnabled: boolean;
}

interface CourseData {
  name: string;
  category: string;
  description: string;
  estimatedReadTime: string;
  pageViewDuration: string;
  showInSequence: boolean;
  startDate: string;
  endDate: string;
  lessons: Lesson[];
  quizSettings: {
    minimumPassingPercentage: string;
    maximumAttempts: string;
    quizStartDate: string;
    quizEndDate: string;
    duration: string;
    visible: boolean;
    showResult: boolean;
    showCorrectAnswer: boolean;
    generateCertificate: boolean;
    disableReattemptAfterPassing: boolean;
  };
}

const STEPS = [
  { id: 1, labelKey: 'courseSetup' },
  { id: 2, labelKey: 'quizzes' },
  { id: 3, labelKey: 'contentAndLessons' },
  { id: 4, labelKey: 'publishAndAssign' },
];

export default function CourseCreation() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [courseData, setCourseData] = useState<CourseData>({
    name: "",
    category: "",
    description: "",
    estimatedReadTime: "",
    pageViewDuration: "",
    showInSequence: false,
    startDate: "",
    endDate: "",
    lessons: [],
    quizSettings: {
      minimumPassingPercentage: "30",
      maximumAttempts: "1",
      quizStartDate: "",
      quizEndDate: "",
      duration: "01:00",
      visible: true,
      showResult: false,
      showCorrectAnswer: false,
      generateCertificate: false,
      disableReattemptAfterPassing: false,
    },
  });
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchStores().then(setStores).catch(() => {});
    fetchProfiles().then(setProfiles).catch(() => {});
  }, []);

  function buildPayload(status: 'draft' | 'published'): CoursePayload {
    return {
      title: courseData.name,
      description: courseData.description || undefined,
      categoryId: courseData.category || undefined,
      status,
      generateCertificate: courseData.quizSettings.generateCertificate,
      publishedAt: status === 'published' ? new Date().toISOString() : undefined,
      expiresAt: courseData.endDate ? new Date(courseData.endDate).toISOString() : undefined,
      content: {
        estimatedReadTime: courseData.estimatedReadTime ? Number(courseData.estimatedReadTime) : undefined,
        pageViewDuration: courseData.pageViewDuration ? Number(courseData.pageViewDuration) : undefined,
        showInSequence: courseData.showInSequence,
        startDate: courseData.startDate || undefined,
        endDate: courseData.endDate || undefined,
        lessons: courseData.lessons.map((l, i) => ({
          order: i,
          name: l.name,
          type: l.type,
          downloadEnabled: l.downloadEnabled,
        })),
        quizSettings: {
          minimumPassingPercentage: Number(courseData.quizSettings.minimumPassingPercentage) || 30,
          maximumAttempts: Number(courseData.quizSettings.maximumAttempts) || 1,
          quizStartDate: courseData.quizSettings.quizStartDate || undefined,
          quizEndDate: courseData.quizSettings.quizEndDate || undefined,
          duration: courseData.quizSettings.duration,
          visible: courseData.quizSettings.visible,
          showResult: courseData.quizSettings.showResult,
          showCorrectAnswer: courseData.quizSettings.showCorrectAnswer,
          disableReattemptAfterPassing: courseData.quizSettings.disableReattemptAfterPassing,
        },
      },
    };
  }

  async function saveCourse(status: 'draft' | 'published') {
    if (!courseData.name.trim()) {
      toast.error(t('courseNameRequired'));
      return;
    }

    const isPublish = status === 'published';
    const setLoading = isPublish ? setPublishing : setSaving;
    setLoading(true);

    try {
      const created = await createCourse(buildPayload(status));

      if (selectedStoreIds.length > 0 || selectedProfileIds.length > 0) {
        await assignCourse(created.id, {
          storeIds: selectedStoreIds.length > 0 ? selectedStoreIds : undefined,
          assigneeProfiles: selectedProfileIds.length > 0
            ? { profileIds: selectedProfileIds }
            : undefined,
        });
      }

      toast.success(isPublish ? t('coursePublishedSuccess') : t('courseSavedAsDraft'));
      navigate("/categories-and-courses");
    } catch (err: any) {
      toast.error(err.message || t('failedToSaveCourse'));
    } finally {
      setLoading(false);
    }
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      saveCourse('published');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const newLessons: Lesson[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      file: file,
      type: file.type,
      downloadEnabled: true,
    }));

    setCourseData({
      ...courseData,
      lessons: [...courseData.lessons, ...newLessons],
    });

    toast.success(`${files.length} ${t('filesUploaded')}`);
  };

  const removeLesson = (lessonId: string) => {
    setCourseData({
      ...courseData,
      lessons: courseData.lessons.filter(lesson => lesson.id !== lessonId),
    });
  };

  const toggleDownload = (lessonId: string) => {
    setCourseData({
      ...courseData,
      lessons: courseData.lessons.map(lesson =>
        lesson.id === lessonId
          ? { ...lesson, downloadEnabled: !lesson.downloadEnabled }
          : lesson
      ),
    });
  };

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStoreIds(prev =>
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const toggleProfileSelection = (profileId: string) => {
    setSelectedProfileIds(prev =>
      prev.includes(profileId) ? prev.filter(id => id !== profileId) : [...prev, profileId]
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderCourseSetup();
      case 2:
        return renderQuizSetup();
      case 3:
        return renderContentLessons();
      case 4:
        return renderPublishAssign();
      default:
        return null;
    }
  };

  const renderCourseSetup = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('courseSetup')}</h2>
        <p className="text-muted-foreground">{t('courseSetupDesc')}</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="courseName" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {t('courseNameRequired')}
          </Label>
          <Input
            id="courseName"
            placeholder={t('enterCourseName')}
            value={courseData.name}
            onChange={(e) => setCourseData({ ...courseData, name: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">{t('courseNameHint')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            {t('categoryRequired')}
          </Label>
          <select
            id="category"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={courseData.category}
            onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
          >
            <option value="">{t('selectCategory')}</option>
            {categories.length > 0
              ? categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName}
                  </option>
                ))
              : <>
                  <option value="personal-hygiene">{t('personalHygiene')}</option>
                  <option value="food-safety">{t('foodSafety')}</option>
                  <option value="customer-service">{t('customerService')}</option>
                </>
            }
          </select>
          <p className="text-sm text-muted-foreground">{t('categoryHint')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('description')}
          </Label>
          <Textarea
            id="description"
            placeholder={t('enterCourseDescription')}
            value={courseData.description}
            onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
            rows={4}
          />
          <p className="text-sm text-muted-foreground">{t('descriptionHint')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="readTime" className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              {t('estimatedReadTime')}
            </Label>
            <Input
              id="readTime"
              type="number"
              placeholder={t('estimatedReadTimePlaceholder')}
              value={courseData.estimatedReadTime}
              onChange={(e) => setCourseData({ ...courseData, estimatedReadTime: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">{t('estimatedReadTimeHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="viewDuration" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('pageViewDuration')}
            </Label>
            <Input
              id="viewDuration"
              type="number"
              placeholder={t('pageViewDurationPlaceholder')}
              value={courseData.pageViewDuration}
              onChange={(e) => setCourseData({ ...courseData, pageViewDuration: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">{t('pageViewDurationHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('startDate')}
            </Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={courseData.startDate}
              onChange={(e) => setCourseData({ ...courseData, startDate: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">{t('startDateHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('endDate')}
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={courseData.endDate}
              onChange={(e) => setCourseData({ ...courseData, endDate: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">{t('endDateHint')}</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="showInSequence" className="flex items-center gap-2 cursor-pointer">
              <Layers className="w-4 h-4" />
              {t('showInSequence')}
            </Label>
            <p className="text-sm text-muted-foreground">{t('showInSequenceHint')}</p>
          </div>
          <Switch
            id="showInSequence"
            checked={courseData.showInSequence}
            onCheckedChange={(checked) => setCourseData({ ...courseData, showInSequence: checked })}
          />
        </div>
      </div>
    </div>
  );

  const renderQuizSetup = () => (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('quizSetup')}</h2>
        <p className="text-muted-foreground">{t('quizSetupDesc')}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="minPassingPercentage" className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            {t('minimumPassingPercentage')}
          </Label>
          <Input
            id="minPassingPercentage"
            type="number"
            placeholder="30"
            value={courseData.quizSettings.minimumPassingPercentage}
            onChange={(e) => setCourseData({
              ...courseData,
              quizSettings: { ...courseData.quizSettings, minimumPassingPercentage: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAttempts" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('maximumAttempts')}
          </Label>
          <Input
            id="maxAttempts"
            type="number"
            placeholder="1"
            value={courseData.quizSettings.maximumAttempts}
            onChange={(e) => setCourseData({
              ...courseData,
              quizSettings: { ...courseData.quizSettings, maximumAttempts: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quizStartDate" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('quizStartDate')}
          </Label>
          <Input
            id="quizStartDate"
            type="datetime-local"
            value={courseData.quizSettings.quizStartDate}
            onChange={(e) => setCourseData({
              ...courseData,
              quizSettings: { ...courseData.quizSettings, quizStartDate: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quizEndDate" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('quizEndDate')}
          </Label>
          <Input
            id="quizEndDate"
            type="datetime-local"
            value={courseData.quizSettings.quizEndDate}
            onChange={(e) => setCourseData({
              ...courseData,
              quizSettings: { ...courseData.quizSettings, quizEndDate: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('duration')}
          </Label>
          <Input
            id="duration"
            placeholder="01:00"
            value={courseData.quizSettings.duration}
            onChange={(e) => setCourseData({
              ...courseData,
              quizSettings: { ...courseData.quizSettings, duration: e.target.value }
            })}
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="visible" className="flex items-center gap-2 cursor-pointer">
                <Eye className="w-4 h-4" />
                {t('visible')}
              </Label>
            </div>
            <Switch
              id="visible"
              checked={courseData.quizSettings.visible}
              onCheckedChange={(checked) => setCourseData({
                ...courseData,
                quizSettings: { ...courseData.quizSettings, visible: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showResult" className="flex items-center gap-2 cursor-pointer">
                <EyeOff className="w-4 h-4" />
                {t('showResult')}
              </Label>
            </div>
            <Switch
              id="showResult"
              checked={courseData.quizSettings.showResult}
              onCheckedChange={(checked) => setCourseData({
                ...courseData,
                quizSettings: { ...courseData.quizSettings, showResult: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showCorrectAnswer" className="flex items-center gap-2 cursor-pointer">
                <FileText className="w-4 h-4" />
                {t('showCorrectAnswer')}
              </Label>
            </div>
            <Switch
              id="showCorrectAnswer"
              checked={courseData.quizSettings.showCorrectAnswer}
              onCheckedChange={(checked) => setCourseData({
                ...courseData,
                quizSettings: { ...courseData.quizSettings, showCorrectAnswer: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="generateCertificate" className="flex items-center gap-2 cursor-pointer">
                <Award className="w-4 h-4" />
                {t('generateCertificate')}
              </Label>
            </div>
            <Switch
              id="generateCertificate"
              checked={courseData.quizSettings.generateCertificate}
              onCheckedChange={(checked) => setCourseData({
                ...courseData,
                quizSettings: { ...courseData.quizSettings, generateCertificate: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="disableReattempt" className="flex items-center gap-2 cursor-pointer">
                <RefreshCw className="w-4 h-4" />
                {t('disableReattemptAfterPassing')}
              </Label>
            </div>
            <Switch
              id="disableReattempt"
              checked={courseData.quizSettings.disableReattemptAfterPassing}
              onCheckedChange={(checked) => setCourseData({
                ...courseData,
                quizSettings: { ...courseData.quizSettings, disableReattemptAfterPassing: checked }
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContentLessons = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('uploadContentAndCreateLessons')}</h2>
        <p className="text-muted-foreground">{t('uploadContentDesc')}</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="fileUpload"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.ppt,.pptx,.xlsx,.mp4"
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="fileUpload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">{t('uploadCourseContent')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('uploadContentHint')}
          </p>
          <Paperclip className="w-8 h-8 mx-auto text-muted-foreground" />
        </label>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">{t('courseLessons')}</h3>
        
        {courseData.lessons.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('noData')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {courseData.lessons.map((lesson, index) => (
              <Card key={lesson.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{lesson.name}</p>
                        <p className="text-sm text-muted-foreground">{lesson.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleDownload(lesson.id)}
                        title={lesson.downloadEnabled ? t('disableDownload') : t('enableDownload')}
                      >
                        <Upload className={`w-4 h-4 ${lesson.downloadEnabled ? "text-primary" : "text-muted-foreground"}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLesson(lesson.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-900">{t('proTip')}</p>
          <p className="text-sm text-amber-800">
            {t('reorderLessonsHint')}
          </p>
        </div>
      </div>
    </div>
  );

  const renderPublishAssign = () => (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('publishAndAssign')}</h2>
        <p className="text-muted-foreground">{t('publishAndAssignDesc')}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{t('courseSummary')}</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">{t('nameLabel')}</span> {courseData.name || t('notSet')}</p>
              <p>
                <span className="text-muted-foreground">{t('categoryLabel')}</span>{' '}
                {categories.find(c => c.id === courseData.category)?.categoryName || courseData.category || t('notSet')}
              </p>
              <p><span className="text-muted-foreground">{t('lessonsLabel')}</span> {courseData.lessons.length}</p>
              <p><span className="text-muted-foreground">{t('descriptionLabel')}</span> {courseData.description || t('notSet')}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">{t('assignByStore')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('assignByStoreHint')}</p>
            {stores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>{t('noStoresAvailable')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {stores.map((store) => {
                  const selected = selectedStoreIds.includes(store.id);
                  return (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => toggleStoreSelection(store.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-left text-sm transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                      }`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="truncate">{store.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedStoreIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">{selectedStoreIds.length}{t('storesSelected')}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">{t('assigneeProfiles')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('assigneeProfilesHint')}</p>
            {profiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>{t('noProfilesAvailable')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {profiles.map((profile) => {
                  const selected = selectedProfileIds.includes(profile.id);
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => toggleProfileSelection(profile.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-left text-sm transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                      }`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="truncate">{profile.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedProfileIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">{selectedProfileIds.length}{t('profilesSelected')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/categories-and-courses")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">{t('createCourse')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => saveCourse('draft')} disabled={saving || publishing}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t('saveDraft')}
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === step.id
                        ? "bg-primary text-primary-foreground"
                        : currentStep > step.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? "✓" : step.id}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      currentStep === step.id ? "text-primary font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {t(step.labelKey)}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {renderStep()}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('previous')}
          </Button>
          <Button onClick={handleNext} disabled={saving || publishing}>
            {publishing && currentStep === 4 && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {currentStep === 4 ? t('publishCourse') : t('next')}
            {currentStep < 4 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
