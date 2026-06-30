import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { motion } from "framer-motion";

import {

  Table,

  TableBody,

  TableCell,

  TableHead,

  TableHeader,

  TableRow,

} from "@/components/ui/table";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";

import { TableActionsMenu } from "@/components/ui/table-actions-menu";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { Plus, Search, Filter, ChevronDown, Download, FileText, RefreshCw, LayoutGrid, Calendar, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { deleteProcess, fetchProcesses } from "@/lib/processApi";
import { apiProcessToDraft, clearProcessDraftLocal, saveProcessDraftLocal } from "@/lib/processDraft";
import { deleteAudit, fetchAudits, loadAuditIntoDraft } from "@/lib/auditApi";
import { clearAuditDraftLocal } from "@/lib/auditDraft";
import {
  buildProcessQuestionExportRows,
  exportProcessesToCsv,
  exportProcessesToExcel,
  exportProcessesToPdf,
} from "@/lib/processExport";

const PROCESS_TABLE_COLSPAN = 13;

type ProcessCardFilter = "all" | "active" | "daily" | "weekly" | "monthly";
type ProcessSortField = "date" | "title" | "owner";

function getFormFrequency(form: any): string {
  return String(form.frequency || form.properties?.periodicityType || "")
    .trim()
    .toLowerCase();
}

function isActiveForm(form: any): boolean {
  return form.status === "published" && form.isActive !== false;
}

function matchesFrequency(form: any, frequency: "daily" | "weekly" | "monthly"): boolean {
  const value = getFormFrequency(form);
  if (frequency === "monthly") {
    return value === "monthly" || value === "yearly";
  }
  return value === frequency;
}

function filterAndSortForms<T extends { title?: string; createdBy?: string; createdAt?: string }>(
  list: T[],
  cardFilter: ProcessCardFilter,
  searchQuery: string,
  sortBy: ProcessSortField,
): T[] {
  let filtered = [...list];

  if (cardFilter === "active") {
    filtered = filtered.filter(isActiveForm);
  } else if (cardFilter === "daily" || cardFilter === "weekly" || cardFilter === "monthly") {
    filtered = filtered.filter((item) => matchesFrequency(item, cardFilter));
  }

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((item) => String(item.title || "").toLowerCase().includes(query));
  }

  filtered.sort((a, b) => {
    if (sortBy === "title") {
      return String(a.title || "").localeCompare(String(b.title || ""), undefined, {
        sensitivity: "base",
      });
    }
    if (sortBy === "owner") {
      return String(a.createdBy || "").localeCompare(String(b.createdBy || ""), undefined, {
        sensitivity: "base",
      });
    }
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return filtered;
}

function buildFormStats<T>(published: T[]) {
  const active = published.filter(isActiveForm);
  return {
    total: published.length,
    active: active.length,
    daily: published.filter((item) => matchesFrequency(item, "daily")).length,
    weekly: published.filter((item) => matchesFrequency(item, "weekly")).length,
    monthly: published.filter((item) => matchesFrequency(item, "monthly")).length,
  };
}



export default function Process() {

  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [processes, setProcesses] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<ProcessSortField>("date");
  const [cardFilter, setCardFilter] = useState<ProcessCardFilter>("all");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditSortBy, setAuditSortBy] = useState<ProcessSortField>("date");
  const [auditCardFilter, setAuditCardFilter] = useState<ProcessCardFilter>("all");

  const loadProcesses = () => {
    fetchProcesses().then(setProcesses).catch(() => setProcesses([]));
  };

  const loadAudits = () => {
    fetchAudits().then(setAudits).catch(() => setAudits([]));
  };

  useEffect(() => {
    loadProcesses();
    loadAudits();
  }, []);

  const publishedProcesses = processes.filter((p) => p.status === "published");
  const draftProcesses = processes.filter((p) => p.status === "draft");
  const publishedAudits = audits.filter((a) => a.status === "published");
  const draftAudits = audits.filter((a) => a.status === "draft");

  const processStats = useMemo(
    () => buildFormStats(publishedProcesses),
    [publishedProcesses],
  );

  const auditStats = useMemo(
    () => buildFormStats(publishedAudits),
    [publishedAudits],
  );

  const displayedProcesses = useMemo(
    () => filterAndSortForms(publishedProcesses, cardFilter, searchQuery, sortBy),
    [publishedProcesses, cardFilter, searchQuery, sortBy],
  );

  const displayedAudits = useMemo(
    () => filterAndSortForms(publishedAudits, auditCardFilter, auditSearchQuery, auditSortBy),
    [publishedAudits, auditCardFilter, auditSearchQuery, auditSortBy],
  );

  const resetFilters = () => {
    setSearchQuery("");
    setSortBy("date");
    setCardFilter("all");
  };

  const resetAuditFilters = () => {
    setAuditSearchQuery("");
    setAuditSortBy("date");
    setAuditCardFilter("all");
  };

  const formatFormId = (id?: string) => (id ? id.slice(0, 8).toUpperCase() : "-");

  const getProcessTags = (process: any) =>
    process.processTags?.length
      ? process.processTags.join(", ")
      : process.processTag || "-";

  const renderProcessTableHeader = () => (
    <TableRow className="bg-white hover:bg-white">
      <TableHead className="font-semibold text-muted-foreground">{t('formId')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('title')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('owner')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('creationDate')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('period')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('processTag')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('stores')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('users')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('assignees')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('urlQr')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('status')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('schedule')}</TableHead>
      <TableHead className="font-semibold text-muted-foreground">{t('actions')}</TableHead>
    </TableRow>
  );

  const handleEditProcess = (process: any) => {
    clearAuditDraftLocal();
    saveProcessDraftLocal(apiProcessToDraft(process));
    navigate("/title-setup");
  };

  const handleNewProcess = () => {
    clearProcessDraftLocal();
    clearAuditDraftLocal();
    navigate("/title-setup");
  };

  const buildExportRows = () =>
    buildProcessQuestionExportRows(
      displayedProcesses,
      {
        processTitle: t('title'),
        formId: t('formId'),
        section: 'Section',
        questionNo: 'Question No.',
        questionText: 'Question',
        questionType: 'Question Type',
        required: 'Required',
        options: 'Options',
      },
      formatFormId,
    );

  const handleExportProcesses = (format: "csv" | "excel" | "pdf") => {
    const rows = buildExportRows();
    if (!rows.length) {
      toast.error('No questions found in the selected processes.');
      return;
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const exporters = {
      csv: () => exportProcessesToCsv(rows, `processes_${stamp}.csv`),
      excel: () => exportProcessesToExcel(rows, `processes_${stamp}.xlsx`),
      pdf: () => exportProcessesToPdf(rows, `processes_${stamp}.pdf`),
    };

    if (exporters[format]()) {
      toast.success(t('export'));
    }
  };

  const handleEditAudit = async (audit: any) => {
    clearProcessDraftLocal();
    await loadAuditIntoDraft(audit.id);
    navigate("/audit-title-setup");
  };

  const handleDeleteAudit = async (id: string) => {
    if (!confirm(t('confirmDeleteAudit'))) return;
    try {
      await deleteAudit(id);
      loadAudits();
    } catch {
      alert(t('failedToDeleteAudit'));
    }
  };

  const handleNewAudit = () => {
    clearAuditDraftLocal();
    navigate("/audit-title-setup");
  };

  const renderAuditRow = (audit: any, isDraft = false) => (
    <TableRow key={audit.id} className="bg-white hover:bg-slate-50 transition-colors">
      <TableCell className="font-mono text-xs">{formatFormId(audit.id)}</TableCell>
      <TableCell className="font-medium">{audit.title}</TableCell>
      <TableCell>{audit.createdBy || "-"}</TableCell>
      <TableCell>
        {audit.createdAt ? new Date(audit.createdAt).toLocaleDateString() : "-"}
      </TableCell>
      <TableCell>{audit.frequency || "-"}</TableCell>
      <TableCell>{getProcessTags(audit)}</TableCell>
      <TableCell>{audit.storeIds?.length || 0}</TableCell>
      <TableCell>{audit.assigneeIds?.length || 0}</TableCell>
      <TableCell>{audit.assigneeIds?.length || 0}</TableCell>
      <TableCell>{audit.status === "published" ? t('available') : "-"}</TableCell>
      <TableCell>
        <Badge variant={audit.status === "draft" ? "secondary" : "default"}>
          {t(audit.status)}
        </Badge>
      </TableCell>
      <TableCell>{audit.frequency || "-"}</TableCell>
      <TableCell>
        <TableActionsMenu>
          <DropdownMenuItem onClick={() => handleEditAudit(audit)}>{t('edit')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDeleteAudit(audit.id)} className="text-destructive">
            {t('delete')}
          </DropdownMenuItem>
        </TableActionsMenu>
      </TableCell>
    </TableRow>
  );

  const handleDeleteProcess = async (id: string, isDraft: boolean) => {
    const message = isDraft
      ? t('confirmDeleteDraftProcess')
      : t('confirmDeletePublishedProcess');
    if (!confirm(message)) return;
    try {
      await deleteProcess(id);
      loadProcesses();
    } catch {
      alert(t('failedToDeleteProcess'));
    }
  };

  const renderProcessRow = (process: any, isDraft = false) => (
    <TableRow key={process.id} className="bg-white hover:bg-slate-50 transition-colors">
      <TableCell className="font-mono text-xs">{formatFormId(process.id)}</TableCell>
      <TableCell className="font-medium">{process.title}</TableCell>
      <TableCell>{process.createdBy || "-"}</TableCell>
      <TableCell>
        {process.createdAt ? new Date(process.createdAt).toLocaleDateString() : "-"}
      </TableCell>
      <TableCell>{process.frequency || "-"}</TableCell>
      <TableCell>{getProcessTags(process)}</TableCell>
      <TableCell>{process.storeIds?.length || 0}</TableCell>
      <TableCell>{process.assigneeIds?.length || 0}</TableCell>
      <TableCell>{process.assigneeIds?.length || 0}</TableCell>
      <TableCell>{process.status === "published" ? t('available') : "-"}</TableCell>
      <TableCell>
        <Badge variant={process.status === "draft" ? "secondary" : "default"}>
          {t(process.status)}
        </Badge>
      </TableCell>
      <TableCell>{process.frequency || "-"}</TableCell>
      <TableCell>
        <TableActionsMenu>
          <DropdownMenuItem onClick={() => handleEditProcess(process)}>{t('edit')}</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleDeleteProcess(process.id, isDraft)}
            className="text-destructive"
          >
            {t('delete')}
          </DropdownMenuItem>
        </TableActionsMenu>
      </TableCell>
    </TableRow>
  );

  return (

    <div className="p-6 space-y-6">

        {/* Header */}

        <motion.div

          initial={{ opacity: 0, y: -20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.5 }}

          className="flex items-center justify-between"

        >

          <div>

            <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('processManagement')}</h1>

            <p className="text-muted-foreground mt-1">{t('manageProcessesAndAudits')}</p>

          </div>

          <div className="flex items-center gap-2">

            <Tooltip>

              <TooltipTrigger asChild>

                <Button variant="outline" onClick={loadProcesses}>

                  <RefreshCw className="w-4 h-4 mr-2" />

                  {t('refresh')}

                </Button>

              </TooltipTrigger>

              <TooltipContent>

                <p>{t('refreshProcesses')}</p>

              </TooltipContent>

            </Tooltip>

            <Tooltip>

              <TooltipTrigger asChild>

                <Button variant="outline">

                  <LayoutGrid className="w-4 h-4 mr-2" />

                  {t('view')}

                </Button>

              </TooltipTrigger>

              <TooltipContent>

                <p>{t('changeViewLayout')}</p>

              </TooltipContent>

            </Tooltip>

          </div>

        </motion.div>



        {/* Navigation Tabs */}

        <Tabs defaultValue="process" className="w-full">

          <TabsList className="grid w-full grid-cols-3 bg-transparent border-b rounded-none h-auto p-0">

            <TabsTrigger

              value="process"

              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none px-5 py-4 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-muted/50"

            >

              {t('processTab')}

            </TabsTrigger>

            <TabsTrigger

              value="audit"

              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none px-5 py-4 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-muted/50"

            >

              {t('auditTab')}

            </TabsTrigger>

            <TabsTrigger

              value="draft"

              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none px-5 py-4 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-muted/50"

            >

              {t('draftTab')}

            </TabsTrigger>

          </TabsList>



          <TabsContent value="process" className="space-y-6 mt-6">

            {/* Status Cards */}
            <div className="flex flex-wrap gap-6">
              {[
                { key: "all" as ProcessCardFilter, titleKey: "total", icon: FileText, count: processStats.total },
                { key: "active" as ProcessCardFilter, titleKey: "active", icon: RefreshCw, count: processStats.active },
                { key: "daily" as ProcessCardFilter, titleKey: "daily", icon: Calendar, count: processStats.daily },
                { key: "weekly" as ProcessCardFilter, titleKey: "weekly", icon: Calendar, count: processStats.weekly },
                { key: "monthly" as ProcessCardFilter, titleKey: "monthly", icon: Calendar, count: processStats.monthly },
              ].map((item) => (
                <Tooltip key={item.titleKey}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setCardFilter(item.key)}
                      className={`flex items-center gap-3 bg-card border rounded-lg px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        cardFilter === item.key ? "border-primary/40 ring-1 ring-primary/20" : ""
                      }`}
                    >
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {t(item.titleKey)}: {item.count}
                      </p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('view')} {t(item.titleKey)} {t('processes')}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>



            {/* Search and Filters */}

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ delay: 0.3 }}

              className="flex flex-wrap gap-4 items-center"

            >

              <Tooltip>

                <TooltipTrigger asChild>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

                    <Button variant="outline">

                      <Filter className="w-4 h-4 mr-2" />

                      {t('filter')}

                    </Button>

                  </motion.div>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('filterProcesses')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <div className="flex-1 min-w-[300px] relative">

                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

                    <Input
                      placeholder={t('searchProcess')}
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />

                  </div>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('searchProcessesByKeyword')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <DropdownMenu>

                    <DropdownMenuTrigger asChild>

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>

                        <Button variant="outline">

                          {t('status')}

                          <ChevronDown className="w-4 h-4 ml-2" />

                        </Button>

                      </motion.div>

                    </DropdownMenuTrigger>

                    <DropdownMenuContent>

                      <DropdownMenuItem>{t('all')}</DropdownMenuItem>

                      <DropdownMenuItem>{t('active')}</DropdownMenuItem>

                      <DropdownMenuItem>{t('inactive')}</DropdownMenuItem>

                    </DropdownMenuContent>

                  </DropdownMenu>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('filterByStatus')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <DropdownMenu>

                    <DropdownMenuTrigger asChild>

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>

                        <Button variant="outline">

                          {t('sortBy')}

                          <ChevronDown className="w-4 h-4 ml-2" />

                        </Button>

                      </motion.div>

                    </DropdownMenuTrigger>

                    <DropdownMenuContent>

                      <DropdownMenuItem onClick={() => setSortBy("date")}>
                        {t('date')}
                        {sortBy === "date" ? " ✓" : ""}
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => setSortBy("title")}>
                        {t('title')}
                        {sortBy === "title" ? " ✓" : ""}
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => setSortBy("owner")}>
                        {t('owner')}
                        {sortBy === "owner" ? " ✓" : ""}
                      </DropdownMenuItem>

                    </DropdownMenuContent>

                  </DropdownMenu>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('sortProcesses')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

                    <Button>{t('apply')}</Button>

                  </motion.div>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('applyFilters')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

                    <Button variant="outline" onClick={resetFilters}>{t('reset')}</Button>

                  </motion.div>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('resetFilters')}</p>

                </TooltipContent>

              </Tooltip>

              <div className="flex-1" />

              <Tooltip>

                <TooltipTrigger asChild>

                  <DropdownMenu>

                    <DropdownMenuTrigger asChild>

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>

                        <Button variant="outline">

                          <Download className="w-4 h-4 mr-2" />

                          {t('export')}

                          <ChevronDown className="w-4 h-4 ml-2" />

                        </Button>

                      </motion.div>

                    </DropdownMenuTrigger>

                    <DropdownMenuContent>

                      <DropdownMenuItem onClick={() => handleExportProcesses("csv")}>
                        {t('exportAsCSV')}
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => handleExportProcesses("excel")}>
                        {t('exportAsExcel')}
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => handleExportProcesses("pdf")}>
                        {t('exportAsPDF')}
                      </DropdownMenuItem>

                    </DropdownMenuContent>

                  </DropdownMenu>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('exportProcesses')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

                      <Button onClick={handleNewProcess}>

                        <Plus className="w-4 h-4 mr-2" />

                        {t('new')}

                      </Button>

                    </motion.div>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('createNewProcess')}</p>

                </TooltipContent>

              </Tooltip>

            </motion.div>



            {/* Table */}

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ delay: 0.4 }}

            >

              <Card className="hover:shadow-lg transition-shadow duration-300 border-border">

                <CardContent className="p-0">

                  <Table>

                    <TableHeader>

                      {renderProcessTableHeader()}

                    </TableHeader>

                    <TableBody>
                      {displayedProcesses.length === 0 ? (
                      <TableRow className="bg-white hover:bg-slate-50 transition-colors">
                        <TableCell colSpan={PROCESS_TABLE_COLSPAN} className="text-center py-16">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center"
                          >
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                              <FileText className="w-10 h-10 text-primary" />
                            </div>
                            <p className="text-muted-foreground text-xl font-semibold">
                              {publishedProcesses.length === 0
                                ? t('noProcessesAvailable')
                                : 'No matching processes'}
                            </p>
                            <p className="text-muted-foreground text-base mt-2">
                              {publishedProcesses.length === 0
                                ? t('createFirstProcess')
                                : 'Try a different search term or reset filters.'}
                            </p>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                      ) : (
                        displayedProcesses.map((process: any) => renderProcessRow(process))
                      )}
                    </TableBody>

                  </Table>

                </CardContent>

              </Card>

            </motion.div>

          </TabsContent>



          <TabsContent value="audit" className="space-y-6 mt-6">
            {/* Status Cards */}
            <div className="flex flex-wrap gap-6">
              {[
                { key: "all" as ProcessCardFilter, titleKey: "total", icon: FileText, count: auditStats.total },
                { key: "active" as ProcessCardFilter, titleKey: "active", icon: RefreshCw, count: auditStats.active },
                { key: "daily" as ProcessCardFilter, titleKey: "daily", icon: Calendar, count: auditStats.daily },
                { key: "weekly" as ProcessCardFilter, titleKey: "weekly", icon: Calendar, count: auditStats.weekly },
                { key: "monthly" as ProcessCardFilter, titleKey: "monthly", icon: Calendar, count: auditStats.monthly },
              ].map((item) => (
                <Tooltip key={`audit-${item.titleKey}`}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setAuditCardFilter(item.key)}
                      className={`flex items-center gap-3 bg-card border rounded-lg px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        auditCardFilter === item.key ? "border-primary/40 ring-1 ring-primary/20" : ""
                      }`}
                    >
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {t(item.titleKey)}: {item.count}
                      </p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('view')} {t(item.titleKey)} {t('audits')}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[300px] relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchAudit')}
                  className="pl-10"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {t('sortBy')}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setAuditSortBy("date")}>
                    {t('date')}
                    {auditSortBy === "date" ? " ✓" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAuditSortBy("title")}>
                    {t('title')}
                    {auditSortBy === "title" ? " ✓" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAuditSortBy("owner")}>
                    {t('owner')}
                    {auditSortBy === "owner" ? " ✓" : ""}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {(auditSearchQuery || auditCardFilter !== "all" || auditSortBy !== "date") && (
                <Button variant="outline" onClick={resetAuditFilters}>
                  {t('reset')}
                </Button>
              )}

              <div className="ml-auto">
                <Button onClick={handleNewAudit}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('newAudit')}
                </Button>
              </div>
            </div>

            {publishedAudits.length === 0 && draftAudits.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <RefreshCw className="w-10 h-10 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">{t('noAuditsYet')}</p>
                <p className="text-muted-foreground/80 text-sm mt-1">{t('createStoreAuditsDescription')}</p>
              </div>
            ) : displayedAudits.length === 0 && draftAudits.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">No matching audits</p>
                <p className="text-muted-foreground/80 text-sm mt-1">Try a different search term or reset filters.</p>
              </div>
            ) : (
              <Card className="border-border">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>{renderProcessTableHeader()}</TableHeader>
                    <TableBody>
                      {displayedAudits.map((audit) => renderAuditRow(audit))}
                      {auditCardFilter === "all" &&
                        !auditSearchQuery.trim() &&
                        draftAudits.map((audit) => renderAuditRow(audit, true))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>



          <TabsContent value="draft">
            {draftProcesses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">{t('draftProcesses')}</p>
                <p className="text-muted-foreground/80 text-sm mt-1">{t('continueWorkingOnDrafts')}</p>
              </motion.div>
            </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Card className="hover:shadow-lg transition-shadow duration-300 border-border">
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        {renderProcessTableHeader()}
                      </TableHeader>
                      <TableBody>
                        {draftProcesses.map((process: any) => renderProcessRow(process, true))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

        </Tabs>

      </div>

  );

}