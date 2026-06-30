import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Type, Settings, Grid2x2, Calculator, Calendar, Clock, Timer, Calculator as CalculatorIcon, Pen, MapPin, Users, Building2, FolderOpen, Folder, ChevronDown, Trash2, Copy, FileText, Check, Paperclip, MessageSquareMore, MessageSquarePlus, Clipboard, FilePlus, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Zap, Scan, AlertCircle, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import AssignTabContent from "@/components/AssignTabContent";
import ProcessHeader from "@/components/ProcessHeader";
import AuditHeader from "@/components/AuditHeader";
import AssessmentHeader from "@/components/AssessmentHeader";
import AssessmentQuestionCard from "@/components/assessment/AssessmentQuestionCard";
import QuestionAddonsToolbar from "@/components/process/QuestionAddonsToolbar";
import { toast } from "sonner";
import {
  formElementsToQuestions,
  loadProcessDraft,
  questionsToFormElements,
  saveProcessDraftLocal,
  type ProcessDraftState,
  type ProcessSectionDraft,
} from "@/lib/processDraft";
import { fetchQuestionTags, saveProcessDraft } from "@/lib/processApi";
import {
  auditQuestionsToFormElements,
  formElementsToAuditQuestions,
  loadAuditDraft,
  saveAuditDraftLocal as saveAuditDraftLocalOnly,
  type AuditDraftState,
  type AuditSectionDraft,
} from "@/lib/auditDraft";
import { saveAuditDraft } from "@/lib/auditApi";
import {
  assessmentQuestionsToFormElements,
  formElementsToAssessmentQuestions,
  loadAssessmentDraft,
  saveAssessmentDraftLocal as saveAssessmentDraftLocalOnly,
  type AssessmentDraftState,
  type AssessmentSectionDraft,
} from "@/lib/assessmentDraft";
import { saveAssessmentDraft } from "@/lib/assessmentApi";

