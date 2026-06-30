import { useEffect, useState } from "react";
import { Search, Plus, Check } from "lucide-react";
import { useLocation } from "wouter";
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
import { loadAuditDraft, saveAuditDraftLocal, type AuditDraftState } from "@/lib/auditDraft";
import { useLanguage } from "@/contexts/LanguageContext";

type AssignOption = { id: string; label: string };

export default function AuditCreation() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("assign");
  const [assignBy, setAssignBy] = useState<"store" | "user">("store");
  const [auditDraft, setAuditDraft] = useState<AuditDraftState | null>(null);
  const [users, setUsers] = useState<AssignOption[]>([]);
  const [stores, setStores] = useState<AssignOption[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftSyncing, setIsDraftSyncing] = useState(false);

  useEffect(() => {
    const draft = loadAuditDraft();
    setAuditDraft(draft);
    setSelectedUserIds(draft.assigneeIds ?? []);
    setSelectedStoreIds(draft.storeIds ?? []);
    if (draft.assignBy) setAssignBy(draft.assignBy);

    Promise.all([fetchUsers(100), fetchEntities()])
      .then(([userRows, entityRows]) => {
        setUsers(
          userRows.map((user: any) => ({
            id: user.userId ?? user.id,
            label: user.fullName || user.name || user.email || user.userId || user.id,
          })),
        );
        setStores(
          entityRows.map((entity: any) => ({
            id: entity.id,
            label: entity.storeName || entity.entityName || entity.name || entity.id,
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

  const filteredUsers = users.filter((user) =>
    user.label.toLowerCase().includes(userSearch.toLowerCase()),
  );
  const filteredStores = stores.filter((store) =>
    store.label.toLowerCase().includes(storeSearch.toLowerCase()),
  );

  const persistAssignmentLocally = (assigneeIds: string[], storeIds: string[]) => {
    if (!auditDraft) return;
    const updated = { ...auditDraft, assigneeIds, storeIds, assignBy };
    setAuditDraft(updated);
    saveAuditDraftLocal(updated);
  };

  const handleSave = async () => {
    if (!auditDraft?.title?.trim()) {
      toast.error(t('addAuditTitleBeforeAssigning'));
      return;
    }
    if (selectedUserIds.length === 0 && selectedStoreIds.length === 0) {
      toast.error(t('selectUserOrStoreToAssign'));
      return;
    }

    setIsSaving(true);
    try {
      const synced = await ensureAuditDraftSaved({
        ...auditDraft,
        assigneeIds: selectedUserIds,
        storeIds: selectedStoreIds,
        assignBy,
      });
      setAuditDraft(synced);
      await assignAudit(synced.id!, {
        assigneeIds: selectedUserIds,
        storeIds: selectedStoreIds,
      });
      const saved = await saveAuditDraft({
        ...synced,
        assigneeIds: selectedUserIds,
        storeIds: selectedStoreIds,
        assignBy,
      });
      setAuditDraft(saved);
      persistAssignmentLocally(selectedUserIds, selectedStoreIds);
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
    if (selectedUserIds.length === 0 && selectedStoreIds.length === 0) {
      toast.error(t('assignBeforePublishing'));
      return;
    }

    setIsSaving(true);
    try {
      const synced = await ensureAuditDraftSaved({
        ...auditDraft,
        assigneeIds: selectedUserIds,
        storeIds: selectedStoreIds,
        assignBy,
      });
      setAuditDraft(synced);
      await assignAudit(synced.id!, {
        assigneeIds: selectedUserIds,
        storeIds: selectedStoreIds,
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

  return (
    <div className="workflow-page">
      <AuditHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      <div className="border-b bg-white px-4 py-2 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('assignBy')}</span>
        {(["store", "user"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setAssignBy(mode)}
            className={`rounded-full px-4 py-1 text-sm capitalize ${
              assignBy === mode ? "bg-sky-600 text-white" : "hover:bg-muted"
            }`}
          >
            {t(mode)}
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

        {assignBy === "store" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder={t('searchStores')}
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="rounded-lg border bg-white divide-y max-h-96 overflow-y-auto">
              {filteredStores.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">{t('noStoresFound')}</p>
              ) : (
                filteredStores.map((store) => (
                  <label
                    key={store.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-sky-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStoreIds.includes(store.id)}
                      onChange={() => {
                        const next = toggleId(selectedStoreIds, store.id);
                        setSelectedStoreIds(next);
                        persistAssignmentLocally(selectedUserIds, next);
                      }}
                      className="accent-sky-600"
                    />
                    <span className="text-sm">{store.label}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t('selectedStoresCount').replace('{{count}}', String(selectedStoreIds.length))}</p>
          </div>
        )}

        {assignBy === "user" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder={t('searchUsers')}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="rounded-lg border bg-white divide-y max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">{t('noUsersFound')}</p>
              ) : (
                filteredUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-sky-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => {
                        const next = toggleId(selectedUserIds, user.id);
                        setSelectedUserIds(next);
                        persistAssignmentLocally(next, selectedStoreIds);
                      }}
                      className="accent-sky-600"
                    />
                    <span className="text-sm">{user.label}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t('selectedUsersCount').replace('{{count}}', String(selectedUserIds.length))}</p>
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
