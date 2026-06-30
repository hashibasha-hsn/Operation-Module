import { useEffect, useState } from "react";
import { Search, Plus, Check } from "lucide-react";
import { useLocation } from "wouter";
import ProcessHeader from "@/components/ProcessHeader";
import { toast } from "sonner";
import {
  assignProcess,
  fetchEntities,
  fetchUsers,
  getUserDisplayName,
  publishProcess,
  saveProcessDraft,
} from "@/lib/processApi";
import { loadProcessDraft, saveProcessDraftLocal, type ProcessDraftState } from "@/lib/processDraft";

type AssignOption = { id: string; label: string };

export default function ProcessCreation() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("assign");
  const [assignBy, setAssignBy] = useState<"store" | "user">("store");
  const [processDraft, setProcessDraft] = useState<ProcessDraftState | null>(null);
  const [users, setUsers] = useState<AssignOption[]>([]);
  const [stores, setStores] = useState<AssignOption[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const draft = loadProcessDraft();
    setProcessDraft(draft);
    setSelectedUserIds(draft.assigneeIds ?? []);
    setSelectedStoreIds(draft.storeIds ?? []);
    if (draft.assignBy) setAssignBy(draft.assignBy);

    Promise.all([fetchUsers(100), fetchEntities()])
      .then(([userRows, entityRows]) => {
        setUsers(
          userRows.map((user: any) => ({
            id: user.userId ?? user.id,
            label: getUserDisplayName(user),
          })),
        );
        setStores(
          entityRows.map((entity: any) => ({
            id: entity.id,
            label: entity.storeName || entity.entityName || entity.name || entity.id,
          })),
        );
      })
      .catch(() => {
        toast.error("Could not load users or stores");
      });
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
    if (!processDraft) return;
    const updated = {
      ...processDraft,
      assigneeIds,
      storeIds,
      assignBy,
    };
    setProcessDraft(updated);
    saveProcessDraftLocal(updated);
  };

  const handleSave = async () => {
    if (!processDraft?.id) {
      toast.error("Save the process draft on Title/Build tabs first");
      return;
    }
    if (selectedUserIds.length === 0 && selectedStoreIds.length === 0) {
      toast.error("Select at least one user or store to assign");
      return;
    }

    setIsSaving(true);
    try {
      await assignProcess(processDraft.id, {
        assigneeIds: selectedUserIds,
        storeIds: selectedStoreIds,
      });
      const saved = await saveProcessDraft({
        ...processDraft,
        assigneeIds: selectedUserIds,
        storeIds: selectedStoreIds,
        assignBy,
      });
      setProcessDraft(saved);
      persistAssignmentLocally(selectedUserIds, selectedStoreIds);
      toast.success("Assignment saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save assignment");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!processDraft?.id) {
      toast.error("Save the process draft first");
      return;
    }
    if (selectedUserIds.length === 0 && selectedStoreIds.length === 0) {
      toast.error("Assign at least one user or store before publishing");
      return;
    }

    setIsSaving(true);
    try {
      await assignProcess(processDraft.id, {
        assigneeIds: selectedUserIds,
        storeIds: selectedStoreIds,
      });
      await publishProcess(processDraft.id);
      toast.success("Process published");
      navigate("/process");
    } catch (error: any) {
      toast.error(error.message || "Failed to publish process");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="workflow-page">
      <ProcessHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      <div className="border-b bg-white px-4 py-2 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Assign By</span>
        {(["store", "user"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setAssignBy(mode)}
            className={`rounded-full px-4 py-1 text-sm capitalize ${
              assignBy === mode ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {mode}
          </button>
        ))}
        {processDraft?.title && (
          <span className="ml-auto text-sm text-muted-foreground">
            Process: <strong>{processDraft.title}</strong>
          </span>
        )}
      </div>

      <div className="p-6 max-w-4xl">
        {!processDraft?.id && (
          <div className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Complete Title and Build steps and save a draft before assigning.
          </div>
        )}

        {assignBy === "store" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search stores"
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="rounded-lg border bg-white divide-y max-h-96 overflow-y-auto">
              {filteredStores.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No stores found</p>
              ) : (
                filteredStores.map((store) => (
                  <label
                    key={store.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStoreIds.includes(store.id)}
                      onChange={() => {
                        const next = toggleId(selectedStoreIds, store.id);
                        setSelectedStoreIds(next);
                        persistAssignmentLocally(selectedUserIds, next);
                      }}
                      className="accent-primary"
                    />
                    <span className="text-sm">{store.label}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Selected stores: {selectedStoreIds.length}
            </p>
          </div>
        )}

        {assignBy === "user" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search users"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="rounded-lg border bg-white divide-y max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No users found</p>
              ) : (
                filteredUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => {
                        const next = toggleId(selectedUserIds, user.id);
                        setSelectedUserIds(next);
                        persistAssignmentLocally(next, selectedStoreIds);
                      }}
                      className="accent-primary"
                    />
                    <span className="text-sm">{user.label}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Selected users: {selectedUserIds.length}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Save Assignment
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handlePublish}
            className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm text-primary hover:bg-muted/50 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Publish Process
          </button>
        </div>
      </div>
    </div>
  );
}
