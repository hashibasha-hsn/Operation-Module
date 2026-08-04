import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, FileText, Play, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function Tasks() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("process");
  const [location, navigate] = useLocation();
  const [assignedProcesses, setAssignedProcesses] = useState<any[]>([]);
  const [assignedAudits, setAssignedAudits] = useState<any[]>([]);
  const [processSubmissions, setProcessSubmissions] = useState<any[]>([]);
  const [auditSubmissions, setAuditSubmissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");

  const loadAssignedTasks = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    const user = getCurrentUser();
    const storeId = user.entityId ?? user.storeId;
    const [processes, audits, userProcessSubs, userAuditSubs] = await Promise.all([
      fetchAssignedProcesses(userId, storeId),
      fetchAssignedAudits(userId, storeId),
      fetchUserSubmissions(userId),
      fetchUserAuditSubmissions(userId),
    ]);
    setAssignedProcesses(processes);
    setAssignedAudits(audits);
    setProcessSubmissions(userProcessSubs);
    setAuditSubmissions(userAuditSubs);
  };

  useEffect(() => {
    loadAssignedTasks();
  }, []);

  const draftByProcessId = processSubmissions.reduce((acc: Record<string, any>, item) => {
    if (item.status === "draft") acc[item.workflowId] = item;
    return acc;
  }, {});

  const processTitleById = assignedProcesses.reduce((acc: Record<string, string>, process) => {
    acc[process.id] = process.title;
    return acc;
  }, {});

  const draftByAuditId = auditSubmissions.reduce((acc: Record<string, any>, item) => {
    if (item.status === "draft") acc[item.workflowId] = item;
    return acc;
  }, {});

  const auditTitleById = assignedAudits.reduce((acc: Record<string, string>, audit) => {
    acc[audit.id] = audit.title;
    return acc;
  }, {});

  const filteredProcesses = assignedProcesses.filter((process) =>
    process.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredAudits = assignedAudits.filter((audit) =>
    audit.title?.toLowerCase().includes(auditSearchQuery.toLowerCase()),
  );

  const inProgressProcessDrafts = processSubmissions.filter(
    (item) =>
      (item.status === "draft" || item.status === "correction") &&
      Boolean(processTitleById[item.workflowId]),
  );
  const inProgressAuditDrafts = auditSubmissions.filter(
    (item) =>
      (item.status === "draft" || item.status === "correction") &&
      Boolean(auditTitleById[item.workflowId]),
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-foreground">{t('processTab')}</h1>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger
              value="process"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border border-transparent rounded-md px-6 py-2"
            >
              {t('processTab')}
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary border border-transparent rounded-md px-6 py-2"
            >
              {t('auditTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="mt-6">
            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder={t('search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-border focus:border-primary"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('searchProcesses')}</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex gap-3 w-full md:w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="all-status">
                      <SelectTrigger className="w-[140px] border-gray-300">
                        <SelectValue placeholder={t('allStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-status">{t('allStatus')}</SelectItem>
                        <SelectItem value="active">{t('active')}</SelectItem>
                        <SelectItem value="completed">{t('completed')}</SelectItem>
                        <SelectItem value="pending">{t('pending')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('filterByStatus')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="select-category">
                      <SelectTrigger className="w-[150px] border-gray-300">
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select-category">{t('selectCategory')}</SelectItem>
                        <SelectItem value="category1">{t('category1')}</SelectItem>
                        <SelectItem value="category2">{t('category2')}</SelectItem>
                        <SelectItem value="category3">{t('category3')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('filterByCategory')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="all-periods">
                      <SelectTrigger className="w-[120px] border-gray-300">
                        <SelectValue placeholder={t('allPeriods')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-periods">{t('allPeriods')}</SelectItem>
                        <SelectItem value="today">{t('today')}</SelectItem>
                        <SelectItem value="week">{t('thisWeek')}</SelectItem>
                        <SelectItem value="month">{t('thisMonth')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('filterByTimePeriod')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="border-gray-300">
                      {t('status')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('filterByStatus')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>

            {/* In Progress Drafts */}
            {inProgressProcessDrafts.length > 0 && (
              <div className="mt-8 space-y-3">
                <h2 className="text-lg font-semibold">{t('inProgress')}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {inProgressProcessDrafts.map((draft) => (
                    <Card key={draft.id} className="border-border">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {draft.process?.title || processTitleById[draft.workflowId] || t('processTab')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {draft.status === "correction" ? t("correction") : t("draftSaved")}
                          </p>
                          {draft.status === "correction" && draft.answers?.correction?.reviewerName && (
                            <p className="text-xs text-amber-700">
                              Reviewed by: {draft.answers.correction.reviewerName}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => navigate(`/tasks/process/${draft.workflowId}`)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          {t('continue')}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Processes */}
            {filteredProcesses.length > 0 ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProcesses.map((process) => {
                  const hasDraft = Boolean(draftByProcessId[process.id]);
                  return (
                    <Card key={process.id} className="border-border hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{process.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {process.description || t('assignedChecklist')}
                            </p>
                          </div>
                          <Badge variant={hasDraft ? "secondary" : "outline"}>
                            {hasDraft ? t('draft') : t('assigned')}
                          </Badge>
                        </div>
                        <Button
                          className="w-full bg-primary hover:bg-primary/90"
                          onClick={() => navigate(`/tasks/process/${process.id}`)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {hasDraft ? t('continue') : t('start')}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : inProgressProcessDrafts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-12 flex flex-col items-center justify-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
                >
                  <FileText className="w-12 h-12 text-gray-400" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="text-gray-500 text-lg"
                >
                  {t('noProcessesMatchCriteria')}
                </motion.p>
              </motion.div>
            ) : null}
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t('search')}
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="pl-10 border-border focus:border-primary"
                />
              </div>
            </motion.div>

            {inProgressAuditDrafts.length > 0 && (
              <div className="mt-8 space-y-3">
                <h2 className="text-lg font-semibold">{t('inProgress')}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {inProgressAuditDrafts.map((draft) => (
                    <Card key={draft.id} className="border-border">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {auditTitleById[draft.workflowId] ?? t('auditTab')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {draft.status === "correction" ? t("correction") : t("draftSaved")}
                          </p>
                          {draft.status === "correction" && draft.answers?.correction?.reviewerName && (
                            <p className="text-xs text-amber-700">
                              Reviewed by: {draft.answers.correction.reviewerName}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => navigate(`/tasks/audit/${draft.workflowId}`)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          {t('continue')}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {filteredAudits.length > 0 ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAudits.map((audit) => {
                  const hasDraft = Boolean(draftByAuditId[audit.id]);
                  return (
                    <Card key={audit.id} className="border-border hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{audit.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {audit.description || t('assignedAudit')}
                            </p>
                          </div>
                          <Badge variant={hasDraft ? "secondary" : "outline"}>
                            {hasDraft ? t('draft') : t('assigned')}
                          </Badge>
                        </div>
                        <Button
                          className="w-full bg-primary hover:bg-primary/90"
                          onClick={() => navigate(`/tasks/audit/${audit.id}`)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {hasDraft ? t('continue') : t('start')}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : inProgressAuditDrafts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 flex flex-col items-center justify-center py-16"
              >
                <FileText className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">{t('noAssignedAudits')}</p>
              </motion.div>
            ) : null}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
