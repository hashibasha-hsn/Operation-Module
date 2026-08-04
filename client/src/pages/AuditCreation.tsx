import { useEffect, useRef, useState } from "react";
import { Search, Plus, Check, Download, Upload } from "lucide-react";
import { useLocation } from "wouter";
import * as XLSX from "xlsx";
import AuditHeader from "@/components/AuditHeader";
import { toast } from "sonner";
import {
  assignAudit,
  ensureAuditDraftSaved,
  fetchEntities,
  fetchUsers,
  publishAudit,
  saveAuditDraft,
} from "@/lib/auditApi";
import { fetchAssigneeProfiles } from "@/lib/processApi";
import { loadAuditDraft, saveAuditDraftLocal, type AuditDraftState } from "@/lib/auditDraft";
import { useLanguage } from "@/contexts/LanguageContext";
import { humanLabel } from "@/lib/displayLabels";

type AssignOption = { id: string; label: string };
type AssignBy = "store" | "user" | "profile" | "bulk";
type AssigneeProfileRow = {
  id: string;
  profileName?: string;
  storeIds?: string[];
  users?: Array<{ userId?: string; id?: string; email?: string }>;
};

const ASSIGN_MODES: { key: AssignBy; label: string }[] = [
  { key: "store", label: "Store" },
  { key: "user", label: "User" },
  { key: "profile", label: "Assignee Profile" },
  { key: "bulk", label: "Bulk Assignee (XL)" },
];

function resolveProfileAssignment(
  profileIds: string[],
  profiles: AssigneeProfileRow[],
): { assigneeIds: string[]; storeIds: string[] } {
  const storeIds = new Set<string>();
  const assigneeIds = new Set<string>();

  for (const profileId of profileIds) {
    const profile = profiles.find((row) => row.id === profileId);
    if (!profile) continue;
    (profile.storeIds ?? []).forEach((storeId) => storeIds.add(String(storeId)));
    (profile.users ?? []).forEach((user) => {
      const userId = user.userId ?? user.id;
      if (userId) assigneeIds.add(String(userId));
    });
  }

  return {
    storeIds: [...storeIds],
    assigneeIds: [...assigneeIds],
  };
}

