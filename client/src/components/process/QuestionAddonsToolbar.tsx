import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getOptionLabels,
  hasPredefinedOptions,
  patchElementConfig,
  type FormElementWithAddons,
  type QuestionAddonConfig,
} from "@/lib/questionAddons";
import {
  Check,
  Clock,
  FilePlus,
  FileText,
  Info,
  MessageSquareMore,
  Paperclip,
  Trash2,
} from "lucide-react";

type QuestionAddonsToolbarProps<T extends FormElementWithAddons> = {
  element: T;
  formElements: T[];
  setFormElements: (elements: T[]) => void;
  processWithTags?: boolean;
  questionTags?: Array<{ id?: string; tagName: string; values?: string[] }>;
};

export default function QuestionAddonsToolbar<T extends FormElementWithAddons>({
  element,
  formElements,
  setFormElements,
  processWithTags = false,
  questionTags = [],
}: QuestionAddonsToolbarProps<T>) {
  const config = element.config ?? {};
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const instructionFileRef = useRef<HTMLInputElement>(null);

  const [instructionOpen, setInstructionOpen] = useState(false);
  const [actionPointOpen, setActionPointOpen] = useState(false);
  const [draftInstruction, setDraftInstruction] = useState("");
  const [draftInstructionFile, setDraftInstructionFile] = useState<string | null>(null);

  const updateConfig = (patch: Partial<QuestionAddonConfig>) => {
    setFormElements(patchElementConfig(formElements, element.id, patch));
  };

  const optionLabels = getOptionLabels(config);
  const supportsAutoActionPoint = hasPredefinedOptions(element.type) && optionLabels.length > 0;

  const openInstructionDialog = () => {
    setDraftInstruction(String(config.instructionText ?? ""));
    setDraftInstructionFile(config.instructionAttachment ? String(config.instructionAttachment) : null);
    setInstructionOpen(true);
  };

  const saveInstruction = () => {
    updateConfig({
      instructionText: draftInstruction.trim() || undefined,
      instructionAttachment: draftInstructionFile ?? undefined,
    });
    setInstructionOpen(false);
  };

  const discardInstruction = () => {
    updateConfig({ instructionText: undefined, instructionAttachment: undefined });
    setDraftInstruction("");
    setDraftInstructionFile(null);
    setInstructionOpen(false);
  };

  const toggleActionPointTrigger = (label: string) => {
    const current = config.actionPointAutoTriggers ?? [];
    const next = current.includes(label)
      ? current.filter((item) => item !== label)
      : [...current, label];
    updateConfig({ actionPointAutoTriggers: next });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 ${config.attachFile ? "bg-blue-50 border-blue-500" : ""}`}
              onClick={() => referenceInputRef.current?.click()}
            >
              <FilePlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach a file with question</TooltipContent>
        </Tooltip>
        <input
          ref={referenceInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            updateConfig({ attachFile: true, questionReferenceFile: file.name });
          }}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-1 ${config.markNA ? "bg-blue-50 border-blue-500" : ""}`}
              onClick={() => updateConfig({ markNA: !config.markNA })}
            >
              <FileText className="h-3 w-3" /> N/A
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mark as N/A</TooltipContent>
        </Tooltip>

        <Popover open={actionPointOpen} onOpenChange={setActionPointOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-9 w-9 ${config.actionPoint && config.actionPoint !== "none" ? "bg-blue-50 border-blue-500" : ""}`}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Trigger Action Point</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80 space-y-3" align="start">
            <p className="text-sm font-medium">Action Point</p>
            <div className="space-y-2">
              {(["none", "manual", "auto"] as const).map((mode) => (
                <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`action-point-${element.id}`}
                    checked={(config.actionPoint ?? "none") === mode}
                    disabled={mode === "auto" && !supportsAutoActionPoint}
                    onChange={() =>
                      updateConfig({
                        actionPoint: mode,
                        actionPointAutoTriggers: mode === "auto" ? config.actionPointAutoTriggers ?? [] : [],
                      })
                    }
                  />
                  <span className="capitalize">{mode === "none" ? "Disabled" : mode}</span>
                </label>
              ))}
            </div>
            {config.actionPoint === "auto" && supportsAutoActionPoint && (
              <div className="space-y-2 border-t pt-2">
                <p className="text-xs text-muted-foreground">Auto-trigger when these options are selected:</p>
                {optionLabels.map((label) => (
                  <label key={label} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={(config.actionPointAutoTriggers ?? []).includes(label)}
                      onCheckedChange={() => toggleActionPointTrigger(label)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
            {config.actionPoint === "auto" && !supportsAutoActionPoint && (
              <p className="text-xs text-amber-600">
                Auto action points require predefined options (Single answer, Dropdown, etc.).
              </p>
            )}
          </PopoverContent>
        </Popover>

        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-9 w-9 ${config.allowComment ? "bg-blue-50 border-blue-500" : ""}`}
                >
                  <MessageSquareMore className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Allow commenting on answer</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 space-y-3" align="start">
            <label className="flex items-center justify-between text-sm">
              <span>Enable comment</span>
              <Checkbox
                checked={Boolean(config.allowComment)}
                onCheckedChange={(checked) =>
                  updateConfig({
                    allowComment: Boolean(checked),
                    commentRequired: checked ? config.commentRequired : false,
                  })
                }
              />
            </label>
            {config.allowComment && (
              <label className="flex items-center justify-between text-sm">
                <span>Required</span>
                <Checkbox
                  checked={Boolean(config.commentRequired)}
                  onCheckedChange={(checked) => updateConfig({ commentRequired: Boolean(checked) })}
                />
              </label>
            )}
          </PopoverContent>
        </Popover>

        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-9 w-9 ${config.answerAttachment ? "bg-blue-50 border-blue-500" : ""}`}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Answer attachments with answer</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 space-y-3" align="start">
            <label className="flex items-center justify-between text-sm">
              <span>Enable attachment</span>
              <Checkbox
                checked={Boolean(config.answerAttachment)}
                onCheckedChange={(checked) =>
                  updateConfig({
                    answerAttachment: Boolean(checked),
                    answerAttachmentRequired: checked ? config.answerAttachmentRequired : false,
                  })
                }
              />
            </label>
            {config.answerAttachment && (
              <label className="flex items-center justify-between text-sm">
                <span>Required</span>
                <Checkbox
                  checked={Boolean(config.answerAttachmentRequired)}
                  onCheckedChange={(checked) => updateConfig({ answerAttachmentRequired: Boolean(checked) })}
                />
              </label>
            )}
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 ${config.timestamp ? "bg-blue-50 border-blue-500" : ""}`}
              onClick={() => updateConfig({ timestamp: !config.timestamp })}
            >
              <Clock className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Timestamp</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 ${config.instructionText || config.instructionAttachment ? "bg-blue-50 border-blue-500" : ""}`}
              onClick={openInstructionDialog}
            >
              <Info className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add instruction</TooltipContent>
        </Tooltip>
      </div>

      {(config.attachFile ||
        config.markNA ||
        (config.actionPoint && config.actionPoint !== "none") ||
        config.allowComment ||
        config.answerAttachment ||
        config.timestamp ||
        config.instructionText ||
        config.instructionAttachment ||
        (processWithTags && config.questionTag)) && (
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {config.attachFile && (
            <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">
              Reference file: {config.questionReferenceFile || "Attached"}
            </span>
          )}
          {config.markNA && <span className="rounded bg-gray-100 px-2 py-1">N/A enabled</span>}
          {config.actionPoint && config.actionPoint !== "none" && (
            <span className="rounded bg-gray-100 px-2 py-1">
              Action point: {config.actionPoint}
              {config.actionPoint === "auto" && (config.actionPointAutoTriggers?.length ?? 0) > 0
                ? ` (${config.actionPointAutoTriggers?.join(", ")})`
                : ""}
            </span>
          )}
          {config.allowComment && (
            <span className="rounded bg-gray-100 px-2 py-1">
              Comment{config.commentRequired ? " (required)" : " (optional)"}
            </span>
          )}
          {config.answerAttachment && (
            <span className="rounded bg-gray-100 px-2 py-1">
              Answer attachment{config.answerAttachmentRequired ? " (required)" : " (optional)"}
            </span>
          )}
          {config.timestamp && <span className="rounded bg-gray-100 px-2 py-1">Timestamp</span>}
          {(config.instructionText || config.instructionAttachment) && (
            <span className="rounded bg-gray-100 px-2 py-1">Instruction added</span>
          )}
          {processWithTags && config.questionTag && (
            <span className="rounded bg-orange-50 px-2 py-1 text-orange-700">Tag: {config.questionTag}</span>
          )}
        </div>
      )}

      {processWithTags && (
        <div className="mb-3 flex items-center gap-2">
          <Label className="text-sm text-gray-600 whitespace-nowrap">Question tag</Label>
          <select
            className="border rounded px-2 py-1 text-sm flex-1 max-w-xs"
            value={config.questionTag || ""}
            onChange={(event) => updateConfig({ questionTag: event.target.value || undefined })}
          >
            <option value="">Select a tag...</option>
            {questionTags.map((tag) => (
              <option key={tag.id ?? tag.tagName} value={tag.tagName}>
                {tag.tagName}
              </option>
            ))}
          </select>
        </div>
      )}

      <Dialog open={instructionOpen} onOpenChange={setInstructionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add instruction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              placeholder="Write a short note or guideline for submitters..."
              value={draftInstruction}
              onChange={(event) => setDraftInstruction(event.target.value)}
              className="min-h-[160px]"
            />
            <div className="rounded-md border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Instruction attachment (optional)</span>
              </div>
              <input
                ref={instructionFileRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setDraftInstructionFile(file ? file.name : null);
                }}
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => instructionFileRef.current?.click()}>
                  Attach image or file
                </Button>
                {draftInstructionFile && (
                  <div className="flex items-center gap-2 rounded bg-gray-100 px-2 py-1 text-sm">
                    {draftInstructionFile}
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDraftInstructionFile(null)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstructionOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" className="text-red-600" onClick={discardInstruction}>
              Discard
            </Button>
            <Button onClick={saveInstruction}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
