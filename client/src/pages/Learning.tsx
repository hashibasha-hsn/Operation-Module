import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Trophy, Clock, CheckCircle, Book, Star, TrendingUp, Play } from "lucide-react";
import { fetchAssignedAssessments } from "@/lib/assessmentApi";
import {
  countCompletedAttempts,
  fetchUserAssessmentResults,
  getCurrentUserId,
  getInProgressResult,
  getLatestResultForAssessment,
} from "@/lib/assessmentSubmission";

function getAssessmentStatus(assessment: any, results: any[]) {
  const inProgress = getInProgressResult(results, assessment.id);
  if (inProgress) return { label: "In Progress", variant: "secondary" as const };

  const latest = getLatestResultForAssessment(
    results.filter((item) => item.assessmentId === assessment.id && item.status === "completed"),
    assessment.id,
  );
  if (latest?.passed) return { label: "Passed", variant: "default" as const };
  if (latest) return { label: "Failed", variant: "destructive" as const };

  return { label: "Not Started", variant: "outline" as const };
}

export default function Learning() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("courses");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const userId = getCurrentUserId();

  useEffect(() => {
    if (!userId) {
      setLoadingAssessments(false);
      return;
    }
    Promise.all([fetchAssignedAssessments(userId), fetchUserAssessmentResults(userId)])
      .then(([assigned, userResults]) => {
        setAssessments(Array.isArray(assigned) ? assigned : []);
        setResults(Array.isArray(userResults) ? userResults : []);
      })
      .finally(() => setLoadingAssessments(false));
  }, [userId]);

  const passedCount = useMemo(
    () => results.filter((item) => item.status === "completed" && item.passed).length,
    [results],
  );

  return (
    <div className="p-6 space-y-6 bg-white min-h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-slate-900">Learning & Development</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Key Highlights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <HighlightCard icon={Trophy} label="Assessments Passed" value={String(passedCount)} tooltip="Passed assessments" delay={0.2} />
          <HighlightCard icon={Clock} label="Time Spent" value="-" tooltip="View time spent learning" delay={0.25} />
          <HighlightCard icon={CheckCircle} label="Completed Courses" value="-" tooltip="View completed courses" delay={0.3} />
          <HighlightCard icon={Book} label="Total Courses" value="-" tooltip="View all courses" delay={0.35} />
          <HighlightCard icon={Star} label="Total Score" value="-" tooltip="View total score" delay={0.4} />
          <HighlightCard icon={TrendingUp} label="Learning Progress" value="-" tooltip="View learning progress" delay={0.45} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-sky-100 rounded-lg p-1">
            <TabsTrigger
              value="courses"
              className="data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:border-transparent border border-transparent rounded-md px-6 py-2"
            >
              Courses
            </TabsTrigger>
            <TabsTrigger
              value="assessments"
              className="data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:border-transparent border border-transparent rounded-md px-6 py-2"
            >
              Assessment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-6">
            <EmptyState message="No courses assigned yet" />
          </TabsContent>

          <TabsContent value="assessments" className="mt-6">
            {loadingAssessments ? (
              <p className="text-muted-foreground">Loading assessments...</p>
            ) : assessments.length === 0 ? (
              <EmptyState message="No assessments assigned to you" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {assessments.map((assessment) => {
                  const status = getAssessmentStatus(assessment, results);
                  const attempts = countCompletedAttempts(results, assessment.id);
                  const latest = getLatestResultForAssessment(
                    results.filter(
                      (item) => item.assessmentId === assessment.id && item.status === "completed",
                    ),
                    assessment.id,
                  );

                  return (
                    <Card key={assessment.id} className="border-sky-100">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg">{assessment.title}</CardTitle>
                            {assessment.description && (
                              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                {assessment.description}
                              </p>
                            )}
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                          Pass: {assessment.passingScore ?? 0}%
                          {latest?.percentage != null && ` · Last score: ${latest.percentage}%`}
                          {attempts > 0 && ` · Attempts: ${attempts}/${assessment.maxAttempts ?? 1}`}
                        </div>
                        <Button
                          className="gap-2"
                          onClick={() => navigate(`/learning/assessment/${assessment.id}`)}
                        >
                          <Play className="h-4 w-4" />
                          {status.label === "In Progress" ? "Continue" : "Start"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function HighlightCard({
  icon: Icon,
  label,
  value,
  tooltip,
  delay,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  tooltip: string;
  delay: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay }}
          className="bg-white border border-sky-100 rounded-lg p-4 shadow-sm cursor-pointer hover:border-sky-200 hover:shadow-md hover:shadow-sky-500/5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
              <Icon className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FileText className="w-12 h-12 text-gray-400" />
      </div>
      <p className="text-gray-500 text-lg">{message}</p>
    </motion.div>
  );
}
