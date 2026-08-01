import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Download,
  FileText,
  Play,
  Send,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchAssignedCourses,
  fetchCourse,
  fetchQuizzes,
  submitCourseQuiz,
  updateCourseProgress,
} from "@/lib/courseApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentUserId } from "@/lib/assessmentSubmission";
import { getCurrentUserDisplayName } from "@/lib/processSubmission";
import { downloadCourseCertificate } from "@/lib/courseCertificate";
import type { AssessmentCertificateSettings } from "@/lib/assessmentDraft";

export default function CoursePlayer() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/learning/course/:id");
  const courseId = params?.id ?? "";
  const userId = getCurrentUserId();
  const userName = getCurrentUserDisplayName();

  const [course, setCourse] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [progressRow, setProgressRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const lessons = useMemo(
    () =>
      (course?.content?.lessons ?? []).slice().sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
    [course],
  );

  const quizQuestions = useMemo(() => (quiz?.questions ?? []), [quiz]);

  useEffect(() => {
    if (!courseId || !userId) return;
    Promise.all([fetchCourse(courseId), fetchAssignedCourses(userId), fetchQuizzes()])
      .then(([courseData, assigned, allQuizzes]) => {
        if (!courseData || courseData.status !== "published") {
          toast.error(t("courseNotAvailable"));
          navigate("/learning");
          return;
        }
        const row = assigned.find((item) => item.courseId === courseId);
        if (!row) {
          toast.error(t("courseNotAssigned"));
          navigate("/learning");
          return;
        }
        setCourse(courseData);
        setProgressRow(row);

        const quizId = courseData.quizId ?? courseData.content?.quizId ?? null;
        if (quizId) {
          const found = (allQuizzes ?? []).find((q) => q.id === quizId);
          setQuiz(found ?? null);
        }

        const doneKeys = new Set<string>();
        if (courseData.content?.completedLessons && Array.isArray(courseData.content.completedLessons)) {
          for (const key of courseData.content.completedLessons) doneKeys.add(String(key));
        } else if (courseData.content?.lessonCompletion && Array.isArray(courseData.content.lessonCompletion)) {
          for (const key of courseData.content.lessonCompletion) doneKeys.add(String(key));
        }
        setCompletedLessons(doneKeys);
        const firstLesson = (courseData.content?.lessons ?? [])
          .slice()
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))[0];
        setSelectedLesson(firstLesson ?? null);
      })
      .catch(() => {
        toast.error(t("failedToLoadCourse"));
        navigate("/learning");
      })
      .finally(() => setLoading(false));
  }, [courseId, userId, navigate, t]);

  const percent = useMemo(() => {
    if (lessons.length === 0) return Number(progressRow?.progress ?? 0);
    return Math.round((completedLessons.size / lessons.length) * 100);
  }, [lessons, completedLessons, progressRow]);

  const isCompleted = progressRow?.status === "completed";
  const quizPassed = Boolean(progressRow?.quizScore?.passed);
  const hasQuiz = quizQuestions.length > 0;

  async function persist(nextCompleted: Set<string>) {
    if (!progressRow?.id) return;
    setSaving(true);
    try {
      const allLessonsDone = lessons.length === 0 || nextCompleted.size >= lessons.length;
      const isFullyComplete = allLessonsDone && (!hasQuiz || quizPassed);
      const progress = lessons.length
        ? Math.round((nextCompleted.size / lessons.length) * 100)
        : isFullyComplete
          ? 100
          : 0;
      const status = isFullyComplete ? "completed" : "in_progress";
      const payload: any = { progress, status };
      if (status === "in_progress" && !progressRow.startedAt) payload.startedAt = new Date().toISOString();
      if (status === "completed") payload.completedAt = new Date().toISOString();

      const updated = await updateCourseProgress(progressRow.id, payload);

      const updatedContent = {
        ...(course?.content ?? {}),
        completedLessons: [...nextCompleted],
        lastCompletedAt: new Date().toISOString(),
      };
      const current = course;
      setCourse({ ...current, content: updatedContent });

      const row = updated?.courseId ? updated : progressRow;
      const patched = { ...row, ...updated, progress, status };
      if (updated?.course) patched.course = updated.course;
      setProgressRow(patched);
    } catch {
      toast.error(t("failedToSaveProgress"));
    } finally {
      setSaving(false);
    }
  }

  function autoCompleteLesson(lessonKey: string) {
    const next = new Set(completedLessons);
    if (next.has(lessonKey)) return;
    next.add(lessonKey);
    setCompletedLessons(next);
    void persist(next);
  }

  async function handleSubmitQuiz() {
    if (!progressRow?.id || quizQuestions.length === 0) return;
    setSubmittingQuiz(true);
    try {
      const result = await submitCourseQuiz(progressRow.id, answers, lessons.length === 0 || completedLessons.size >= lessons.length);
      setQuizResult(result);
      const allLessonsDone = lessons.length === 0 || completedLessons.size >= lessons.length;
      const isFullyComplete = allLessonsDone && result.passed;
      setProgressRow((prev: any) => ({
        ...prev,
        status: isFullyComplete ? "completed" : "in_progress",
        completedAt: isFullyComplete ? new Date().toISOString() : prev.completedAt,
        progress: isFullyComplete ? 100 : Math.min(prev.progress ?? 0, lessons.length ? Math.round((completedLessons.size / lessons.length) * 100) : prev.progress ?? 0),
        quizScore: { percentage: result.percentage, passed: result.passed },
      }));
    } catch (error: any) {
      toast.error(error.message || t("failedToSubmitQuiz"));
    } finally {
      setSubmittingQuiz(false);
    }
  }

  function handleDownloadCertificate() {
    downloadCourseCertificate({
      userName,
      courseTitle: course.title,
      score: progressRow?.quizScore?.percentage ?? progressRow?.progress ?? 100,
      completedAt: new Date(progressRow?.completedAt ?? Date.now()),
      settings: (course?.content?.certificateSettings as AssessmentCertificateSettings) ?? undefined,
    });
  }

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground">{t("loadingCourse")}</div>
    );
  }

  if (!course) return null;

  return (
    <div className="p-6 space-y-6 bg-white min-h-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" className="gap-2" onClick={() => navigate("/learning")}>
            <ArrowLeft className="h-4 w-4" />
            {t("backToLearning")}
          </Button>
          <div className="flex items-center gap-2">
            {isCompleted && <Badge className="gap-1"><Trophy className="h-3 w-3" />{t("completed")}</Badge>}
            {isCompleted && (
              <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadCertificate}>
                <Download className="h-4 w-4" />
                {t("downloadCertificate")}
              </Button>
            )}
            <Badge variant={isCompleted ? "default" : "secondary"}>
              {t("progressLabel")} {percent}%
            </Badge>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="border-sky-100">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-sky-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">{course.title}</CardTitle>
                {course.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{course.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-3 w-full bg-sky-100 rounded-full overflow-hidden">
              <div className="h-full gradient-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {t("lessonsCompleted")} {completedLessons.size}/{lessons.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {lessons.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="border-sky-100">
            <CardHeader>
              <CardTitle className="text-lg">{t("courseLessons")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {lessons.map((lesson: any, index: number) => {
                  const key = String(lesson.id ?? lesson.order ?? lesson.name);
                  const done = completedLessons.has(key);
                  const type = String(lesson.type ?? "").split("/")[0];
                  const isVideo = type === "video" || type === "audio";
                  const active = selectedLesson?.id === lesson.id;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedLesson(lesson)}
                      className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        active
                          ? "border-sky-400 bg-sky-50 ring-1 ring-sky-200"
                          : done
                            ? "border-sky-200 bg-sky-50/60"
                            : "border-slate-200 bg-white hover:border-sky-200"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                        {done ? (
                          <CheckCircle className="w-5 h-5 text-sky-600" />
                        ) : isVideo ? (
                          <Play className="w-5 h-5 text-slate-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {index + 1}. {lesson.name}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-300 rotate-[-90deg]" />
                    </button>
                  );
                })}
              </div>

              {selectedLesson && (
                <div className="rounded-lg border border-sky-100 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{selectedLesson.name}</p>
                    {selectedLesson.downloadEnabled && selectedLesson.url && (
                      <a href={selectedLesson.url} target="_blank" rel="noreferrer" className="text-sm text-sky-600 hover:underline">
                        {t("downloadLesson")}
                      </a>
                    )}
                  </div>
                  <LessonMedia
                    lesson={selectedLesson}
                    t={t}
                    onViewed={() => autoCompleteLesson(String(selectedLesson.id ?? selectedLesson.order ?? selectedLesson.name))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {hasQuiz && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="border-sky-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-sky-600" />
                  {quiz.quizTitle || quiz.title}
                </CardTitle>
                {quizPassed && <Badge className="gap-1"><Trophy className="h-3 w-3" />{t("quizPassed")}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {quizResult ? (
                <div className={`rounded-lg border p-5 ${quizResult.passed ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                  <p className={`text-lg font-bold ${quizResult.passed ? "text-emerald-700" : "text-red-700"}`}>
                    {quizResult.passed ? t("quizPassed") : t("quizFailed")} — {quizResult.percentage}%
                  </p>
                  {quizResult.passed && (
                    <Button className="mt-3 gap-2" onClick={handleDownloadCertificate}>
                      <Download className="h-4 w-4" />
                      {t("downloadCertificate")}
                    </Button>
                  )}
                </div>
              ) : quizPassed ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-emerald-700 font-medium">{t("quizAlreadyPassed")}</p>
                  <Button className="mt-3 gap-2" onClick={handleDownloadCertificate}>
                    <Download className="h-4 w-4" />
                    {t("downloadCertificate")}
                  </Button>
                </div>
              ) : (
                <>
                  {quizQuestions.map((q: any, index: number) => (
                    <QuizQuestion
                      key={q.id || index}
                      question={q}
                      index={index}
                      value={answers[q.id ?? q.questionText]}
                      onChange={(value) =>
                        setAnswers((prev) => ({ ...prev, [q.id ?? q.questionText]: value }))
                      }
                    />
                  ))}
                  <Button className="gap-2" onClick={handleSubmitQuiz} disabled={submittingQuiz}>
                    <Send className="h-4 w-4" />
                    {submittingQuiz ? t("submittingQuiz") : t("submitQuiz")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function LessonMedia({ lesson, t, onViewed }: { lesson: any; t: (key: string) => string; onViewed?: () => void }) {
  if (!lesson.url) {
    return <p className="text-sm text-muted-foreground">{t("lessonNoContent")}</p>;
  }
  const type = String(lesson.type ?? "").split("/")[0];
  if (type === "video") {
    return (
      <video
        controls
        className="w-full max-h-96 rounded-lg bg-black"
        src={lesson.url}
        onEnded={() => onViewed?.()}
      >
        {t("videoUnsupported")}
      </video>
    );
  }
  if (type === "image") {
    return <img src={lesson.url} alt={lesson.name} className="w-full max-h-96 object-contain rounded-lg bg-white" onLoad={() => onViewed?.()} />;
  }
  if (String(lesson.type) === "application/pdf") {
    return (
      <iframe src={lesson.url} title={lesson.name} className="w-full h-96 rounded-lg bg-white" onLoad={() => onViewed?.()} />
    );
  }
  return (
    <a
      href={lesson.url}
      target="_blank"
      rel="noreferrer"
      className="text-sky-600 hover:underline"
      onClick={() => onViewed?.()}
    >
      {t("openLessonFile")}
    </a>
  );
}

function QuizQuestion({
  question,
  index,
  value,
  onChange,
}: {
  question: any;
  index: number;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const options = Array.isArray(question.options) ? question.options : [];
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-4">
      <Label className="text-sm font-medium">
        {index + 1}. {question.questionText}
      </Label>
      {question.questionType === "long-answer" ? (
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer"
        />
      ) : question.questionType === "short-answer" ? (
        <Input
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer"
        />
      ) : (
        <select
          className="w-full p-2 border rounded-md"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select an option</option>
          {options.map((opt: any, i: number) => (
            <option key={i} value={opt.label}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
