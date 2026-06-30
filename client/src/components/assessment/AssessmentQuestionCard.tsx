import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckSquare,
  Circle,
  Copy,
  GripVertical,
  Info,
  Paperclip,
  Settings,
  Trash2,
  Type,
} from "lucide-react";

type FormElement = {
  id: string;
  type: string;
  label: string;
  config?: Record<string, unknown>;
};

type AssessmentQuestionCardProps = {
  element: FormElement;
  index: number;
  formElements: FormElement[];
  setFormElements: (elements: FormElement[]) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onOpenSettings: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  "single-answer": "Single Answer",
  "multiple-answers": "Multiple Answers",
  "short-answer": "Short Answer",
};

function patchElement(
  formElements: FormElement[],
  elementId: string,
  patch: Partial<FormElement> | { config: Record<string, unknown> },
): FormElement[] {
  return formElements.map((el) => {
    if (el.id !== elementId) return el;
    if ("config" in patch && patch.config) {
      return { ...el, config: { ...el.config, ...patch.config } };
    }
    return { ...el, ...patch };
  });
}

export default function AssessmentQuestionCard({
  element,
  index,
  formElements,
  setFormElements,
  onDelete,
  onDuplicate,
  onOpenSettings,
}: AssessmentQuestionCardProps) {
  const config = element.config ?? {};
  const options = (config.options as Array<{ label: string; score?: number }>) ?? [];
  const attachmentRef = useRef<HTMLInputElement>(null);
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [draftInstruction, setDraftInstruction] = useState("");

  const typeLabel = TYPE_LABELS[element.type] ?? element.type;
  const hasOptions = element.type === "single-answer" || element.type === "multiple-answers";
  const questionMissing = !element.label.trim();
  const optionsMissing =
    hasOptions && (options.length === 0 || options.every((option) => !option.label.trim()));

  const updateElement = (patch: Partial<FormElement> | { config: Record<string, unknown> }) => {
    setFormElements(patchElement(formElements, element.id, patch));
  };

  const updateOptions = (nextOptions: Array<{ label: string; score?: number }>) => {
    updateElement({ config: { options: nextOptions } });
  };

  const addOption = () => {
    updateOptions([...options, { label: "", score: 0 }]);
  };

  const openInstructionDialog = () => {
    setDraftInstruction(String(config.instructionText ?? ""));
    setInstructionOpen(true);
  };

  const saveInstruction = () => {
    updateElement({
      config: {
        instructionText: draftInstruction.trim() || undefined,
      },
    });
    setInstructionOpen(false);
  };

  const handleAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updateElement({ config: { attachmentName: file.name } });
    event.target.value = "";
  };

  const TypeIcon =
    element.type === "single-answer"
      ? Circle
      : element.type === "multiple-answers"
        ? CheckSquare
        : Type;

  return (
    <>
      <div className="relative flex gap-3 rounded-md border bg-white p-4 pr-14 shadow-sm">
        <div className="flex shrink-0 items-start pt-1 text-muted-foreground">
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border text-sm font-medium">
              {index + 1}
            </span>
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{typeLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => attachmentRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input ref={attachmentRef} type="file" className="hidden" onChange={handleAttachment} />
            {config.attachmentName ? (
              <span className="truncate text-xs text-muted-foreground">{String(config.attachmentName)}</span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Type Question Here"
              value={element.label}
              onChange={(e) => updateElement({ label: e.target.value })}
              className="flex-1"
            />
            <Input
              readOnly
              value={String(element.label.length)}
              className="w-12 text-center"
            />
          </div>

          <button
            type="button"
            onClick={openInstructionDialog}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Info className="h-4 w-4" />
            {config.instructionText ? "Edit Instructions" : "Add Instructions"}
          </button>

          {config.instructionText ? (
            <p className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
              {String(config.instructionText)}
            </p>
          ) : null}

          {element.type === "short-answer" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Validation Type:</span>
              <select
                className="rounded border px-2 py-1 text-sm"
                value={String(config.validationType ?? "text")}
                onChange={(e) => updateElement({ config: { validationType: e.target.value } })}
              >
                <option value="text">Text</option>
                <option value="alphanumeric">Alphanumeric</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>
          ) : null}

          {hasOptions ? (
            <div className="space-y-3">
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                + ADD NEW
              </Button>

              {options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  {element.type === "single-answer" ? (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <Input
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option.label}
                    onChange={(e) => {
                      const next = [...options];
                      next[optionIndex] = { ...next[optionIndex], label: e.target.value };
                      updateOptions(next);
                    }}
                    className="flex-1"
                  />
                  {(element.type === "single-answer" || element.type === "multiple-answers") && (
                    <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <input
                        type={element.type === "single-answer" ? "radio" : "checkbox"}
                        name={`correct-${element.id}`}
                        checked={Boolean(option.isCorrect)}
                        onChange={() => {
                          const next = options.map((item, idx) => {
                            if (element.type === "single-answer") {
                              return { ...item, isCorrect: idx === optionIndex };
                            }
                            if (idx === optionIndex) {
                              return { ...item, isCorrect: !item.isCorrect };
                            }
                            return item;
                          });
                          updateOptions(next);
                        }}
                      />
                      Correct
                    </label>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => updateOptions(options.filter((_, i) => i !== optionIndex))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Checkbox
                  id={`option-image-${element.id}`}
                  checked={Boolean(config.optionImage)}
                  onCheckedChange={(checked) =>
                    updateElement({ config: { optionImage: Boolean(checked) } })
                  }
                />
                <Label htmlFor={`option-image-${element.id}`} className="text-sm font-normal">
                  Option Image
                </Label>
              </div>
            </div>
          ) : null}

          {(questionMissing || optionsMissing) && (
            <div className="space-y-1 text-sm text-red-500">
              {questionMissing && <p>Question label is required</p>}
              {optionsMissing && <p>Options Required</p>}
            </div>
          )}
        </div>

        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate}>
            <Copy className="h-4 w-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenSettings}>
            <Settings className="h-4 w-4 text-orange-500" />
          </Button>
        </div>
      </div>

      <Dialog open={instructionOpen} onOpenChange={setInstructionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Question Instructions</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draftInstruction}
            onChange={(e) => setDraftInstruction(e.target.value)}
            placeholder="Add instructions for this question"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstructionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveInstruction}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