function parseBulkAssignmentRows(
  rows: Record<string, unknown>[],
  userRows: Array<Record<string, unknown>>,
  storeOptions: AssignOption[],
): { assigneeIds: string[]; storeIds: string[] } {
  const storeIds = new Set<string>();
  const assigneeIds = new Set<string>();
  const emailToUserId = new Map<string, string>();
  const storeNameToId = new Map<string, string>();

  userRows.forEach((user) => {
    const email = String(user.email || "").trim().toLowerCase();
    const userId = String(user.userId || user.id || "");
    if (email && userId) emailToUserId.set(email, userId);
  });

  storeOptions.forEach((store) => {
    storeNameToId.set(store.label.trim().toLowerCase(), store.id);
  });

  rows.forEach((row) => {
    const entityId = String(
      row.EntityId ?? row.entityId ?? row["Store Id"] ?? row["EntityId"] ?? "",
    ).trim();
    const storeName = String(row["Store Name"] ?? row.storeName ?? row.StoreName ?? "").trim();
    const emails = String(row.Emails ?? row.emails ?? row.Email ?? "")
      .split(/[,;]/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (entityId) {
      storeIds.add(entityId);
    } else if (storeName) {
      const mappedStoreId = storeNameToId.get(storeName.toLowerCase());
      if (mappedStoreId) storeIds.add(mappedStoreId);
    }

    emails.forEach((email) => {
      const userId = emailToUserId.get(email);
      if (userId) assigneeIds.add(userId);
    });
  });

  return {
    storeIds: [...storeIds],
    assigneeIds: [...assigneeIds],
  };
}

export default function AuditCreation() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("assign");
  const [assignBy, setAssignBy] = useState<AssignBy>("store");
  const [auditDraft, setAuditDraft] = useState<AuditDraftState | null>(null);
  const [users, setUsers] = useState<AssignOption[]>([]);
  const [userRows, setUserRows] = useState<Array<Record<string, unknown>>>([]);
  const [stores, setStores] = useState<AssignOption[]>([]);
  const [profiles, setProfiles] = useState<AssignOption[]>([]);
  const [profileRows, setProfileRows] = useState<AssigneeProfileRow[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [bulkAssigneeIds, setBulkAssigneeIds] = useState<string[]>([]);
  const [bulkStoreIds, setBulkStoreIds] = useState<string[]>([]);
  const [bulkFileName, setBulkFileName] = useState("");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftSyncing, setIsDraftSyncing] = useState(false);

  useEffect(() => {
    const draft = loadAuditDraft();
    setAuditDraft(draft);
    setSelectedUserIds(draft.assigneeIds ?? []);
    setSelectedStoreIds(draft.storeIds ?? []);
    if (draft.assignBy) setAssignBy(draft.assignBy as AssignBy);

    Promise.all([fetchUsers(500), fetchEntities(), fetchAssigneeProfiles()])
      .then(([userList, entityList, profileList]) => {
        const normalizedUsers = Array.isArray(userList) ? userList : [];
        setUserRows(normalizedUsers);
        setUsers(
          normalizedUsers.map((user: any) => ({
            id: String(user.userId ?? user.id),
            label: humanLabel(user.fullName, user.name, user.email, "Unknown user"),
          })),
        );
        setStores(
          (Array.isArray(entityList) ? entityList : []).map((entity: any) => ({
            id: String(entity.id),
            label: humanLabel(entity.storeName, entity.entityName, entity.name, "Unnamed store"),
          })),
        );
        const normalizedProfiles = (Array.isArray(profileList) ? profileList : []) as AssigneeProfileRow[];
        setProfileRows(normalizedProfiles);
        setProfiles(
          normalizedProfiles.map((profile) => ({
            id: String(profile.id),
            label: profile.profileName || String(profile.id),
          })),
        );
      })
      .catch(() => toast.error(t('couldNotLoadUsersOrStores')));

    if (draft.title?.trim()) {
      setIsDraftSyncing(true);
      ensureAuditDraftSaved(draft)
        .then((saved) => {
          setAuditDraft(saved);
          setSelectedUserIds(saved.assigneeIds ?? []);
          setSelectedStoreIds(saved.storeIds ?? []);
        })
        .catch((error: any) => {
          toast.error(error.message || t('couldNotSyncAuditDraft'));
        })
        .finally(() => setIsDraftSyncing(false));
    }
  }, []);

  const toggleId = (ids: string[], id: string) =>
    ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];

  const getEffectiveAssignment = () => {
    if (assignBy === "profile") {
      return resolveProfileAssignment(selectedProfileIds, profileRows);
    }
    if (assignBy === "bulk") {
      return { assigneeIds: bulkAssigneeIds, storeIds: bulkStoreIds };
    }
    return { assigneeIds: selectedUserIds, storeIds: selectedStoreIds };
  };

  const hasAssignment = () => {
    const { assigneeIds, storeIds } = getEffectiveAssignment();
    return assigneeIds.length > 0 || storeIds.length > 0;
  };

  const persistAssignmentLocally = () => {
    if (!auditDraft) return;
    const { assigneeIds, storeIds } = getEffectiveAssignment();
    const updated = { ...auditDraft, assigneeIds, storeIds, assignBy };
    setAuditDraft(updated);
    saveAuditDraftLocal(updated);
  };

  const handleSave = async () => {
    if (!auditDraft?.title?.trim()) {
      toast.error(t('addAuditTitleBeforeAssigning'));
      return;
    }
    if (!hasAssignment()) {
      toast.error(t('selectUserOrStoreToAssign'));
      return;
    }

    setIsSaving(true);
    try {
      const { assigneeIds, storeIds } = getEffectiveAssignment();
      const synced = await ensureAuditDraftSaved({
        ...auditDraft,
        assigneeIds,
        storeIds,
        assignBy,
      });
      setAuditDraft(synced);
      await assignAudit(synced.id!, {
        assigneeIds,
        storeIds,
      });
      const saved = await saveAuditDraft({
        ...synced,
        assigneeIds,
        storeIds,
        assignBy,
      });
      setAuditDraft(saved);
      persistAssignmentLocally();
      toast.success(t('assignmentSaved'));
    } catch (error: any) {
      toast.error(error.message || t('failedToSaveAssignment'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!auditDraft?.title?.trim()) {
      toast.error(t('addAuditTitleBeforeAssigning'));
      return;
    }
    if (!hasAssignment()) {
      toast.error(t('assignBeforePublishing'));
      return;
    }

    setIsSaving(true);
    try {
      const { assigneeIds, storeIds } = getEffectiveAssignment();
      const synced = await ensureAuditDraftSaved({
        ...auditDraft,
        assigneeIds,
        storeIds,
        assignBy,
      });
      setAuditDraft(synced);
      await assignAudit(synced.id!, {
        assigneeIds,
        storeIds,
      });
      await publishAudit(synced.id!);
      toast.success(t('auditPublished'));
      navigate("/process");
    } catch (error: any) {
      toast.error(error.message || t('failedToPublishAudit'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBulkTemplate = () => {
    const rows = [
      { EntityId: stores[0]?.id ?? "", "Store Name": stores[0]?.label ?? "Main Branch", Emails: "user@example.com" },
    ];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assignments");
    XLSX.writeFile(workbook, "audit-bulk-assignee-template.xlsx");
  };

  const handleBulkFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);
      const parsed = parseBulkAssignmentRows(rows, userRows, stores);
      if (parsed.assigneeIds.length === 0 && parsed.storeIds.length === 0) {
        toast.error(t('noValidMappings'));
        return;
      }
      setBulkAssigneeIds(parsed.assigneeIds);
      setBulkStoreIds(parsed.storeIds);
      setBulkFileName(file.name);
      setSelectedUserIds(parsed.assigneeIds);
      setSelectedStoreIds(parsed.storeIds);
      persistAssignmentLocally();
      toast.success(`${t('loaded')} ${parsed.storeIds.length} ${t('stores')}(s) ${t('and')} ${parsed.assigneeIds.length} ${t('users')}(s) ${t('fromFile')}`);
    } catch {
      toast.error(t('couldNotReadFile'));
    }
  };

  const currentOptions =
    assignBy === "store" ? stores : assignBy === "user" ? users : assignBy === "profile" ? profiles : [];

  const filteredOptions = currentOptions.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedCount =
    assignBy === "store"
      ? selectedStoreIds.length
      : assignBy === "user"
        ? selectedUserIds.length
        : assignBy === "profile"
          ? selectedProfileIds.length
          : bulkAssigneeIds.length + bulkStoreIds.length;

  return (
    <div className="workflow-page">
      <AuditHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      <div className="border-b bg-white px-4 py-2 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">{t('assignBy')}</span>
        {ASSIGN_MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            onClick={() => {
              setAssignBy(mode.key);
              setSearch("");
            }}
            className={`rounded-full px-4 py-1 text-sm ${
              assignBy === mode.key ? "bg-sky-600 text-white" : "hover:bg-muted"
            }`}
          >
            {mode.label}
          </button>
        ))}
        {auditDraft?.title && (
          <span className="ml-auto text-sm text-muted-foreground">
            {t('auditLabel').replace('{{title}}', auditDraft.title)}
          </span>
        )}
      </div>

      <div className="p-6 max-w-4xl">
        {!auditDraft?.title?.trim() && (
          <div className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            {t('addAuditTitleBeforeAssigning')}
          </div>
        )}
        {isDraftSyncing && (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {t('syncingAuditDraft')}
          </div>
        )}

        {(assignBy === "store" || assignBy === "user" || assignBy === "profile") && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder={
                  assignBy === "store"
                    ? t('searchStores')
                    : assignBy === "user"
                      ? t('searchUsers')
                      : t('searchAssigneeProfilesPlaceholder')
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="rounded-lg border bg-white divide-y max-h-96 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">{t('noStoresFound')}</p>
              ) : (
                filteredOptions.map((option) => {
                  const checked =
                    assignBy === "store"
                      ? selectedStoreIds.includes(option.id)
                      : assignBy === "user"
                        ? selectedUserIds.includes(option.id)
                        : selectedProfileIds.includes(option.id);

                  return (
                    <label
                      key={option.id}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-sky-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (assignBy === "store") {
                            const next = toggleId(selectedStoreIds, option.id);
                            setSelectedStoreIds(next);
                            persistAssignmentLocally();
                          } else if (assignBy === "user") {
                            const next = toggleId(selectedUserIds, option.id);
                            setSelectedUserIds(next);
                            persistAssignmentLocally();
                          } else {
                            const next = toggleId(selectedProfileIds, option.id);
                            setSelectedProfileIds(next);
                            persistAssignmentLocally();
                          }
                        }}
                        className="accent-sky-600"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  );
                })
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {assignBy === "store"
                ? t('selectedStoresCount').replace('{{count}}', String(selectedCount))
                : assignBy === "user"
                  ? t('selectedUsersCount').replace('{{count}}', String(selectedCount))
                  : t('selectedLabel') + " " + selectedCount}
            </p>
          </div>
        )}

        {assignBy === "bulk" && (
          <div className="space-y-4 rounded-lg border bg-white p-4">
            <div>
              <h3 className="text-sm font-medium">{t('bulkAssignee')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('bulkDescription')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadBulkTemplate}
                className="inline-flex items-center gap-2 rounded-md border border-sky-600 px-4 py-2 text-sm text-sky-700 hover:bg-sky-50"
              >
                <Download className="h-4 w-4" />
                {t('downloadTemplate')}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-md border border-sky-600 px-4 py-2 text-sm text-sky-700 hover:bg-sky-50"
              >
                <Upload className="h-4 w-4" />
                {t('uploadExcelCsv')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleBulkFile(file);
                  event.target.value = "";
                }}
              />
            </div>
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {t('requiredColumns')} <strong>{t('entityId')}</strong>, <strong>{t('storeName')}</strong>, <strong>{t('emails')}</strong>
              {t('commaSeparated')}
            </div>
            {bulkFileName ? (
              <p className="text-sm">
                {t('loadedFile')} <strong>{bulkFileName}</strong> — {bulkStoreIds.length} {t('stores')}(s),{" "}
                {bulkAssigneeIds.length} {t('users')}(s)
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noBulkFile')}</p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t('saveAssignment')}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handlePublish}
            className="inline-flex items-center gap-2 rounded-md border border-sky-600 px-4 py-2 text-sm text-sky-700 hover:bg-sky-50 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {t('publishAudit')}
          </button>
        </div>
      </div>
    </div>
  );
}
