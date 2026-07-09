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
import QuestionCard, { QuestionSettingsContent } from "@/components/process/QuestionCard";
import PropertiesPanel, { defaultProcessProperties, type ProcessProperties as PanelProcessProperties } from "@/components/process/PropertiesPanel";
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
  const [processProperties, setProcessProperties] = useState<PanelProcessProperties>(defaultProcessProperties());

  // Properties tab navigation state (kept for compatibility)
  const [selectedPropertiesSection, setSelectedPropertiesSection] = useState('process');

  // Section completion status (kept for compatibility)
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
    } else if (type === 'adv-dropdown') {
      newElement.config = { selectedTag: '' };
    } else if (type === 'scoring-dropdown') {
      newElement.config = { options: [] };
    } else if (type === 'grid') {
      newElement.config = { columns: [], rows: [] };
    } else if (type === 'calculation-grid') {
      newElement.config = { columns: [], rows: [] };
    } else if (type === 'dynamic-grid') {
      newElement.config = { columns: [], allowRowAddition: true };
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
          <div className="h-[calc(100vh-73px)]">
            <PropertiesPanel
              properties={processProperties}
              onChange={setProcessProperties}
              processTitle={fieldValues.field1}
            />
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
                    : formElements.map((element, index) => (
                      <QuestionCard
                        key={element.id}
                        element={element}
                        index={index}
                        formElements={formElements}
                        setFormElements={setFormElements}
                        onDelete={() => deleteFormElement(element.id)}
                        onDuplicate={() => copyFormElement(element)}
                        onOpenSettings={() => openSettingsDialog(element.id)}
                        processWithTags={processWithTags}
                        questionTags={questionTags}
                        processWithReview={processProperties.processWithReview}
                      />
                    ))
                  }
                </div>
              )}
            </div>

            {/* Settings Dialog */}
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Question Settings</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                  {selectedElementId && (() => {
                    const element = formElements.find(el => el.id === selectedElementId);
                    if (!element) return null;
                    return (
                      <QuestionSettingsContent
                        element={element}
                        formElements={formElements}
                        setFormElements={setFormElements}
                        isAuditMode={isAuditMode}
                      />
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

                <TabsContent value="settings" className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isAuditMode && (
                    <>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Audit Settings</span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Pass Threshold (%)</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="w-24"
                            value={(processDraft as any)?.passThreshold ?? 70}
                            onChange={(e) => {
                              if (processDraft) {
                                setProcessDraft({ ...processDraft, passThreshold: Number(e.target.value) } as any);
                              }
                            }}
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                        <p className="text-xs text-gray-400">Submissions below this score are marked as failed.</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Scoring Mode</label>
                        <select
                          className="w-full rounded border px-2 py-1.5 text-sm"
                          value={(processDraft as any)?.scoringConfig?.mode ?? 'weighted'}
                          onChange={(e) => {
                            if (processDraft) {
                              setProcessDraft({ ...processDraft, scoringConfig: { ...((processDraft as any).scoringConfig ?? {}), mode: e.target.value } } as any);
                            }
                          }}
                        >
                          <option value="weighted">Weighted (per-question scores)</option>
                          <option value="equal">Equal (all questions same weight)</option>
                          <option value="section">Section-based scoring</option>
                        </select>
                      </div>
                      <div className="h-px bg-gray-200" />
                    </>
                  )}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Form Settings</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{isAuditMode ? 'Audit' : 'Process'} with tags</span>
                    <Switch
                      checked={processWithTags}
                      onCheckedChange={setProcessWithTags}
                    />
                  </div>
                  {processWithTags && (
                    <p className="text-xs text-muted-foreground rounded-md border bg-sky-50 p-3">
                      Question tag dropdowns appear on each question. Tags come from Manage Tags - Question Tag.
                      Enable Visual Report View in Advanced Settings to filter submission photos by tag.
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{isAuditMode ? 'Audit' : 'Process'} with review</span>
                    <Switch
                      checked={processProperties.processWithReview}
                      onCheckedChange={(checked) => setProcessProperties({ ...processProperties, processWithReview: checked })}
                    />
                  </div>
                  {isAuditMode && processProperties.processWithReview && (
                    <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <label className="text-sm font-medium text-blue-800">Review Levels</label>
                      <Input
                        type="number"
                        min={1}
                        max={4}
                        className="w-20"
                        value={(processDraft as any)?.reviewLevels ?? 1}
                        onChange={(e) => {
                          if (processDraft) {
                            setProcessDraft({ ...processDraft, reviewLevels: Number(e.target.value) } as any);
                          }
                        }}
                      />
                      <p className="text-xs text-blue-600">Configure reviewers in Properties - Review tab.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="properties">
          <div className="h-[calc(100vh-73px)]">
            <PropertiesPanel
              properties={processProperties}
              onChange={setProcessProperties}
              processTitle={fieldValues.field1}
            />
          </div>
        </TabsContent>

        <TabsContent value="assign">
          <AssignTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
