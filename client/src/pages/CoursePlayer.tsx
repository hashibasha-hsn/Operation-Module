import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle, ChevronDown, FileText, Play, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAssignedCourses, fetchCourse, updateCourseProgress } from "@/lib/courseApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentUserId } from "@/lib/assessmentSubmission";

export default function CoursePlayer() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/learning/course/:id");
  const courseId = params?.id ?? "";
  const userId = getCurrentUserId();

  const [course, setCourse] = useState<any>(null);
  const [progressRow, setProgressRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const lessons = useMemo(
    () =>
      (course?.content?.lessons ?? []).slice().sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
    [course],
  );

  useEffect(() => {
    if (!courseId || !userId) return;
    Promise.all([fetchCourse(courseId), fetchAssignedCourses(userId)])
      .then(([courseData, assigned]) => {
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

        const doneKeys = new Set<string>();
        if (courseData.content?.completedLessons && Array.isArray(courseData.content.completedLessons)) {
          for (const key of courseData.content.completedLessons) doneKeys.add(String(key));
        } else if (courseData.content?.lessonCompletion && Array.isArray(courseData.content.lessonCompletion)) {
          for (const key of courseData.content.lessonCompletion) doneKeys.add(String(key));
        }
        setCompletedLessons(doneKeys);
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

  async function persist(nextCompleted: Set<string>) {
    if (!progressRow?.id) return;
    setSaving(true);
    try {
      const progress = lessons.length ? Math.round((nextCompleted.size / lessons.length) * 100) : 100;
      const status = lessons.length > 0 && nextCompleted.size >= lessons.length ? "completed" : progressRow.status === "completed" ? "completed" : "in_progress";
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

  function toggleLesson(lessonId: string) {
    const next = new Set(completedLessons);
    if (next.has(lessonId)) next.delete(lessonId);
    else next.add(lessonId);
    setCompletedLessons(next);
    void persist(next);
  }

  function markAllComplete() {
    const next = new Set(lessons.map((l: any) => String(l.id ?? l.order ?? l.name)));
    setCompletedLessons(next);
    void persist(next);
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
              {lessons.length > 0 && !isCompleted && (
                <Button variant="outline" size="sm" className="gap-2" onClick={markAllComplete} disabled={saving}>
                  <CheckCircle className="h-4 w-4" />
                  {t("markAllComplete")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <Card className="border-sky-100">
          <CardHeader>
            <CardTitle className="text-lg">{t("courseLessons")}</CardTitle>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noLessonsInCourse")}</p>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson: any, index: number) => {
                  const key = String(lesson.id ?? lesson.order ?? lesson.name);
                  const done = completedLessons.has(key);
                  const type = String(lesson.type ?? "").split("/")[0];
                  const isVideo = type === "video" || type === "audio";
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleLesson(key)}
                      disabled={saving}
                      className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        done
                          ? "border-sky-300 bg-sky-50"
                          : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50"
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
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
