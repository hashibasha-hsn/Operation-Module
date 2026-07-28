import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchAssignedProcesses,
  fetchUserSubmissions,
  getCurrentUser,
  getCurrentUserId,
} from "@/lib/processSubmission";
import {
  fetchAssignedAudits,
  fetchUserAuditSubmissions,
} from "@/lib/auditSubmission";
import { fetchActionPointsByTab } from "@/lib/actionPointApi";
import { fetchAssignedAssessments } from "@/lib/assessmentApi";
import {
  fetchUserAssessmentResults,
  getInProgressResult,
  getLatestResultForAssessment,
} from "@/lib/assessmentSubmission";
import { fetchTicketsAssignedToMe } from "@/lib/ticketApi";
import HomeNoticeboard from "@/components/HomeNoticeboard";
import { toast } from "sonner";

type WorkstreamCounts = {
  pending: number;
  inProgress: number;
  completed: number;
  assigned: number;
};

type QueueTask = {
  id: string;
  title: string;
  statusKey: "pending" | "inProgress";
  typeLabel: string;
  href: string;
  dueDate?: string | null;
};

const EMPTY_COUNTS: WorkstreamCounts = {
  pending: 0,
  inProgress: 0,
  completed: 0,
  assigned: 0,
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isActiveActionPoint(status?: string) {
  return status === "open" || status === "in_progress" || status === "on_hold";
}

function isCompletedActionPoint(status?: string) {
  return status === "completed" || status === "closed" || status === "rejected";
}

function isActiveTicket(status?: string) {
  return status === "open" || status === "in_progress" || status === "on_hold";
}

function isCompletedTicket(status?: string) {
  return status === "complete" || status === "closed" || status === "rejected";
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [dateOffset, setDateOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [processCounts, setProcessCounts] = useState<WorkstreamCounts>(EMPTY_COUNTS);
  const [actionPointCounts, setActionPointCounts] = useState<WorkstreamCounts>(EMPTY_COUNTS);
  const [learningCounts, setLearningCounts] = useState<WorkstreamCounts>(EMPTY_COUNTS);
  const [ticketCounts, setTicketCounts] = useState<WorkstreamCounts>(EMPTY_COUNTS);
  const [queueTasks, setQueueTasks] = useState<QueueTask[]>([]);

  const currentDate = new Date();
  const daysOfWeek: Date[] = [];

  for (let i = 0; i < 3; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + dateOffset + i);
    daysOfWeek.push(date);
  }

  const selectedDate = daysOfWeek[selectedDayIndex] ?? daysOfWeek[0];

  useEffect(() => {
    void loadPendingTasksOverview();
  }, []);

  const loadPendingTasksOverview = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);
    const user = getCurrentUser();
    const storeId = (user.entityId ?? user.storeId) as string | undefined;

    try {
      const [
        processes,
        audits,
        processSubs,
        auditSubs,
        actionPoints,
        assessments,
        assessmentResults,
        tickets,
      ] = await Promise.all([
        fetchAssignedProcesses(userId, storeId).catch(() => []),
        fetchAssignedAudits(userId, storeId).catch(() => []),
        fetchUserSubmissions(userId).catch(() => []),
        fetchUserAuditSubmissions(userId).catch(() => []),
        fetchActionPointsByTab("assigned").catch(() => []),
        fetchAssignedAssessments(userId, storeId).catch(() => []),
        fetchUserAssessmentResults(userId).catch(() => []),
        fetchTicketsAssignedToMe().catch(() => []),
      ]);

      const processList = Array.isArray(processes) ? processes : [];
      const auditList = Array.isArray(audits) ? audits : [];
      const processSubList = Array.isArray(processSubs) ? processSubs : [];
      const auditSubList = Array.isArray(auditSubs) ? auditSubs : [];
      const actionPointList = Array.isArray(actionPoints) ? actionPoints : [];
      const assessmentList = Array.isArray(assessments) ? assessments : [];
      const resultList = Array.isArray(assessmentResults) ? assessmentResults : [];
      const ticketList = Array.isArray(tickets) ? tickets : [];

      const processDraftIds = new Set(
        processSubList
          .filter((s) => s.status === "draft" || s.status === "correction")
          .map((s) => s.workflowId),
      );
      const processCompletedIds = new Set(
        processSubList
          .filter((s) => s.status === "completed" || s.status === "approved")
          .map((s) => s.workflowId),
      );
      const auditDraftIds = new Set(
        auditSubList
          .filter((s) => s.status === "draft" || s.status === "correction")
          .map((s) => s.workflowId),
      );
      const auditCompletedIds = new Set(
        auditSubList
          .filter((s) => s.status === "completed" || s.status === "approved")
          .map((s) => s.workflowId),
      );

      let pwPending = 0;
      let pwInProgress = 0;
      let pwCompleted = 0;
      const queue: QueueTask[] = [];

      for (const process of processList) {
        if (processDraftIds.has(process.id)) {
          pwInProgress += 1;
          queue.push({
            id: `process-${process.id}`,
            title: process.title || "Process",
            statusKey: "inProgress",
            typeLabel: "Process",
            href: `/tasks/process/${process.id}`,
          });
        } else if (processCompletedIds.has(process.id)) {
          pwCompleted += 1;
        } else {
          pwPending += 1;
          queue.push({
            id: `process-${process.id}`,
            title: process.title || "Process",
            statusKey: "pending",
            typeLabel: "Process",
            href: `/tasks/process/${process.id}`,
          });
        }
      }

      for (const audit of auditList) {
        if (auditDraftIds.has(audit.id)) {
          pwInProgress += 1;
          queue.push({
            id: `audit-${audit.id}`,
            title: audit.title || "Audit",
            statusKey: "inProgress",
            typeLabel: "Audit",
            href: `/tasks/audit/${audit.id}`,
          });
        } else if (auditCompletedIds.has(audit.id)) {
          pwCompleted += 1;
        } else {
          pwPending += 1;
          queue.push({
            id: `audit-${audit.id}`,
            title: audit.title || "Audit",
            statusKey: "pending",
            typeLabel: "Audit",
            href: `/tasks/audit/${audit.id}`,
          });
        }
      }

      setProcessCounts({
        pending: pwPending,
        inProgress: pwInProgress,
        completed: pwCompleted,
        assigned: processList.length + auditList.length,
      });

      const apPending = actionPointList.filter((ap) => ap.status === "open").length;
      const apInProgress = actionPointList.filter(
        (ap) => ap.status === "in_progress" || ap.status === "on_hold",
      ).length;
      const apCompleted = actionPointList.filter((ap) => isCompletedActionPoint(ap.status)).length;
      setActionPointCounts({
        pending: apPending,
        inProgress: apInProgress,
        completed: apCompleted,
        assigned: actionPointList.length,
      });

      for (const ap of actionPointList) {
        if (!isActiveActionPoint(ap.status)) continue;
        queue.push({
          id: `ap-${ap.id}`,
          title: ap.title || "Action Point",
          statusKey: ap.status === "open" ? "pending" : "inProgress",
          typeLabel: "Action Point",
          href: "/action-points",
          dueDate: ap.dueDate || null,
        });
      }

      let learnPending = 0;
      let learnInProgress = 0;
      let learnCompleted = 0;
      for (const assessment of assessmentList) {
        const inProgress = getInProgressResult(resultList, assessment.id);
        const latestCompleted = getLatestResultForAssessment(
          resultList.filter(
            (item) => item.assessmentId === assessment.id && item.status === "completed",
          ),
          assessment.id,
        );
        if (inProgress) {
          learnInProgress += 1;
          queue.push({
            id: `assessment-${assessment.id}`,
            title: assessment.title || "Assessment",
            statusKey: "inProgress",
            typeLabel: "Learning",
            href: `/learning/assessment/${assessment.id}`,
          });
        } else if (latestCompleted) {
          learnCompleted += 1;
        } else {
          learnPending += 1;
          queue.push({
            id: `assessment-${assessment.id}`,
            title: assessment.title || "Assessment",
            statusKey: "pending",
            typeLabel: "Learning",
            href: `/learning/assessment/${assessment.id}`,
          });
        }
      }
      setLearningCounts({
        pending: learnPending,
        inProgress: learnInProgress,
        completed: learnCompleted,
        assigned: assessmentList.length,
      });

      const tkPending = ticketList.filter((tk) => tk.status === "open").length;
      const tkInProgress = ticketList.filter(
        (tk) => tk.status === "in_progress" || tk.status === "on_hold",
      ).length;
      const tkCompleted = ticketList.filter((tk) => isCompletedTicket(tk.status)).length;
      setTicketCounts({
        pending: tkPending,
        inProgress: tkInProgress,
        completed: tkCompleted,
        assigned: ticketList.length,
      });

      for (const tk of ticketList) {
        if (!isActiveTicket(tk.status)) continue;
        queue.push({
          id: `ticket-${tk.id}`,
          title: tk.title || "Ticket",
          statusKey: tk.status === "open" ? "pending" : "inProgress",
          typeLabel: "Ticket",
          href: "/tickets",
          dueDate: tk.dueDate || null,
        });
      }

      setQueueTasks(queue);
    } catch (err) {
      console.error("Failed to load pending tasks overview:", err);
      toast.error(t("failedToConnectToServer") || "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  const filteredQueueTasks = useMemo(() => {
    const active = queueTasks.filter(
      (task) => task.statusKey === "pending" || task.statusKey === "inProgress",
    );

    const datedForDay = active.filter(
      (task) => task.dueDate && sameDay(new Date(task.dueDate), selectedDate),
    );
    const undated = active.filter((task) => !task.dueDate);

    // Prefer due-date matches for the selected day; always include undated work so the overview isn't empty
    const merged = [...datedForDay, ...undated.filter((t) => !datedForDay.some((d) => d.id === t.id))];
    const unique = Array.from(new Map(merged.map((t) => [t.id, t])).values());

    // When browsing other days, prioritize items due that day; still show undated pending work under "today"
    if (!(dateOffset === 0 && selectedDayIndex === 0) && datedForDay.length > 0) {
      return datedForDay.slice(0, 8);
    }
    return unique.slice(0, 8);
  }, [queueTasks, selectedDate, dateOffset, selectedDayIndex]);

  const summaryCards = [
    {
      titleKey: "processAndWorkflow",
      icon: CheckCircle2,
      badgeColor: "bg-yellow-100 text-yellow-700",
      counts: processCounts,
      href: "/tasks",
    },
    {
      titleKey: "actionPoint",
      icon: AlertCircle,
      badgeColor: "bg-red-100 text-red-700",
      counts: actionPointCounts,
      href: "/action-points",
    },
    {
      titleKey: "learning",
      icon: BookOpen,
      badgeColor: "bg-blue-100 text-blue-700",
      counts: learningCounts,
      href: "/learning",
    },
    {
      titleKey: "ticket",
      icon: Ticket,
      badgeColor: "bg-green-100 text-green-700",
      counts: ticketCounts,
      href: "/tickets",
    },
  ];

  const handlePreviousDates = () => {
    setDateOffset((prev) => prev - 1);
    setSelectedDayIndex(0);
  };

  const handleNextDates = () => {
    setDateOffset((prev) => prev + 1);
    setSelectedDayIndex(0);
  };

  const totalPending =
    processCounts.pending +
    actionPointCounts.pending +
    learningCounts.pending +
    ticketCounts.pending;

  return (
    <div className="p-6 space-y-6 bg-muted/30 min-h-screen">
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="bg-card p-1 rounded-lg shadow-sm border border-border/60 flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger
                value="activity"
                className="flex-1 text-center py-2 px-4 rounded-md transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {t("activityOverview")}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("viewActivityOverview")}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger
                value="analytics"
                className="flex-1 text-center py-2 px-4 rounded-md transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {t("summaryAnalytics")}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("viewSummaryAnalytics")}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger
                value="reports"
                className="flex-1 text-center py-2 px-4 rounded-md transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {t("customReports")}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("viewCustomReports")}</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <TabsContent value="activity" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {summaryCards.map((card, idx) => (
              <motion.div
                key={card.titleKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-gray-200 hover:border-gray-300 cursor-pointer"
                  onClick={() => navigate(card.href)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-800">
                        <card.icon className="w-4 h-4" />
                        {t(card.titleKey)}
                      </CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.2 }}
                            transition={{ duration: 0.6 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {t("moreInfoAbout")} {t(card.titleKey)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingTasks ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{t("pending")}</span>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${card.badgeColor}`}
                          >
                            {card.counts.pending}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{t("inProgress")}</span>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${card.badgeColor}`}
                          >
                            {card.counts.inProgress}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{t("completed")}</span>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${card.badgeColor}`}
                          >
                            {card.counts.completed}
                          </span>
                        </div>
                        <div className="text-center mt-4 pt-3 border-t border-gray-100">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-3xl font-bold text-primary"
                          >
                            {card.counts.assigned}
                          </motion.div>
                          <p className="text-xs text-gray-500 mt-1">{t("assigned")}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <HomeNoticeboard />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="hover:shadow-2xl transition-all duration-500 hover:scale-102 hover:-translate-y-1 gradient-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{t("tasksInQueue")}</CardTitle>
                      {!loadingTasks && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {totalPending} {t("pending").toLowerCase()}
                        </p>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => navigate("/tasks")}
                          >
                            {t("seeAll")}
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("viewAllTasksInQueue")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handlePreviousDates}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("previousDates")}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex gap-2">
                      {daysOfWeek.map((date, idx) => (
                        <Tooltip key={idx}>
                          <TooltipTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedDayIndex(idx)}
                              className={`text-center p-2 rounded-lg cursor-pointer transition-all duration-300 min-w-[60px] ${
                                idx === selectedDayIndex
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
                              }`}
                            >
                              <div className="text-xs font-medium">
                                {date.toLocaleDateString("en-US", { weekday: "short" })}
                              </div>
                              <div className="text-lg font-bold">{date.getDate()}</div>
                              <div className="text-xs">
                                {date.toLocaleDateString("en-US", { month: "short" })}
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {date.toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleNextDates}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("nextDates")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="space-y-3">
                    {loadingTasks ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredQueueTasks.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        {t("noPendingTasksInQueue") || "No pending tasks for this day"}
                      </div>
                    ) : (
                      filteredQueueTasks.map((task, idx) => (
                        <Tooltip key={task.id}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 * idx }}
                              whileHover={{ scale: 1.02, x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                              onClick={() => navigate(task.href)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {task.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {task.typeLabel}
                                  </p>
                                </div>
                                <Badge
                                  variant={task.statusKey === "pending" ? "outline" : "secondary"}
                                  className="shrink-0 text-[10px]"
                                >
                                  {t(task.statusKey)}
                                </Badge>
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {(t("viewTaskDetails") || "View {task}").replace("{task}", task.title)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-base text-gray-800">{t("alertsAndActivity")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTasks ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : totalPending + processCounts.inProgress + actionPointCounts.inProgress + learningCounts.inProgress + ticketCounts.inProgress === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-gray-500"
                    >
                      <p className="text-sm">{t("noData")}</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        {
                          label: t("processAndWorkflow"),
                          pending: processCounts.pending,
                          inProgress: processCounts.inProgress,
                        },
                        {
                          label: t("actionPoint"),
                          pending: actionPointCounts.pending,
                          inProgress: actionPointCounts.inProgress,
                        },
                        {
                          label: t("learning"),
                          pending: learningCounts.pending,
                          inProgress: learningCounts.inProgress,
                        },
                        {
                          label: t("ticket"),
                          pending: ticketCounts.pending,
                          inProgress: ticketCounts.inProgress,
                        },
                      ]
                        .filter((row) => row.pending + row.inProgress > 0)
                        .map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                          >
                            <span className="text-sm font-medium text-gray-800">{row.label}</span>
                            <div className="flex gap-2 text-xs">
                              {row.pending > 0 && (
                                <Badge variant="outline">
                                  {row.pending} {t("pending")}
                                </Badge>
                              )}
                              {row.inProgress > 0 && (
                                <Badge variant="secondary">
                                  {row.inProgress} {t("inProgress")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">{t("summaryAnalyticsContentComingSoon")}</p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">{t("customReportsContentComingSoon")}</p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