export default function CreateForm() {
  const [location] = useLocation();
  const isAuditMode = location.includes("audit-create-form");
  const isAssessmentMode = location.includes("assessment-create-form");
  const isSectionDraftMode = isAuditMode || isAssessmentMode;
  const [activeTab, setActiveTab] = useState("build");
  const [processDraft, setProcessDraft] = useState<ProcessDraftState | AuditDraftState | null>(null);
  const [sections, setSections] = useState<ProcessSectionDraft[] | AuditSectionDraft[]>([]);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState({ field1: "", field2: "" });
  const [processWithTags, setProcessWithTags] = useState(false);
  const [formElements, setFormElements] = useState<Array<{
    id: string;
    type: string;
    label: string;
    config?: {
      validationType?: 'alphanumeric' | 'text' | 'number' | 'email' | 'phone';
      marks?: number;
      options?: Array<{ label: string; score?: number }>;
      columns?: string[];
      rows?: string[];
      dataType?: 'text' | 'alphanumeric' | 'number' | 'date' | 'time' | 'dropdown' | 'barcode' | 'attachment';
      selectedTag?: string;
      required?: boolean;
      reviewType?: 'none' | 'review-existing' | 'independent-review';
      reviewerLevel?: 'L1' | 'L2' | 'L3' | 'L4';
      actionPoint?: 'none' | 'manual' | 'auto';
      actionPointAutoTriggers?: string[];
      allowComment?: boolean;
      commentRequired?: boolean;
      timestamp?: boolean;
      attachFile?: boolean;
      questionReferenceFile?: string;
      markNA?: boolean;
      answerAttachment?: boolean;
      answerAttachmentRequired?: boolean;
      instructionText?: string;
      instructionAttachment?: string;
      questionTag?: string;
      autoFill?: boolean;
      barcode?: boolean;
      scoringType?: 'none' | 'weightage' | 'input';
      weightage?: number;
      rangeValidation?: { min?: number; max?: number };
      calculatorFunction?: 'none' | 'average' | 'sum-na' | 'sum-weightage';
    };
  }>>([]);
  const [questionTags, setQuestionTags] = useState<Array<{ id?: string; tagName: string; values?: string[] }>>([]);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestionTags().then(setQuestionTags).catch(() => setQuestionTags([]));
  }, []);

  useEffect(() => {
    if (isAssessmentMode) {
      const draft = loadAssessmentDraft();
      setProcessDraft(draft);
      setSections(draft.sections);
      setActiveSectionId(draft.sections[0]?.clientId ?? "");
      setFieldValues({ field1: draft.title, field2: draft.description });
      setFormElements(assessmentQuestionsToFormElements(draft.sections.slice(0, 1)));
      return;
    }
    if (isAuditMode) {
      const draft = loadAuditDraft();
      setProcessDraft(draft);
      setSections(draft.sections);
      setActiveSectionId(draft.sections[0]?.clientId ?? "");
      setFieldValues({ field1: draft.title, field2: draft.description });
      setFormElements(auditQuestionsToFormElements(draft.sections.slice(0, 1)));
      return;
    }
    const draft = loadProcessDraft();
    setProcessDraft(draft);
    setSections(draft.sections);
    setActiveSectionId(draft.sections[0]?.clientId ?? "");
    setFieldValues({
      field1: draft.title,
      field2: draft.description,
    });
    setFormElements(questionsToFormElements(draft.sections.slice(0, 1)));
  }, [isAuditMode, isAssessmentMode]);

  useEffect(() => {
    if (!isSectionDraftMode || !processDraft) return;
    if (isAssessmentMode) {
      saveAssessmentDraftLocalOnly({
        ...(processDraft as AssessmentDraftState),
        title: fieldValues.field1,
        description: fieldValues.field2,
        sections: sections as AssessmentSectionDraft[],
      });
      return;
    }
    saveAuditDraftLocalOnly({
      ...(processDraft as AuditDraftState),
      title: fieldValues.field1,
      description: fieldValues.field2,
      sections: sections as AuditSectionDraft[],
    });
  }, [isSectionDraftMode, isAssessmentMode, processDraft, fieldValues.field1, fieldValues.field2, sections]);

  const syncActiveSectionQuestions = (
    nextSections: ProcessSectionDraft[],
    sectionId: string,
    elements: typeof formElements,
    sectionDraftMode = isSectionDraftMode,
    assessmentMode = isAssessmentMode,
  ) =>
    nextSections.map((section) =>
      section.clientId === sectionId
        ? {
            ...section,
            questions: sectionDraftMode
              ? assessmentMode
                ? formElementsToAssessmentQuestions(elements)
                : formElementsToAuditQuestions(elements)
              : formElementsToQuestions(elements),
          }
        : section,
    );

  const switchSection = (sectionId: string) => {
    if (sectionId === activeSectionId) return;
    const synced = syncActiveSectionQuestions(sections as ProcessSectionDraft[], activeSectionId, formElements);
    setSections(synced);
    const nextSection = synced.find((section) => section.clientId === sectionId);
    setActiveSectionId(sectionId);
    setFormElements(
      isSectionDraftMode
        ? isAssessmentMode
          ? assessmentQuestionsToFormElements(nextSection ? [nextSection] : [])
          : auditQuestionsToFormElements(nextSection ? [nextSection] : [])
        : questionsToFormElements(nextSection ? [nextSection] : []),
    );
  };

  const addSection = (titlePrefix = "Section") => {
    const synced = syncActiveSectionQuestions(sections, activeSectionId, formElements);
    const sameTypeCount = synced.filter((section) =>
      section.title.startsWith(`${titlePrefix} `),
    ).length;
    const newSection: ProcessSectionDraft = {
      clientId: `${titlePrefix.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      title: `${titlePrefix} ${sameTypeCount + 1}`,
      description: "",
      displayOrder: synced.length,
      questions: [],
    };
    const nextSections = [...synced, newSection];
    setSections(nextSections);
    setActiveSectionId(newSection.clientId);
    setFormElements([]);
  };

  const handleSave = async () => {
    if (!processDraft) return;
    if (!processDraft.title.trim() && !fieldValues.field1.trim() && !isAssessmentMode) {
      toast.error(
        isAuditMode
          ? "Add an audit title on the Title tab first"
          : "Add a process title on the Title tab first",
      );
      return;
    }

    const syncedSections = syncActiveSectionQuestions(
      sections as ProcessSectionDraft[],
      activeSectionId,
      formElements,
      isSectionDraftMode,
      isAssessmentMode,
    );
    const payload = {
      ...processDraft,
      title: fieldValues.field1 || processDraft.title || (isAssessmentMode ? "New Assessment" : ""),
      description: fieldValues.field2 || processDraft.description,
      sections: syncedSections,
      properties: processDraft.properties,
    };

    setIsSaving(true);
    try {
      if (isAssessmentMode) {
        const saved = await saveAssessmentDraft(payload as AssessmentDraftState);
        setProcessDraft(saved);
        setSections(saved.sections);
        saveAssessmentDraftLocalOnly(saved);
        toast.success("Assessment draft saved");
      } else if (isAuditMode) {
        const saved = await saveAuditDraft(payload as AuditDraftState);
        setProcessDraft(saved);
        setSections(saved.sections);
        saveAuditDraftLocalOnly(saved);
        toast.success("Audit draft saved");
      } else {
        const saved = await saveProcessDraft(payload as ProcessDraftState);
        setProcessDraft(saved);
        setSections(saved.sections);
        if (saved.sections[0]) {
          setActiveSectionId(
            saved.sections.find((s) => s.clientId === activeSectionId)?.clientId ??
              saved.sections[0].clientId,
          );
        }
        saveProcessDraftLocal(saved);
        toast.success("Process draft saved");
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          `Failed to save ${isAssessmentMode ? "assessment" : isAuditMode ? "audit" : "process"} draft`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = () => {
    if (isAssessmentMode) {
      toast.message("Configure properties and publish on the Publish tab");
      return;
    }
    toast.message("Publish will be enabled after properties and assign are configured");
  };

  // Process Properties State
  const [processProperties, setProcessProperties] = useState({
    occurrence: 'one-time',
    responsesAfterEndTime: 'accept',
    numberOfResponses: 'one-per-user',
    submissionBy: 'anyone',
    dateRangeSelection: 'allowed',
    periodicityType: 'daily',
    startTime: '',
    endTime: '',
    emailAlerts: false,
    mobileNotifications: false,
    reportUrlSharing: false,
    processWithReview: false,
    reportType: 'hierarchical',
    trackLocation: false,
    trackVisualMerchandising: false,
    dynamicAssignment: false,
    carryForwardActionPoints: false,
    createActionPointsFromReports: false,
    processPriority: 'medium',
    pageCount: 0,
    publicFormEnabled: false,
    defaultLanguage: 'english',
  });

  // Properties tab navigation state
  const [selectedPropertiesSection, setSelectedPropertiesSection] = useState('process');

  // Section completion status
  const [sectionStatus, setSectionStatus] = useState({
    process: 'completed',
    periodicity: 'warning',
    reminders: 'completed',
    submissionReport: 'completed',
    review: 'warning',
    advanceSettings: 'completed',
    language: 'completed',
  });

  const openSettingsDialog = (elementId: string) => {
    setSelectedElementId(elementId);
    setSettingsDialogOpen(true);
  };

  const handleSaveSettings = () => {
    setSettingsDialogOpen(false);
    setSelectedElementId(null);
  };

  const addFormElement = (type: string, label: string) => {
    const newElement: any = {
      id: Date.now().toString(),
      type,
      label: isAssessmentMode ? "" : label,
    };

    // Add default config based on type
    if (type === 'short-answer') {
      newElement.config = { validationType: 'text' };
    } else if (type === 'single-answer') {
      newElement.config = isAssessmentMode
        ? { options: [], optionImage: false }
        : { options: [{ label: 'Compliant', score: 100 }, { label: 'Non-Compliant', score: 0 }] };
    } else if (type === 'multiple-answers') {
      newElement.config = isAssessmentMode
        ? { options: [], optionImage: false }
        : { marks: 5, options: [] };
    } else if (type === 'dropdown') {
      newElement.config = { options: [] };
    }

    setFormElements([...formElements, newElement]);
  };

  const deleteFormElement = (id: string) => {
    setFormElements(formElements.filter(element => element.id !== id));
  };

  const copyFormElement = (element: { id: string; type: string; label: string; config?: any }) => {
    const copiedElement = {
      ...element,
      id: Date.now().toString(),
    };
    const index = formElements.findIndex(e => e.id === element.id);
    const newElements = [...formElements];
    newElements.splice(index + 1, 0, copiedElement);
    setFormElements(newElements);
  };
  return (
    <div className="workflow-page">
      {isAssessmentMode ? (
        <AssessmentHeader
          activeTab="build"
          onSave={handleSave}
          onPublish={handlePublish}
        />
      ) : isAuditMode ? (
        <AuditHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSave={handleSave}
          onPublish={handlePublish}
        />
      ) : (
        <ProcessHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSave={handleSave}
          onPublish={handlePublish}
        />
      )}
      <Tabs defaultValue="build" className="flex-1">
        <TabsContent value="title" className="space-y-6 p-6">
          {/* Click to edit fields */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 border-b-2 border-dashed border-gray-300 py-2">
                {editingField === "field1" ? (
                  <Input
                    value={fieldValues.field1}
                    onChange={(e) => setFieldValues({ ...fieldValues, field1: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                    autoFocus
                    className="border-0 p-0 h-8 focus-visible:ring-0"
                    placeholder="Enter title"
                  />
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p
                        className="text-gray-400 cursor-pointer hover:text-gray-600"
                        onClick={() => setEditingField("field1")}
                      >
                        {fieldValues.field1 || "Click to edit"}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                      <p>Edit Form Name</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 border-b-2 border-dashed border-gray-300 py-2">
                {editingField === "field2" ? (
                  <Input
                    value={fieldValues.field2}
                    onChange={(e) => setFieldValues({ ...fieldValues, field2: e.target.value })}
                    onBlur={() => setEditingField(null)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                    autoFocus
                    className="border-0 p-0 h-8 focus-visible:ring-0"
                    placeholder="Enter description"
                  />
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p
                        className="text-gray-400 cursor-pointer hover:text-gray-600"
                        onClick={() => setEditingField("field2")}
                      >
                        {fieldValues.field2 || "Click to edit"}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                      <p>Edit Form Description</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

          {/* Assign Process Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Assign Process Tags</label>
            <div className="relative">
              <select className="w-full px-3 py-2 border border-input rounded-md bg-background appearance-none pr-10">
                <option value="">Select Process Tags</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="p-0">
          <div className="flex h-[calc(100vh-73px)]">
            {/* Left Panel - Navigation */}
            <div className="w-64 border-r bg-white p-4">
              <h3 className="font-semibold mb-4">Settings</h3>
              <div className="space-y-1">
                {[
                  { id: 'process', label: 'Process' },
                  { id: 'periodicity', label: 'Periodicity' },
                  { id: 'reminders', label: 'Reminders and Notifications' },
                  { id: 'submissionReport', label: 'Submission Report' },
                  { id: 'review', label: 'Review' },
                  { id: 'advanceSettings', label: 'Advance Settings' },
                  { id: 'language', label: 'Language Settings' },
                ].map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedPropertiesSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${
                      selectedPropertiesSection === section.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">{section.label}</span>
                    {sectionStatus[section.id as keyof typeof sectionStatus] === 'completed' && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Panel - Configuration */}
            <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
              {selectedPropertiesSection === 'process' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">⚙️ Process Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">1. Occurrence</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={processProperties.occurrence}
                        onChange={(e) => setProcessProperties({ ...processProperties, occurrence: e.target.value })}
                      >
                        <option value="one-time">One-time</option>
                        <option value="recurring">Recurring</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">2. Responses After End-Time</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={processProperties.responsesAfterEndTime}
                        onChange={(e) => setProcessProperties({ ...processProperties, responsesAfterEndTime: e.target.value })}
                      >
                        <option value="accept">Accept</option>
                        <option value="reject">Reject</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">3. Number of Responses</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={processProperties.numberOfResponses}
                        onChange={(e) => setProcessProperties({ ...processProperties, numberOfResponses: e.target.value })}
                      >
                        <option value="one-per-user">One response per user</option>
                        <option value="multiple-per-user">Multiple responses per user</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">4. Submission By</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={processProperties.submissionBy}
                        onChange={(e) => setProcessProperties({ ...processProperties, submissionBy: e.target.value })}
                      >
                        <option value="anyone">Anyone</option>
                        <option value="everyone">Everyone</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">5. Date Range Selection</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={processProperties.dateRangeSelection}
                        onChange={(e) => setProcessProperties({ ...processProperties, dateRangeSelection: e.target.value })}
                      >
                        <option value="allowed">Allowed</option>
                        <option value="restricted">Restricted</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedPropertiesSection === 'periodicity' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">🗓️ Process Periodicity</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Periodicity Type</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={processProperties.periodicityType}
                        onChange={(e) => setProcessProperties({ ...processProperties, periodicityType: e.target.value })}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Start Time</label>
                        <Input
                          type="time"
                          className="w-40"
                          value={processProperties.startTime}
                          onChange={(e) => setProcessProperties({ ...processProperties, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">End Time</label>
                        <Input
                          type="time"
                          className="w-40"
                          value={processProperties.endTime}
                          onChange={(e) => setProcessProperties({ ...processProperties, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedPropertiesSection === 'reminders' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">🔔 Reminders and Notifications</h3>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md bg-white">
                      <h4 className="font-medium mb-3">Email Alerts for the Process</h4>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="emailAlerts"
                            checked={processProperties.emailAlerts}
                            onChange={() => setProcessProperties({ ...processProperties, emailAlerts: true })}
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="emailAlerts"
                            checked={!processProperties.emailAlerts}
                            onChange={() => setProcessProperties({ ...processProperties, emailAlerts: false })}
                          />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md bg-white">
                      <h4 className="font-medium mb-3">Mobile Push Notification Alerts for the Process</h4>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="mobileNotifications"
                            checked={processProperties.mobileNotifications}
                            onChange={() => setProcessProperties({ ...processProperties, mobileNotifications: true })}
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="mobileNotifications"
                            checked={!processProperties.mobileNotifications}
                            onChange={() => setProcessProperties({ ...processProperties, mobileNotifications: false })}
                          />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-md bg-white">
                      <div>
                        <h4 className="font-medium">Enable Report URL Sharing</h4>
                        <p className="text-sm text-gray-500">Allow recipients to open reports via URL</p>
                      </div>
                      <Switch
                        checked={processProperties.reportUrlSharing}
                        onCheckedChange={(checked) => setProcessProperties({ ...processProperties, reportUrlSharing: checked })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">+ Add Reminder</Button>
                      <Button variant="outline" className="flex-1">+ Add Recurring Reminder</Button>
                    </div>
                    <a href="#" className="text-sm text-blue-600 hover:underline">Reminder Setup & Usage</a>
                  </div>
                </div>
              )}

              {selectedPropertiesSection === 'submissionReport' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">📊 Submission Report Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Report Type</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={processProperties.reportType}
                        onChange={(e) => setProcessProperties({ ...processProperties, reportType: e.target.value })}
                      >
                        <option value="hierarchical">Hierarchical</option>
                        <option value="store-hierarchical">Store Hierarchical</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedPropertiesSection === 'review' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">📝 Review Settings</h3>
                  <div className="p-4 border rounded-md bg-white">
                    <p className="text-sm text-gray-500">Review configuration settings</p>
                  </div>
                </div>
              )}

              {selectedPropertiesSection === 'advanceSettings' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">⚡ Advance Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-md bg-white">
                      <div>
                        <h4 className="font-medium">Restrict or Track Location While Submitting</h4>
                        <p className="text-sm text-gray-500">Track user location during submission</p>
                      </div>
                      <Switch
                        checked={processProperties.trackLocation}
                        onCheckedChange={(checked) => setProcessProperties({ ...processProperties, trackLocation: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-md bg-white">
                      <div>
                        <h4 className="font-medium">Track Visual Merchandising Across Stores</h4>
                        <p className="text-sm text-gray-500">Enable visual merchandising tracking</p>
                      </div>
                      <Switch
                        checked={processProperties.trackVisualMerchandising}
                        onCheckedChange={(checked) => setProcessProperties({ ...processProperties, trackVisualMerchandising: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-md bg-white">
                      <div>
                        <h4 className="font-medium">Auto-Assign Users with Dynamic Assignment</h4>
                        <p className="text-sm text-gray-500">Automatically assign users based on rules</p>
                      </div>
                      <Switch
                        checked={processProperties.dynamicAssignment}
                        onCheckedChange={(checked) => setProcessProperties({ ...processProperties, dynamicAssignment: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-md bg-white">
                      <div>
                        <h4 className="font-medium">Carry Forward Action Points</h4>
                        <p className="text-sm text-gray-500">Carry over action points from previous submissions</p>
                      </div>
                      <Switch
                        checked={processProperties.carryForwardActionPoints}
                        onCheckedChange={(checked) => setProcessProperties({ ...processProperties, carryForwardActionPoints: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-md bg-white">
                      <div>
                        <h4 className="font-medium">Create Action Points from Reports</h4>
                        <p className="text-sm text-gray-500">Generate action points from report data</p>
                      </div>
                      <Switch
                        checked={processProperties.createActionPointsFromReports}
                        onCheckedChange={(checked) => setProcessProperties({ ...processProperties, createActionPointsFromReports: checked })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Set Process Priority</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={processProperties.processPriority}
                        onChange={(e) => setProcessProperties({ ...processProperties, processPriority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Add Page Count (Paper Equivalent)</label>
                      <Input
                        type="number"
                        placeholder="Enter page count"
                        className="w-full"
                        value={processProperties.pageCount || ''}
                        onChange={(e) => setProcessProperties({ ...processProperties, pageCount: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedPropertiesSection === 'language' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">🌍 Language Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Default Language</label>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={processProperties.defaultLanguage}
                        onChange={(e) => setProcessProperties({ ...processProperties, defaultLanguage: e.target.value })}
                      >
                        <option value="abujhmaria">Abujhmaria</option>
                        <option value="afrikaans">Afrikaans</option>
                        <option value="agariya">Agariya</option>
                        <option value="akh">Akh</option>
                        <option value="albanian">Albanian</option>
                        <option value="amharic">Amharic</option>
                        <option value="arabic">Arabic</option>
                        <option value="armenian">Armenian</option>
                        <option value="assamese">Assamese</option>
                        <option value="asur">Asur</option>
                        <option value="azerbaijani">Azerbaijani</option>
                        <option value="balochi">Balochi</option>
                        <option value="basque">Basque</option>
                        <option value="belarusian">Belarusian</option>
                        <option value="bengali">Bengali</option>
                        <option value="bharia">Bharia</option>
                        <option value="bhojpuri">Bhojpuri</option>
                        <option value="bisonhornmaria">Bisonhorn Maria</option>
                        <option value="bishnupriya">Bishnupriya</option>
                        <option value="bijori">Bijori</option>
                        <option value="blang">Blang</option>
                        <option value="bodo">Bodo</option>
                        <option value="bondo">Bondo</option>
                        <option value="bosnian">Bosnian</option>
                        <option value="breton">Breton</option>
                        <option value="bulgarian">Bulgarian</option>
                        <option value="burmese">Burmese</option>
                        <option value="catalan">Catalan</option>
                        <option value="chak">Chak</option>
                        <option value="chakma">Chakma</option>
                        <option value="chattisgarhi">Chhattisgarhi</option>
                        <option value="chepang">Chepang</option>
                        <option value="chero">Chero</option>
                        <option value="chinese">Chinese (Mandarin)</option>
                        <option value="cornish">Cornish</option>
                        <option value="croatian">Croatian</option>
                        <option value="czech">Czech</option>
                        <option value="dandamimaria">Dandami Maria</option>
                        <option value="danau">Danau</option>
                        <option value="dari">Dari</option>
                        <option value="deang">Deang</option>
                        <option value="didayi">Didayi</option>
                        <option value="dogri">Dogri</option>
                        <option value="doru">Doru</option>
                        <option value="dutch">Dutch</option>
                        <option value="dzongkha">Dzongkha</option>
                        <option value="english">English</option>
                        <option value="estonian">Estonian</option>
                        <option value="faroese">Faroese</option>
                        <option value="fijian">Fijian</option>
                        <option value="finnish">Finnish</option>
                        <option value="french">French</option>
                        <option value="fula">Fula</option>
                        <option value="gadaba">Gadaba</option>
                        <option value="galician">Galician</option>
                        <option value="garhwali">Garhwali</option>
                        <option value="garo">Garo</option>
                        <option value="gataq">Gataq</option>
                        <option value="georgian">Georgian</option>
                        <option value="german">German</option>
                        <option value="ghale">Ghale</option>
                        <option value="gondi">Gondi</option>
                        <option value="greek">Greek</option>
                        <option value="gujarati">Gujarati</option>
                        <option value="gutob">Gutob</option>
                        <option value="hausa">Hausa</option>
                        <option value="hawaiian">Hawaiian</option>
                        <option value="hebrew">Hebrew</option>
                        <option value="hindi">Hindi</option>
                        <option value="ho">Ho</option>
                        <option value="hkal">Hkal</option>
                        <option value="hkun">Hkun</option>
                        <option value="hungarian">Hungarian</option>
                        <option value="igbo">Igbo</option>
                        <option value="icelandic">Icelandic</option>
                        <option value="indonesian">Indonesian</option>
                        <option value="irish">Irish</option>
                        <option value="italian">Italian</option>
                        <option value="japanese">Japanese</option>
                        <option value="jharia">Jharia</option>
                        <option value="kannada">Kannada</option>
                        <option value="kashmiri">Kashmiri</option>
                        <option value="kazakh">Kazakh</option>
                        <option value="khmer">Khmer</option>
                        <option value="khasi">Khasi</option>
                        <option value="khumi">Khumi</option>
                        <option value="kinnauri">Kinnauri</option>
                        <option value="kisan">Kisan</option>
                        <option value="koda">Koda</option>
                        <option value="kokborok">Kokborok</option>
                        <option value="kol">Kol</option>
                        <option value="kolami">Kolami</option>
                        <option value="korean">Korean</option>
                        <option value="koraku">Koraku</option>
                        <option value="korwa">Korwa</option>
                        <option value="kosovar">Kosovar</option>
                        <option value="koya">Koya</option>
                        <option value="kullu">Kullu</option>
                        <option value="kumaoni">Kumaoni</option>
                        <option value="kunda">Kunda</option>
                        <option value="kurdish">Kurdish</option>
                        <option value="kusunda">Kusunda</option>
                        <option value="kyrgyz">Kyrgyz</option>
                        <option value="lao">Lao</option>
                        <option value="ladakhi">Ladakhi</option>
                        <option value="lahu">Lahu</option>
                        <option value="latvian">Latvian</option>
                        <option value="lisu">Lisu</option>
                        <option value="lithuanian">Lithuanian</option>
                        <option value="luxembourgish">Luxembourgish</option>
                        <option value="maithili">Maithili</option>
                        <option value="malagasy">Malagasy</option>
                        <option value="malay">Malay</option>
                        <option value="malayalam">Malayalam</option>
                        <option value="maltese">Maltese</option>
                        <option value="mankidi">Mankidi</option>
                        <option value="marathi">Marathi</option>
                        <option value="maria">Maria</option>
                        <option value="moldovan">Moldovan</option>
                        <option value="mongolian">Mongolian</option>
                        <option value="montenegrin">Montenegrin</option>
                        <option value="mro">Mro</option>
                        <option value="mru">Mru</option>
                        <option value="munda">Munda</option>
                        <option value="mundari">Mundari</option>
                        <option value="muria">Muria</option>
                        <option value="naiki">Naiki</option>
                        <option value="nepalbhasa">Nepal Bhasa (Newari)</option>
                        <option value="nepali">Nepali</option>
                        <option value="ndebele">Ndebele</option>
                        <option value="norwegian">Norwegian</option>
                        <option value="odia">Odia</option>
                        <option value="pahari">Pahari</option>
                        <option value="palaung">Palaung</option>
                        <option value="pali">Pali</option>
                        <option value="pankhu">Pankhu</option>
                        <option value="pashto">Pashto</option>
                        <option value="pando">Pando</option>
                        <option value="persian">Persian (Farsi)</option>
                        <option value="polish">Polish</option>
                        <option value="portuguese">Portuguese</option>
                        <option value="prkrit">Prakrit</option>
                        <option value="punjabi">Punjabi</option>
                        <option value="raj">Raj</option>
                        <option value="rajasthani">Rajasthani</option>
                        <option value="rakhine">Rakhine</option>
                        <option value="rawang">Rawang</option>
                        <option value="remo">Remo</option>
                        <option value="romanian">Romanian</option>
                        <option value="rumai">Rumai</option>
                        <option value="russian">Russian</option>
                        <option value="sanskrit">Sanskrit</option>
                        <option value="santali">Santali</option>
                        <option value="scottish-gaelic">Scottish Gaelic</option>
                        <option value="serbian">Serbian</option>
                        <option value="shona">Shona</option>
                        <option value="sherpa">Sherpa</option>
                        <option value="sindhi">Sindhi</option>
                        <option value="sinhala">Sinhala</option>
                        <option value="slovak">Slovak</option>
                        <option value="slovenian">Slovenian</option>
                        <option value="somali">Somali</option>
                        <option value="sotho">Sotho</option>
                        <option value="spanish">Spanish</option>
                        <option value="swahili">Swahili</option>
                        <option value="swati">Swati</option>
                        <option value="swedish">Swedish</option>
                        <option value="tagalog">Tagalog (Filipino)</option>
                        <option value="tajik">Tajik</option>
                        <option value="tamil">Tamil</option>
                        <option value="tamang">Tamang</option>
                        <option value="tanchangya">Tanchangya</option>
                        <option value="telugu">Telugu</option>
                        <option value="thai">Thai</option>
                        <option value="thakali">Thakali</option>
                        <option value="tharu">Tharu</option>
                        <option value="tibetan">Tibetan</option>
                        <option value="tongan">Tongan</option>
                        <option value="tripuri">Tripuri</option>
                        <option value="tsonga">Tsonga</option>
                        <option value="turkish">Turkish</option>
                        <option value="turkmen">Turkmen</option>
                        <option value="ukrainian">Ukrainian</option>
                        <option value="urdu">Urdu</option>
                        <option value="uzbek">Uzbek</option>
                        <option value="venda">Venda</option>
                        <option value="vietnamese">Vietnamese</option>
                        <option value="wa">Wa</option>
                        <option value="welsh">Welsh</option>
                        <option value="xhosa">Xhosa</option>
                        <option value="yoruba">Yoruba</option>
                        <option value="zulu">Zulu</option>
                      </select>
                    </div>
                    <Button variant="outline" className="w-full">+ Add Translation</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="build" className="p-0">
          <div className="flex h-[calc(100vh-73px)]">
            {/* Left Sidebar - Sections */}
            <div className="w-64 border-r bg-white p-4">
              {isAuditMode && fieldValues.field1 && (
                <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-600">Audit</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{fieldValues.field1}</p>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Sections</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addSection}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <button
                    key={section.clientId}
                    type="button"
                    onClick={() => switchSection(section.clientId)}
                    className={`w-full rounded p-2 text-left text-sm ${
                      activeSectionId === section.clientId ? "bg-sky-100 text-sky-700" : "bg-muted"
                    }`}
                  >
                    {index + 1}. {section.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
              {formElements.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <p>No data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input placeholder="Put the title here" className="mb-4" />
                  {isAssessmentMode
                    ? formElements.map((element, index) => (
                        <AssessmentQuestionCard
                          key={element.id}
                          element={element}
                          index={index}
                          formElements={formElements}
                          setFormElements={setFormElements}
                          onDelete={() => deleteFormElement(element.id)}
                          onDuplicate={() => copyFormElement(element)}
                          onOpenSettings={() => openSettingsDialog(element.id)}
                        />
                      ))
                    : formElements.map((element) => (
                    <div key={element.id} className="border rounded-md p-4 bg-white shadow-sm relative">
                      <div className="absolute right-2 top-2 flex flex-col space-y-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteFormElement(element.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyFormElement(element)}><Copy className="h-4 w-4 text-blue-500" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openSettingsDialog(element.id)}><Settings className="h-4 w-4 text-gray-500" /></Button>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-gray-500">{formElements.indexOf(element) + 1}</span>
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="text-sm font-medium">{element.label}</span>
                      </div>
                      <QuestionAddonsToolbar
                        element={element}
                        formElements={formElements}
                        setFormElements={setFormElements}
                        processWithTags={processWithTags}
                        questionTags={questionTags}
                      />
                      <div className="flex items-center gap-2 mb-2">
                        <Input placeholder="Type Question Here" className="flex-grow" />
                        <Input value="0" className="w-16 text-center" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"><Pen className="h-4 w-4" /></Button>
                      </div>
                      {element.type === 'short-answer' && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">Validation Type:</span>
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            value={element.config?.validationType || 'text'}
                            onChange={(e) => {
                              const newElements = formElements.map(el => {
                                if (el.id === element.id) {
                                  return {
                                    ...el,
                                    config: { ...el.config, validationType: e.target.value as any }
                                  };
                                }
                                return el;
                              });
                              setFormElements(newElements);
                            }}
                          >
                            <option value="text">Text</option>
                            <option value="alphanumeric">Alphanumeric</option>
                            <option value="number">Number</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                          </select>
                        </div>
                      )}
                      {element.type === 'single-answer' && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-600 mb-2 block">Options (Compliant → 100%, Non-Compliant → 0%):</span>
                          <div className="space-y-2">
                            {element.config?.options?.map((option: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  value={option.label}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newOptions = [...(el.config?.options || [])];
                                        newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                                        return {
                                          ...el,
                                          config: { ...el.config, options: newOptions }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="flex-grow"
                                />
                                <Input
                                  type="number"
                                  value={option.score}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newOptions = [...(el.config?.options || [])];
                                        newOptions[idx] = { ...newOptions[idx], score: parseInt(e.target.value) };
                                        return {
                                          ...el,
                                          config: { ...el.config, options: newOptions }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="w-20 text-center"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newOptions = (el.config?.options || []).filter((_: any, i: number) => i !== idx);
                                        return {
                                          ...el,
                                          config: { ...el.config, options: newOptions }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newElements = formElements.map(el => {
                                  if (el.id === element.id) {
                                    return {
                                      ...el,
                                      config: {
                                        ...el.config,
                                        options: [...(el.config?.options || []), { label: '', score: 0 }]
                                      }
                                    };
                                  }
                                  return el;
                                });
                                setFormElements(newElements);
                              }}
                            >
                              + Add Option
                            </Button>
                          </div>
                        </div>
                      )}
                      {element.type === 'multiple-answers' && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600">Marks:</span>
                            <Input
                              type="number"
                              value={element.config?.marks || 5}
                              onChange={(e) => {
                                const newElements = formElements.map(el => {
                                  if (el.id === element.id) {
                                    return {
                                      ...el,
                                      config: { ...el.config, marks: parseInt(e.target.value) }
                                    };
                                  }
                                  return el;
                                });
                                setFormElements(newElements);
                              }}
                              className="w-20"
                            />
                          </div>
                          <span className="text-sm text-gray-600 mb-2 block">Options with percentage scores:</span>
                          <div className="space-y-2">
                            {element.config?.options?.map((option: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  value={option.label}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newOptions = [...(el.config?.options || [])];
                                        newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                                        return {
                                          ...el,
                                          config: { ...el.config, options: newOptions }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="flex-grow"
                                />
                                <Input
                                  type="number"
                                  value={option.score}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newOptions = [...(el.config?.options || [])];
                                        newOptions[idx] = { ...newOptions[idx], score: parseInt(e.target.value) };
                                        return {
                                          ...el,
                                          config: { ...el.config, options: newOptions }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="w-20 text-center"
                                  placeholder="%"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newOptions = (el.config?.options || []).filter((_: any, i: number) => i !== idx);
                                        return {
                                          ...el,
                                          config: { ...el.config, options: newOptions }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newElements = formElements.map(el => {
                                  if (el.id === element.id) {
                                    return {
                                      ...el,
                                      config: {
                                        ...el.config,
                                        options: [...(el.config?.options || []), { label: '', score: 0 }]
                                      }
                                    };
                                  }
                                  return el;
                                });
                                setFormElements(newElements);
                              }}
                            >
                              + Add Option
                            </Button>
                          </div>
                        </div>
                      )}
                      {element.type === 'dropdown' && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-600 mb-2 block">Options:</span>
                          <div className="space-y-2">
                            {element.config?.options?.map((option: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  value={option.label}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newOptions = [...(el.config?.options || [])];
                                        newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                                        return {
                                          ...el,
                                          config: { ...el.config, options: newOptions }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="flex-grow"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newOptions = (el.config?.options || []).filter((_: any, i: number) => i !== idx);
                                        return {
                                          ...el,
                                          config: { ...el.config, options: newOptions }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newElements = formElements.map(el => {
                                    if (el.id === element.id) {
                                      return {
                                        ...el,
                                        config: {
                                          ...el.config,
                                          options: [...(el.config?.options || []), { label: '' }]
                                        }
                                      };
                                  }
                                  return el;
                                });
                                setFormElements(newElements);
                              }}
                              >
                                + Add New
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const input = prompt('Enter comma-separated options (e.g., Morning, Afternoon, Night):');
                                  if (input) {
                                    const newOptions = input.split(',').map(opt => ({ label: opt.trim() }));
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: {
                                            ...el.config,
                                            options: [...(el.config?.options || []), ...newOptions]
                                          }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }
                                }}
                              >
                                Set Options
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      {element.type === 'adv-dropdown' && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-600 mb-2 block">Select Pre-configured Tag:</span>
                          <select
                            className="border rounded px-2 py-1 text-sm w-full"
                            value={element.config?.selectedTag || ''}
                            onChange={(e) => {
                              const newElements = formElements.map(el => {
                                if (el.id === element.id) {
                                  return {
                                    ...el,
                                    config: { ...el.config, selectedTag: e.target.value }
                                  };
                                }
                                return el;
                              });
                              setFormElements(newElements);
                            }}
                          >
                            <option value="">Select a tag...</option>
                            <option value="product-category">Product Category</option>
                            <option value="store-zone">Store Zone</option>
                            <option value="department">Department</option>
                            <option value="shift">Shift</option>
                          </select>
                        </div>
                      )}
                      {element.type === 'grid' && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-600 mb-2 block">Columns:</span>
                          <div className="space-y-2 mb-4">
                            {element.config?.columns?.map((col: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  value={col}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newColumns = [...(el.config?.columns || [])];
                                        newColumns[idx] = e.target.value;
                                        return {
                                          ...el,
                                          config: { ...el.config, columns: newColumns }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="flex-grow"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newColumns = (el.config?.columns || []).filter((_: any, i: number) => i !== idx);
                                        return {
                                          ...el,
                                          config: { ...el.config, columns: newColumns }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newElements = formElements.map(el => {
                                  if (el.id === element.id) {
                                    return {
                                      ...el,
                                      config: {
                                        ...el.config,
                                        columns: [...(el.config?.columns || []), '']
                                      }
                                    };
                                  }
                                  return el;
                                });
                                setFormElements(newElements);
                              }}
                            >
                              + Add Column
                            </Button>
                          </div>
                          <span className="text-sm text-gray-600 mb-2 block">Rows:</span>
                          <div className="space-y-2">
                            {element.config?.rows?.map((row: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  value={row}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newRows = [...(el.config?.rows || [])];
                                        newRows[idx] = e.target.value;
                                        return {
                                          ...el,
                                          config: { ...el.config, rows: newRows }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="flex-grow"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newRows = (el.config?.rows || []).filter((_: any, i: number) => i !== idx);
                                        return {
                                          ...el,
                                          config: { ...el.config, rows: newRows }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newElements = formElements.map(el => {
                                  if (el.id === element.id) {
                                    return {
                                      ...el,
                                      config: {
                                        ...el.config,
                                        rows: [...(el.config?.rows || []), '']
                                      }
                                    };
                                  }
                                  return el;
                                });
                                setFormElements(newElements);
                              }}
                            >
                              + Add Row
                            </Button>
                          </div>
                        </div>
                      )}
                      {element.type === 'calculation-grid' && (
                        <div className="mb-2">
                          <span className="text-sm text-gray-600 mb-2 block">Columns with Data Types:</span>
                          <div className="space-y-2 mb-4">
                            {element.config?.columns?.map((col: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  value={col}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newColumns = [...(el.config?.columns || [])];
                                        newColumns[idx] = e.target.value;
                                        return {
                                          ...el,
                                          config: { ...el.config, columns: newColumns }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="flex-grow"
                                />
                                <select
                                  className="border rounded px-2 py-1 text-sm w-32"
                                  value={element.config?.dataType || 'text'}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: { ...el.config, dataType: e.target.value as any }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  <option value="text">Text</option>
                                  <option value="alphanumeric">Alphanumeric</option>
                                  <option value="number">Number</option>
                                  <option value="date">Date</option>
                                  <option value="time">Time</option>
                                  <option value="dropdown">Dropdown</option>
                                  <option value="barcode">Barcode</option>
                                  <option value="attachment">Attachment</option>
                                </select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newColumns = (el.config?.columns || []).filter((_: any, i: number) => i !== idx);
                                        return {
                                          ...el,
                                          config: { ...el.config, columns: newColumns }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newElements = formElements.map(el => {
                                  if (el.id === element.id) {
                                    return {
                                      ...el,
                                      config: {
                                        ...el.config,
                                        columns: [...(el.config?.columns || []), '']
                                      }
                                    };
                                  }
                                  return el;
                                });
                                setFormElements(newElements);
                              }}
                            >
                              + Add Column
                            </Button>
                          </div>
                          <span className="text-sm text-gray-600 mb-2 block">Rows:</span>
                          <div className="space-y-2">
                            {element.config?.rows?.map((row: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  value={row}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newRows = [...(el.config?.rows || [])];
                                        newRows[idx] = e.target.value;
                                        return {
                                          ...el,
                                          config: { ...el.config, rows: newRows }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="flex-grow"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        const newRows = (el.config?.rows || []).filter((_: any, i: number) => i !== idx);
                                        return {
                                          ...el,
                                          config: { ...el.config, rows: newRows }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newElements = formElements.map(el => {
                                  if (el.id === element.id) {
                                    return {
                                      ...el,
                                      config: {
                                        ...el.config,
                                        rows: [...(el.config?.rows || []), '']
                                      }
                                    };
                                  }
                                  return el;
                                });
                                setFormElements(newElements);
                              }}
                            >
                              + Add Row
                            </Button>
                          </div>
                        </div>
                      )}
                      <Button variant="outline" className="w-full border-dashed text-sm mb-4">
                        + ADD NEW
                      </Button>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Switch id={`option-image-${element.id}`} />
                          <label htmlFor={`option-image-${element.id}`} className="text-gray-600">Option Image</label>
                        </div>
                        <span className="text-red-500 text-xs">This field is required</span>
                      </div>

                      {/* Review Configuration - show when process with review is enabled */}
                      {processProperties.processWithReview && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <span className="text-sm font-medium text-blue-800 mb-2 block">Review Configuration</span>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Review Type:</span>
                              <select
                                className="border rounded px-2 py-1 text-sm flex-grow"
                                value={element.config?.reviewType || 'none'}
                                onChange={(e) => {
                                  const newElements = formElements.map(el => {
                                    if (el.id === element.id) {
                                      return {
                                        ...el,
                                        config: { ...el.config, reviewType: e.target.value as any }
                                      };
                                    }
                                    return el;
                                  });
                                  setFormElements(newElements);
                                }}
                              >
                                <option value="none">No Review</option>
                                <option value="review-existing">Review Existing Question</option>
                                <option value="independent-review">Independent Review Question</option>
                              </select>
                            </div>

                            {element.config?.reviewType === 'independent-review' && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Assign to Reviewer Level:</span>
                                <select
                                  className="border rounded px-2 py-1 text-sm flex-grow"
                                  value={element.config?.reviewerLevel || 'L1'}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: { ...el.config, reviewerLevel: e.target.value as any }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  <option value="L1">L1 Reviewer</option>
                                  <option value="L2">L2 Reviewer</option>
                                  <option value="L3">L3 Reviewer</option>
                                  <option value="L4">L4 Reviewer</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Dialog */}
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Question Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {selectedElementId && (() => {
                    const element = formElements.find(el => el.id === selectedElementId);
                    if (!element) return null;

                    return (
                      <div>
                        <div className="mb-4">
                          <span className="text-sm font-medium">Question Type: {element.label}</span>
                        </div>

                        {/* Common settings for all types */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Required Field</span>
                            <Switch
                              checked={element.config?.required || false}
                              onCheckedChange={(checked) => {
                                const newElements = formElements.map(el => {
                                  if (el.id === element.id) {
                                    return {
                                      ...el,
                                      config: { ...el.config, required: checked }
                                    };
                                  }
                                  return el;
                                });
                                setFormElements(newElements);
                              }}
                            />
                          </div>

                          {/* Scoring configuration */}
                          <div className="space-y-4 pt-4 border-t">
                            <span className="text-sm font-medium">Scoring Configuration</span>
                            <div className="space-y-2">
                              <label className="text-sm">Scoring Type:</label>
                              <select
                                className="border rounded px-2 py-1 text-sm w-full"
                                value={element.config?.scoringType || 'none'}
                                onChange={(e) => {
                                  const newElements = formElements.map(el => {
                                    if (el.id === element.id) {
                                      return {
                                        ...el,
                                        config: { ...el.config, scoringType: e.target.value as any }
                                      };
                                    }
                                    return el;
                                  });
                                  setFormElements(newElements);
                                }}
                              >
                                <option value="none">No Scoring</option>
                                <option value="weightage">Weightage-Based Scoring</option>
                                <option value="input">Input-Based Scoring (BODMAS)</option>
                              </select>
                            </div>

                            {element.config?.scoringType === 'weightage' && (
                              <div className="space-y-2">
                                <label className="text-sm">Weightage (Marks):</label>
                                <Input
                                  type="number"
                                  value={element.config?.weightage || 0}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: { ...el.config, weightage: parseInt(e.target.value) }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="w-20"
                                />
                              </div>
                            )}

                            {element.config?.scoringType === 'input' && (
                              <div className="space-y-2">
                                <label className="text-sm">Calculator Function:</label>
                                <select
                                  className="border rounded px-2 py-1 text-sm w-full"
                                  value={element.config?.calculatorFunction || 'none'}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: { ...el.config, calculatorFunction: e.target.value as any }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  <option value="none">None</option>
                                  <option value="average">AVERAGE()</option>
                                  <option value="sum-na">Σ NA Count</option>
                                  <option value="sum-weightage">Σ Weightage</option>
                                </select>
                              </div>
                            )}

                            <div className="space-y-2">
                              <label className="text-sm">Range Validation (for number answers):</label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  value={element.config?.rangeValidation?.min || ''}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: {
                                            ...el.config,
                                            rangeValidation: {
                                              ...el.config?.rangeValidation,
                                              min: e.target.value ? parseInt(e.target.value) : undefined
                                            }
                                          }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="w-24"
                                />
                                <span className="text-sm">to</span>
                                <Input
                                  type="number"
                                  placeholder="Max"
                                  value={element.config?.rangeValidation?.max || ''}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: {
                                            ...el.config,
                                            rangeValidation: {
                                              ...el.config?.rangeValidation,
                                              max: e.target.value ? parseInt(e.target.value) : undefined
                                            }
                                          }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="w-24"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Type-specific settings */}
                          {element.type === 'short-answer' && (
                            <div>
                              <span className="text-sm font-medium mb-2 block">Validation Type:</span>
                              <select
                                className="border rounded px-2 py-1 text-sm w-full"
                                value={element.config?.validationType || 'text'}
                                onChange={(e) => {
                                  const newElements = formElements.map(el => {
                                    if (el.id === element.id) {
                                      return {
                                        ...el,
                                        config: { ...el.config, validationType: e.target.value as any }
                                      };
                                    }
                                    return el;
                                  });
                                  setFormElements(newElements);
                                }}
                              >
                                <option value="text">Text</option>
                                <option value="alphanumeric">Alphanumeric</option>
                                <option value="number">Number</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                              </select>
                            </div>
                          )}

                          {element.type === 'single-answer' && (
                            <div>
                              <span className="text-sm font-medium mb-2 block">Options:</span>
                              <div className="space-y-2">
                                {element.config?.options?.map((option: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Input
                                      value={option.label}
                                      onChange={(e) => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newOptions = [...(el.config?.options || [])];
                                            newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                                            return {
                                              ...el,
                                              config: { ...el.config, options: newOptions }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                      className="flex-grow"
                                    />
                                    <Input
                                      type="number"
                                      value={option.score}
                                      onChange={(e) => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newOptions = [...(el.config?.options || [])];
                                            newOptions[idx] = { ...newOptions[idx], score: parseInt(e.target.value) };
                                            return {
                                              ...el,
                                              config: { ...el.config, options: newOptions }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                      className="w-20 text-center"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500"
                                      onClick={() => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newOptions = (el.config?.options || []).filter((_: any, i: number) => i !== idx);
                                            return {
                                              ...el,
                                              config: { ...el.config, options: newOptions }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: {
                                            ...el.config,
                                            options: [...(el.config?.options || []), { label: '', score: 0 }]
                                          }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  + Add Option
                                </Button>
                              </div>
                            </div>
                          )}

                          {element.type === 'multiple-answers' && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium">Marks:</span>
                                <Input
                                  type="number"
                                  value={element.config?.marks || 5}
                                  onChange={(e) => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: { ...el.config, marks: parseInt(e.target.value) }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                  className="w-20"
                                />
                              </div>
                              <span className="text-sm font-medium mb-2 block">Options:</span>
                              <div className="space-y-2">
                                {element.config?.options?.map((option: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Input
                                      value={option.label}
                                      onChange={(e) => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newOptions = [...(el.config?.options || [])];
                                            newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                                            return {
                                              ...el,
                                              config: { ...el.config, options: newOptions }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                      className="flex-grow"
                                    />
                                    <Input
                                      type="number"
                                      value={option.score}
                                      onChange={(e) => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newOptions = [...(el.config?.options || [])];
                                            newOptions[idx] = { ...newOptions[idx], score: parseInt(e.target.value) };
                                            return {
                                              ...el,
                                              config: { ...el.config, options: newOptions }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                      className="w-20 text-center"
                                      placeholder="%"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500"
                                      onClick={() => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newOptions = (el.config?.options || []).filter((_: any, i: number) => i !== idx);
                                            return {
                                              ...el,
                                              config: { ...el.config, options: newOptions }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: {
                                            ...el.config,
                                            options: [...(el.config?.options || []), { label: '', score: 0 }]
                                          }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  + Add Option
                                </Button>
                              </div>
                            </div>
                          )}

                          {element.type === 'dropdown' && (
                            <div>
                              <span className="text-sm font-medium mb-2 block">Options:</span>
                              <div className="space-y-2">
                                {element.config?.options?.map((option: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Input
                                      value={option.label}
                                      onChange={(e) => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newOptions = [...(el.config?.options || [])];
                                            newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                                            return {
                                              ...el,
                                              config: { ...el.config, options: newOptions }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                      className="flex-grow"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500"
                                      onClick={() => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newOptions = (el.config?.options || []).filter((_: any, i: number) => i !== idx);
                                            return {
                                              ...el,
                                              config: { ...el.config, options: newOptions }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newElements = formElements.map(el => {
                                        if (el.id === element.id) {
                                          return {
                                            ...el,
                                            config: {
                                              ...el.config,
                                              options: [...(el.config?.options || []), { label: '' }]
                                            }
                                          };
                                        }
                                        return el;
                                      });
                                      setFormElements(newElements);
                                    }}
                                  >
                                    + Add New
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const input = prompt('Enter comma-separated options (e.g., Morning, Afternoon, Night):');
                                      if (input) {
                                        const newOptions = input.split(',').map(opt => ({ label: opt.trim() }));
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            return {
                                              ...el,
                                              config: {
                                                ...el.config,
                                                options: [...(el.config?.options || []), ...newOptions]
                                              }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }
                                    }}
                                  >
                                    Set Options
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {element.type === 'adv-dropdown' && (
                            <div>
                              <span className="text-sm font-medium mb-2 block">Select Pre-configured Tag:</span>
                              <select
                                className="border rounded px-2 py-1 text-sm w-full"
                                value={element.config?.selectedTag || ''}
                                onChange={(e) => {
                                  const newElements = formElements.map(el => {
                                    if (el.id === element.id) {
                                      return {
                                        ...el,
                                        config: { ...el.config, selectedTag: e.target.value }
                                      };
                                    }
                                    return el;
                                  });
                                  setFormElements(newElements);
                                }}
                              >
                                <option value="">Select a tag...</option>
                                <option value="product-category">Product Category</option>
                                <option value="store-zone">Store Zone</option>
                                <option value="department">Department</option>
                                <option value="shift">Shift</option>
                              </select>
                            </div>
                          )}

                          {element.type === 'grid' && (
                            <div>
                              <span className="text-sm font-medium mb-2 block">Columns:</span>
                              <div className="space-y-2 mb-4">
                                {element.config?.columns?.map((col: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Input
                                      value={col}
                                      onChange={(e) => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newColumns = [...(el.config?.columns || [])];
                                            newColumns[idx] = e.target.value;
                                            return {
                                              ...el,
                                              config: { ...el.config, columns: newColumns }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                      className="flex-grow"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500"
                                      onClick={() => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newColumns = (el.config?.columns || []).filter((_: any, i: number) => i !== idx);
                                            return {
                                              ...el,
                                              config: { ...el.config, columns: newColumns }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: {
                                            ...el.config,
                                            columns: [...(el.config?.columns || []), '']
                                          }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  + Add Column
                                </Button>
                              </div>
                              <span className="text-sm font-medium mb-2 block">Rows:</span>
                              <div className="space-y-2">
                                {element.config?.rows?.map((row: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Input
                                      value={row}
                                      onChange={(e) => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newRows = [...(el.config?.rows || [])];
                                            newRows[idx] = e.target.value;
                                            return {
                                              ...el,
                                              config: { ...el.config, rows: newRows }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                      className="flex-grow"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500"
                                      onClick={() => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newRows = (el.config?.rows || []).filter((_: any, i: number) => i !== idx);
                                            return {
                                              ...el,
                                              config: { ...el.config, rows: newRows }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: {
                                            ...el.config,
                                            rows: [...(el.config?.rows || []), '']
                                          }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  + Add Row
                                </Button>
                              </div>
                            </div>
                          )}

                          {element.type === 'calculation-grid' && (
                            <div>
                              <span className="text-sm font-medium mb-2 block">Columns with Data Types:</span>
                              <div className="space-y-2 mb-4">
                                {element.config?.columns?.map((col: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Input
                                      value={col}
                                      onChange={(e) => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newColumns = [...(el.config?.columns || [])];
                                            newColumns[idx] = e.target.value;
                                            return {
                                              ...el,
                                              config: { ...el.config, columns: newColumns }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                      className="flex-grow"
                                    />
                                    <select
                                      className="border rounded px-2 py-1 text-sm w-32"
                                      value={element.config?.dataType || 'text'}
                                      onChange={(e) => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            return {
                                              ...el,
                                              config: { ...el.config, dataType: e.target.value as any }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                    >
                                      <option value="text">Text</option>
                                      <option value="alphanumeric">Alphanumeric</option>
                                      <option value="number">Number</option>
                                      <option value="date">Date</option>
                                      <option value="time">Time</option>
                                      <option value="dropdown">Dropdown</option>
                                      <option value="barcode">Barcode</option>
                                      <option value="attachment">Attachment</option>
                                    </select>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500"
                                      onClick={() => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newColumns = (el.config?.columns || []).filter((_: any, i: number) => i !== idx);
                                            return {
                                              ...el,
                                              config: { ...el.config, columns: newColumns }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: {
                                            ...el.config,
                                            columns: [...(el.config?.columns || []), '']
                                          }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  + Add Column
                                </Button>
                              </div>
                              <span className="text-sm font-medium mb-2 block">Rows:</span>
                              <div className="space-y-2">
                                {element.config?.rows?.map((row: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Input
                                      value={row}
                                      onChange={(e) => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newRows = [...(el.config?.rows || [])];
                                            newRows[idx] = e.target.value;
                                            return {
                                              ...el,
                                              config: { ...el.config, rows: newRows }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                      className="flex-grow"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500"
                                      onClick={() => {
                                        const newElements = formElements.map(el => {
                                          if (el.id === element.id) {
                                            const newRows = (el.config?.rows || []).filter((_: any, i: number) => i !== idx);
                                            return {
                                              ...el,
                                              config: { ...el.config, rows: newRows }
                                            };
                                          }
                                          return el;
                                        });
                                        setFormElements(newElements);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newElements = formElements.map(el => {
                                      if (el.id === element.id) {
                                        return {
                                          ...el,
                                          config: {
                                            ...el.config,
                                            rows: [...(el.config?.rows || []), '']
                                          }
                                        };
                                      }
                                      return el;
                                    });
                                    setFormElements(newElements);
                                  }}
                                >
                                  + Add Row
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveSettings}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Right Sidebar - Add Type */}
            <div className="w-72 border-l bg-white">
              <Tabs defaultValue="add-type" className="w-full h-full flex flex-col">
                <div className="border-b">
                  <TabsList className="grid w-full grid-cols-2 rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger 
                      value="add-type" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
                    >
                      Add Type
                    </TabsTrigger>
                    <TabsTrigger 
                      value="settings" 
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
                    >
                      Settings
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="add-type" className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-2">
                    {isAssessmentMode ? (
                      <>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('single-answer', 'Single answer')}>
                          <Type className="w-4 h-4" />
                          <span className="text-sm">Single answer</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('multiple-answers', 'Multiple answers')}>
                          <Type className="w-4 h-4" />
                          <span className="text-sm">Multiple answers</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('short-answer', 'Short answer')}>
                          <Type className="w-4 h-4" />
                          <span className="text-sm">Short answer</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addSection()}>
                          <Type className="w-4 h-4" />
                          <span className="text-sm">Section</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addSection('Sub-section')}>
                          <Type className="w-4 h-4" />
                          <span className="text-sm">Sub-section</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('single-answer', 'Single answer')}>
                          <Type className="w-4 h-4" />
                          <span className="text-sm">Single answer</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('multiple-answers', 'Multiple answers')}>
                          <Type className="w-4 h-4" />
                          <span className="text-sm">Multiple answers</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('short-answer', 'Short answer')}>
                          <Type className="w-4 h-4" />
                          <span className="text-sm">Short answer</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('file-upload', 'File Upload')}>
                          <Pen className="w-4 h-4" />
                          <span className="text-sm">File Upload</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('long-answer', 'Long Answer')}>
                          <Type className="w-4 h-4" />
                          <span className="text-sm">Long Answer</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('dropdown', 'Dropdown')}>
                          <ChevronDown className="w-4 h-4" />
                          <span className="text-sm">Dropdown</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('adv-dropdown', 'Adv Dropdown')}>
                          <ChevronDown className="w-4 h-4" />
                          <span className="text-sm">Adv Dropdown</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('scoring-dropdown', 'Scoring Dropdown')}>
                          <ChevronDown className="w-4 h-4" />
                          <span className="text-sm">Scoring Dropdown</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('grid', 'Grid')}>
                          <Grid2x2 className="w-4 h-4" />
                          <span className="text-sm">Grid</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('calculation-grid', 'Calculation Grid')}>
                          <Calculator className="w-4 h-4" />
                          <span className="text-sm">Calculation Grid</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('dynamic-grid', 'Dynamic Grid')}>
                          <Grid2x2 className="w-4 h-4" />
                          <span className="text-sm">Dynamic Grid</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">BETA</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('date', 'Date')}>
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Date</span>
                        </div>
                        <div className="p-3 border rounded hover:bg-muted cursor-pointer flex items-center gap-2" onClick={() => addFormElement('time', 'Time')}>
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Time</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-4 border-t">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                      Validate Form
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="flex-1 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Process with tags</span>
                    <Switch
                      checked={processWithTags}
                      onCheckedChange={setProcessWithTags}
                    />
                  </div>
                  {processWithTags && (
                    <p className="text-xs text-muted-foreground rounded-md border bg-sky-50 p-3">
                      Question tag dropdowns appear on each question. Tags come from Manage Tags → Question Tag.
                      Enable Visual Report View in Advanced Settings to filter submission photos by tag.
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Process with review</span>
                    <Switch
                      checked={processProperties.processWithReview}
                      onCheckedChange={(checked) => setProcessProperties({ ...processProperties, processWithReview: checked })}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="properties">
          <div className="text-center py-12 text-muted-foreground">
            <p>Properties content</p>
          </div>
        </TabsContent>

        <TabsContent value="assign">
          <AssignTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
