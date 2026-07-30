import { useEffect, useState } from "react";
import { Search, Plus, Check } from "lucide-react";
import { useLocation } from "wouter";
import AssessmentHeader from "@/components/AssessmentHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  assignAssessment,
  ensureAssessmentDraftSaved,
  fetchAssigneeProfiles,
  fetchDesignations,
  fetchEntities,
  publishAssessment,
  saveAssessmentDraft,
} from "@/lib/assessmentApi";
import {
  loadAssessmentDraft,
  saveAssessmentDraftLocal,
  type AssessmentDraftState,
} from "@/lib/assessmentDraft";
import { useLanguage } from "@/contexts/LanguageContext";

type AssignOption = { id: string; label: string };
type AssignBy = "store" | "designation" | "profile";

export default function AssessmentCreation() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("publish");
  const [assignBy, setAssignBy] = useState<AssignBy>("store");
  const [draft, setDraft] = useState<AssessmentDraftState | null>(null);
  const [stores, setStores] = useState<AssignOption[]>([]);
  const [designations, setDesignations] = useState<AssignOption[]>([]);
  const [profiles, setProfiles] = useState<AssignOption[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedDesignationNames, setSelectedDesignationNames] = useState<string[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loaded = loadAssessmentDraft();
    setDraft(loaded);
    setSelectedStoreIds(loaded.storeIds ?? []);
    setSelectedDesignationNames(loaded.designationNames ?? []);
    setSelectedProfileIds(loaded.assigneeProfileIds ?? []);
    if (loaded.assignBy) setAssignBy(loaded.assignBy);

    let cancelled = false;

    const loadAssignmentOptions = async () => {
      const [entityRows, designationRows, profileRows] = await Promise.all([
        fetchEntities(),
        fetchDesignations(),
        fetchAssigneeProfiles(),
      ]);
      if (cancelled) return;

      setStores(
        (Array.isArray(entityRows) ? entityRows : []).map((entity: any) => ({
          id: String(entity.id),
          label: entity.storeName || entity.entityName || entity.name || String(entity.id),
        })),
      );
      setDesignations(
        (Array.isArray(designationRows) ? designationRows : []).map((row: any) => ({
          id: String(row.id),
          label: row.name || String(row.id),
        })),
      );
      setProfiles(
        (Array.isArray(profileRows) ? profileRows : []).map((row: any) => ({
          id: String(row.id),
          label: row.profileName || row.name || String(row.id),
        })),
      );
    };

    loadAssignmentOptions().catch(() => {
      if (!cancelled) {
        toast.error(t("couldNotLoadUsersOrStores") || "Could not load assignment options");
      }
    });

    if (loaded.title?.trim()) {
      ensureAssessmentDraftSaved(loaded)
        .then((saved) => {
          if (cancelled) return;
          setDraft(saved);
          setSelectedStoreIds(saved.storeIds ?? []);
          setSelectedDesignationNames(saved.designationNames ?? []);
          setSelectedProfileIds(saved.assigneeProfileIds ?? []);
        })
        .catch((error: any) => {
          if (!cancelled) toast.error(error.message || "Could not sync assessment draft");
        });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleId = (ids: string[], id: string) =>
    ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];

  const toggleName = (names: string[], name: string) =>
    names.includes(name) ? names.filter((item) => item !== name) : [...names, name];

  const currentOptions =
    assignBy === "store" ? stores : assignBy === "designation" ? designations : profiles;

  const filteredOptions = currentOptions.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  const isSelected = (option: AssignOption) => {
    if (assignBy === "store") return selectedStoreIds.includes(option.id);
    if (assignBy === "designation") return selectedDesignationNames.includes(option.label);
    return selectedProfileIds.includes(option.id);
  };

  const toggleOption = (option: AssignOption) => {
    if (assignBy === "store") {
      const next = toggleId(selectedStoreIds, option.id);
      setSelectedStoreIds(next);
      persistLocal({ storeIds: next });
      return;
    }
    if (assignBy === "designation") {
      const next = toggleName(selectedDesignationNames, option.label);
      setSelectedDesignationNames(next);
      persistLocal({ designationNames: next });
      return;
    }
    const next = toggleId(selectedProfileIds, option.id);
    setSelectedProfileIds(next);
    persistLocal({ profileIds: next });
  };

  const persistLocal = (patch: {
    storeIds?: string[];
    designationNames?: string[];
    profileIds?: string[];
  }) => {
    if (!draft) return;
    const updated = {
      ...draft,
      assignBy,
      storeIds: patch.storeIds ?? selectedStoreIds,
      designationNames: patch.designationNames ?? selectedDesignationNames,
      assigneeProfileIds: patch.profileIds ?? selectedProfileIds,
    };
    setDraft(updated);
    saveAssessmentDraftLocal(updated);
  };

  const hasAssignment = () => {
    if (assignBy === "store") return selectedStoreIds.length > 0;
    if (assignBy === "designation") return selectedDesignationNames.length > 0;
    return selectedProfileIds.length > 0;
  };

  const buildDraftPayload = (): AssessmentDraftState => ({
    ...(draft as AssessmentDraftState),
    assignBy,
    storeIds: selectedStoreIds,
    designationNames: selectedDesignationNames,
    assigneeProfileIds: selectedProfileIds,
    assigneeIds: [],
  });

  const handleSave = async () => {
    if (!draft?.title?.trim()) {
      toast.error(t("setTitleFirst"));
      navigate("/assessment-settings");
      return;
    }
    if (!hasAssignment()) {
      toast.error(t("selectAtLeastOneAssignment"));
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildDraftPayload();
      const synced = await ensureAssessmentDraftSaved(payload);
      setDraft(synced);
      await assignAssessment(synced.id!, {
        storeIds: selectedStoreIds,
        assigneeIds: [],
        assigneeProfiles: {
          assignBy,
          profileIds: selectedProfileIds,
          designationNames: selectedDesignationNames,
        },
      });
      const saved = await saveAssessmentDraft(payload);
      setDraft(saved);
      saveAssessmentDraftLocal(saved);
      toast.success(t("assignmentSaved"));
    } catch (error: any) {
      toast.error(error.message || t("failedToSaveAssignment"));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draft?.title?.trim()) {
      toast.error(t("setTitleFirst"));
      return;
    }
    if (!hasAssignment()) {
      toast.error(t("assignBeforePublishing"));
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildDraftPayload();
      const synced = await ensureAssessmentDraftSaved(payload);
      await assignAssessment(synced.id!, {
        storeIds: selectedStoreIds,
        assigneeIds: [],
        assigneeProfiles: {
          assignBy,
          profileIds: selectedProfileIds,
          designationNames: selectedDesignationNames,
        },
      });
      await publishAssessment(synced.id!);
      toast.success(t("assessmentPublished"));
      navigate("/assessments");
    } catch (error: any) {
      toast.error(error.message || t("failedToPublishAssessment"));
    } finally {
      setIsSaving(false);
    }
  };

  const assignModes: { key: AssignBy; label: string }[] = [
    { key: "store", label: t("byStore") },
    { key: "designation", label: t("byDesignation") },
    { key: "profile", label: t("byAssigneeProfile") },
  ];

  return (
    <div className="workflow-page">
      <AssessmentHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold">{t("publishAssessment")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("publishAssessmentDesc")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {assignModes.map((mode) => (
            <Button
              key={mode.key}
              variant={assignBy === mode.key ? "default" : "outline"}
              onClick={() => {
                setAssignBy(mode.key);
                setSearch("");
                persistLocal({});
              }}
            >
              {mode.label}
            </Button>
          ))}
        </div>

        <div className="rounded-xl border bg-white p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={
                assignBy === "store"
                  ? t("searchStores")
                  : assignBy === "designation"
                    ? t("searchDesignations")
                    : t("searchAssigneeProfiles")
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {filteredOptions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("noOptionsFound")}</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                    isSelected(option) ? "border-sky-500 bg-sky-50" : ""
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected(option) && <Check className="h-4 w-4 text-sky-600" />}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/assessment-settings")}>
            {t("backToProperties")}
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {t("saveAssignment")}
          </Button>
          <Button onClick={handlePublish} disabled={isSaving}>
            <Plus className="mr-2 h-4 w-4" />
            {t("publishAssessment")}
          </Button>
        </div>
      </div>
    </div>
  );
}
