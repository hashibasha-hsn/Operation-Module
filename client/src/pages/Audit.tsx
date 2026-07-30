import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Search, FileText, Inbox, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { useTimezone } from "@/contexts/TimezoneContext";
import {
  fetchAuditLogs,
  formatAuditLogDetails,
  type AuditLogRecord,
} from "@/lib/auditLogApi";

function operationBadgeClass(operation: string) {
  const op = operation.toLowerCase();
  if (op === "discard" || op === "delete" || op === "reject" || op === "revoke") {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }
  if (op === "update" || op === "submit" || op === "sync") {
    return "bg-amber-100 text-amber-900 border-amber-200";
  }
  if (op === "create" || op === "grant") {
    return "bg-sky-100 text-sky-800 border-sky-200";
  }
  return "bg-muted text-foreground";
}

export default function Audit() {
  const { t } = useLanguage();
  const { formatDateTimeLong: formatCreatedAt } = useTimezone();
  const [activeTab, setActiveTab] = useState("process");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const target = activeTab === "process" ? "Process" : activeTab === "audit" ? "Audit" : "";

  const loadLogs = async () => {
    if (!target) return;
    setIsLoading(true);
    try {
      const result = await fetchAuditLogs({
        target,
        category: "workflow",
        page: 1,
        limit: 100,
        sort: "desc",
      });
      setAuditLogs(result.logs);
    } catch {
      setAuditLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm("");
    setStatusFilter("all");
    if (target) loadLogs();
  }, [activeTab]);

  const filteredLogs = auditLogs.filter((log) => {
    const title = String(log.details?.title || "").toLowerCase();
    const performedBy = log.performedBy.toLowerCase();
    const q = searchTerm.toLowerCase();
    if (q && !title.includes(q) && !performedBy.includes(q)) return false;
    if (statusFilter !== "all") {
      const op = log.operation.toLowerCase();
      if (statusFilter === "create" && op !== "create") return false;
      if (statusFilter === "update" && op !== "update") return false;
      if (statusFilter === "delete" && op !== "delete") return false;
      if (statusFilter === "publish" && op !== "publish") return false;
    }
    return true;
  });

  const operationOptions = [
    { value: "all", label: t("allStatus") },
    { value: "create", label: t("created") },
    { value: "update", label: t("updated") },
    { value: "delete", label: t("deleted") },
    { value: "publish", label: t("published") },
  ];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">{t("processAndAudit")}</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger
              value="process"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:border-sky-600 border border-transparent rounded-md px-6 py-2"
            >
              {t("process")}
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:border-sky-600 border border-transparent rounded-md px-6 py-2"
            >
              {t("audit")}
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:border-sky-600 border border-transparent rounded-md px-6 py-2"
            >
              {t("draft")}
            </TabsTrigger>
            <TabsTrigger
              value="template"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:border-sky-600 border border-transparent rounded-md px-6 py-2"
            >
              {t("templateLibrary")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="mt-6">
            {renderLogView({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, filteredLogs, isLoading, formatCreatedAt, t, operationOptions, loadLogs })}
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            {renderLogView({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, filteredLogs, isLoading, formatCreatedAt, t, operationOptions, loadLogs })}
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            {renderEmptyState(t("drafts"), t("noDraftsMatch"))}
          </TabsContent>

          <TabsContent value="template" className="mt-6">
            {renderEmptyState(t("templates"), t("noTemplatesMatch"))}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function renderLogView({
  searchTerm, setSearchTerm, statusFilter, setStatusFilter,
  filteredLogs, isLoading, formatCreatedAt, t, operationOptions, loadLogs,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  filteredLogs: AuditLogRecord[];
  isLoading: boolean;
  formatCreatedAt: (d: string) => string;
  t: (k: string) => string;
  operationOptions: { value: string; label: string }[];
  loadLogs: () => void;
}) {
  return (
    <>
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
                placeholder={t("search")}
                className="pl-10 border-gray-300 focus:border-sky-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("searchByName")}</p>
          </TooltipContent>
        </Tooltip>
        <div className="flex gap-3 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] border-gray-300">
              <SelectValue placeholder={t("allStatus")} />
            </SelectTrigger>
            <SelectContent>
              {operationOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="border-gray-300 gap-2" onClick={loadLogs}>
                <RefreshCw className="w-4 h-4" />
                {t("refresh")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("refresh")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {isLoading ? (
          <div className="mt-12 flex items-center justify-center py-16 text-gray-500">{t("loading")}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center py-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
            >
              <Inbox className="w-12 h-12 text-gray-400" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-gray-500 text-lg"
            >
              {t("noLogsMatch")}
            </motion.p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t("name")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t("operation")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t("performedBy")}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t("createdAt")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{String(log.details?.title || "-")}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={operationBadgeClass(log.operation)}>
                        {log.operation}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {/^[0-9a-f-]{36}$/i.test(log.performedBy) ? "System" : log.performedBy}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                      {formatCreatedAt(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </>
  );
}

function renderEmptyState(title: string, message: string) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
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
        {message}
      </motion.p>
    </motion.div>
  );
}
