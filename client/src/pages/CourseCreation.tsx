import { useState } from "react";
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
  Layers
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

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
  { id: 1, label: "Course Setup" },
  { id: 2, label: "Quizzes" },
  { id: 3, label: "Content & Lessons" },
  { id: 4, label: "Publish & Assign" },
];

export default function CourseCreation() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
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

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSave();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    toast.success("Course created successfully!");
    navigate("/categories-and-courses");
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

    toast.success(`${files.length} file(s) uploaded successfully`);
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
        <h2 className="text-2xl font-bold mb-2">Course Setup</h2>
        <p className="text-muted-foreground">Fill in the basic details for your course</p>
      </div>

      <div className="space-y-6">
        {/* Course Name */}
        <div className="space-y-2">
          <Label htmlFor="courseName" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Course Name *
          </Label>
          <Input
            id="courseName"
            placeholder="Enter course name"
            value={courseData.name}
            onChange={(e) => setCourseData({ ...courseData, name: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">The name that will be displayed to users</p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Category *
          </Label>
          <select
            id="category"
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={courseData.category}
            onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
          >
            <option value="">Select a category</option>
            <option value="personal-hygiene">Personal Hygiene</option>
            <option value="food-safety">Food Safety</option>
            <option value="customer-service">Customer Service</option>
          </select>
          <p className="text-sm text-muted-foreground">Organize your course into categories</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Enter course description"
            value={courseData.description}
            onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
            rows={4}
          />
          <p className="text-sm text-muted-foreground">Provide a brief overview of the course content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estimated Read Time */}
          <div className="space-y-2">
            <Label htmlFor="readTime" className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Estimated Read Time (seconds) *
            </Label>
            <Input
              id="readTime"
              type="number"
              placeholder="e.g., 300"
              value={courseData.estimatedReadTime}
              onChange={(e) => setCourseData({ ...courseData, estimatedReadTime: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">Time users should spend reading the content</p>
          </div>

          {/* Page View Duration */}
          <div className="space-y-2">
            <Label htmlFor="viewDuration" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Page View Duration (seconds) *
            </Label>
            <Input
              id="viewDuration"
              type="number"
              placeholder="e.g., 60"
              value={courseData.pageViewDuration}
              onChange={(e) => setCourseData({ ...courseData, pageViewDuration: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">Minimum time a page must be viewed</p>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Start Date
            </Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={courseData.startDate}
              onChange={(e) => setCourseData({ ...courseData, startDate: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">When the course becomes available</p>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              End Date
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={courseData.endDate}
              onChange={(e) => setCourseData({ ...courseData, endDate: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">When the course closes</p>
          </div>
        </div>

        {/* Show in Sequence */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="showInSequence" className="flex items-center gap-2 cursor-pointer">
              <Layers className="w-4 h-4" />
              Show in Sequence
            </Label>
            <p className="text-sm text-muted-foreground">Users must complete one content + quiz before seeing the next</p>
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
        <h2 className="text-2xl font-bold mb-2">Quiz Setup</h2>
        <p className="text-muted-foreground">Configure quiz settings and parameters</p>
      </div>

      <div className="space-y-4">
        {/* Minimum Passing Percentage */}
        <div className="space-y-2">
          <Label htmlFor="minPassingPercentage" className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Minimum Passing Percentage
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

        {/* Maximum Attempts */}
        <div className="space-y-2">
          <Label htmlFor="maxAttempts" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Maximum Attempts
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

        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="quizStartDate" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Start Date
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

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="quizEndDate" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            End Date
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

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Duration
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

        {/* Toggle Settings */}
        <div className="space-y-4 pt-4 border-t">
          {/* Visible */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="visible" className="flex items-center gap-2 cursor-pointer">
                <Eye className="w-4 h-4" />
                Visible
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

          {/* Show Result */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showResult" className="flex items-center gap-2 cursor-pointer">
                <EyeOff className="w-4 h-4" />
                Show Result
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

          {/* Show Correct Answer */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showCorrectAnswer" className="flex items-center gap-2 cursor-pointer">
                <FileText className="w-4 h-4" />
                Show Correct Answer
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

          {/* Generate Certificate */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="generateCertificate" className="flex items-center gap-2 cursor-pointer">
                <Award className="w-4 h-4" />
                Generate Certificate
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

          {/* Disable Reattempt After Passing */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="disableReattempt" className="flex items-center gap-2 cursor-pointer">
                <RefreshCw className="w-4 h-4" />
                Disable Reattempt After Passing
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
        <h2 className="text-2xl font-bold mb-2">Upload Content & Create Lessons</h2>
        <p className="text-muted-foreground">Upload your course materials and organize them into lessons with custom sequencing.</p>
      </div>

      {/* Upload Area */}
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
          <h3 className="text-lg font-semibold mb-2">Upload Course Content</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop files or click to browse. Supports videos, PDFs, documents, and images.
          </p>
          <Paperclip className="w-8 h-8 mx-auto text-muted-foreground" />
        </label>
      </div>

      {/* Course Lessons Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Course Lessons</h3>
        
        {courseData.lessons.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No data</p>
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
                        title={lesson.downloadEnabled ? "Disable download" : "Enable download"}
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

      {/* Pro Tip */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-900">Pro tip:</p>
          <p className="text-sm text-amber-800">
            Drag lessons to reorder them. Use the download icon to enable/disable downloads for individual lessons.
          </p>
        </div>
      </div>
    </div>
  );

  const renderPublishAssign = () => (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Publish & Assign</h2>
        <p className="text-muted-foreground">Review your course and assign it to users</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Course Summary</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {courseData.name || "Not set"}</p>
              <p><span className="text-muted-foreground">Category:</span> {courseData.category || "Not set"}</p>
              <p><span className="text-muted-foreground">Lessons:</span> {courseData.lessons.length}</p>
              <p><span className="text-muted-foreground">Description:</span> {courseData.description || "Not set"}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Assign by Store</h3>
            <p className="text-sm text-muted-foreground mb-4">Select stores to assign this course to</p>
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>Store selection coming soon</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Assignee Profiles</h3>
            <p className="text-sm text-muted-foreground mb-4">Select user profiles to auto-assign this course</p>
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>Profile selection coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/categories-and-courses")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Create Course</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Progress Stepper */}
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
                    {step.label}
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

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button onClick={handleNext}>
            {currentStep === 4 ? "Publish Course" : "Next"}
            {currentStep < 4 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
