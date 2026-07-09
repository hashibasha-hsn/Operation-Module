import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Copy, Settings, Trash2 } from "lucide-react";
import QuestionAddonsToolbar from "@/components/process/QuestionAddonsToolbar";

type FormElement = {
  id: string;
  type: string;
  label: string;
  config?: Record<string, any>;
};

type QuestionCardProps = {
  element: FormElement;
  index: number;
  formElements: FormElement[];
  setFormElements: (elements: FormElement[]) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onOpenSettings: () => void;
  processWithTags?: boolean;
  questionTags?: Array<{ id?: string; tagName: string; values?: string[] }>;
  processWithReview?: boolean;
};

function patchConfig(
  formElements: FormElement[],
  id: string,
  patch: Record<string, any>,
): FormElement[] {
  return formElements.map((el) =>
    el.id === id ? { ...el, config: { ...el.config, ...patch } } : el,
  );
}

function patchOptions(
  formElements: FormElement[],
  id: string,
  updater: (opts: any[]) => any[],
): FormElement[] {
  return formElements.map((el) =>
    el.id === id
      ? { ...el, config: { ...el.config, options: updater((el.config?.options as any[]) ?? []) } }
      : el,
  );
}

// ─── Dropdown ────────────────────────────────────────────────────────────────
function DropdownEditor({ element, formElements, setFormElements }: {
  element: FormElement; formElements: FormElement[]; setFormElements: (e: FormElement[]) => void;
}) {
  const options: any[] = (element.config?.options as any[]) ?? [];
  const patch = (updater: (opts: any[]) => any[]) =>
    setFormElements(patchOptions(formElements, element.id, updater));

  return (
    <div className="mb-3 space-y-2">
      <span className="text-sm font-medium text-gray-700">Options</span>
      {options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            placeholder={`Option ${idx + 1}`}
            value={opt.label}
            onChange={(e) => patch((opts) => opts.map((o, i) => i === idx ? { ...o, label: e.target.value } : o))}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0"
            onClick={() => patch((opts) => opts.filter((_, i) => i !== idx))}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => patch((opts) => [...opts, { label: "" }])}>
          + Add Option
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          const raw = prompt("Enter comma-separated options:");
          if (raw) patch((opts) => [...opts, ...raw.split(",").map((s) => ({ label: s.trim() })).filter((o) => o.label)]);
        }}>
          Bulk Add
        </Button>
      </div>
      {options.length > 0 && (
        <div className="mt-2 rounded border bg-gray-50 p-2">
          <p className="mb-1 text-xs text-gray-500">Preview</p>
          <select className="w-full rounded border bg-white px-2 py-1 text-sm" disabled>
            <option>Select…</option>
            {options.map((o, i) => <option key={i}>{o.label}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

// ─── Adv Dropdown ────────────────────────────────────────────────────────────
const ADV_TAGS = [
  { value: "product-category", label: "Product Category" },
  { value: "store-zone", label: "Store Zone" },
  { value: "department", label: "Department" },
  { value: "shift", label: "Shift" },
  { value: "employee", label: "Employee" },
  { value: "designation", label: "Designation" },
];

function AdvDropdownEditor({ element, formElements, setFormElements }: {
  element: FormElement; formElements: FormElement[]; setFormElements: (e: FormElement[]) => void;
}) {
  const selected = (element.config?.selectedTag as string) ?? "";
  const patch = (v: string) =>
    setFormElements(patchConfig(formElements, element.id, { selectedTag: v }));

  return (
    <div className="mb-3 space-y-2">
      <span className="text-sm font-medium text-gray-700">Pre-configured Tag Source</span>
      <p className="text-xs text-gray-500">Options load dynamically at submission time from the selected tag.</p>
      <select
        className="w-full rounded border px-2 py-1 text-sm"
        value={selected}
        onChange={(e) => patch(e.target.value)}
      >
        <option value="">— Select tag —</option>
        {ADV_TAGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      {selected && (
        <div className="rounded border bg-blue-50 p-2 text-xs text-blue-700">
          ✓ Will load options from <strong>{ADV_TAGS.find((t) => t.value === selected)?.label ?? selected}</strong>
        </div>
      )}
    </div>
  );
}

// ─── Scoring Dropdown ─────────────────────────────────────────────────────────
function ScoringDropdownEditor({ element, formElements, setFormElements }: {
  element: FormElement; formElements: FormElement[]; setFormElements: (e: FormElement[]) => void;
}) {
  const options: any[] = (element.config?.options as any[]) ?? [];
  const patch = (updater: (opts: any[]) => any[]) =>
    setFormElements(patchOptions(formElements, element.id, updater));

  return (
    <div className="mb-3 space-y-2">
      <span className="text-sm font-medium text-gray-700">Options with Scores</span>
      <p className="text-xs text-gray-500">Each option carries a numeric score used in calculations.</p>
      {options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            placeholder={`Option ${idx + 1}`}
            value={opt.label}
            onChange={(e) => patch((opts) => opts.map((o, i) => i === idx ? { ...o, label: e.target.value } : o))}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Score"
            value={opt.score ?? 0}
            onChange={(e) => patch((opts) => opts.map((o, i) => i === idx ? { ...o, score: Number(e.target.value) } : o))}
            className="w-20 text-center"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0"
            onClick={() => patch((opts) => opts.filter((_, i) => i !== idx))}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => patch((opts) => [...opts, { label: "", score: 0 }])}>
          + Add Option
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          const raw = prompt("Enter comma-separated options:");
          if (raw) patch((opts) => [...opts, ...raw.split(",").map((s) => ({ label: s.trim(), score: 0 })).filter((o) => o.label)]);
        }}>
          Bulk Add
        </Button>
      </div>
      {options.length > 0 && (
        <div className="mt-2 rounded border bg-gray-50 p-2">
          <p className="mb-1 text-xs text-gray-500">Preview</p>
          <select className="w-full rounded border bg-white px-2 py-1 text-sm" disabled>
            <option>Select…</option>
            {options.map((o, i) => <option key={i}>{o.label} ({o.score ?? 0} pts)</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────
function GridEditor({ element, formElements, setFormElements }: {
  element: FormElement; formElements: FormElement[]; setFormElements: (e: FormElement[]) => void;
}) {
  const columns: string[] = (element.config?.columns as string[]) ?? [];
  const rows: string[] = (element.config?.rows as string[]) ?? [];

  const patchCols = (updater: (c: string[]) => string[]) =>
    setFormElements(patchConfig(formElements, element.id, { columns: updater(columns) }));
  const patchRows = (updater: (r: string[]) => string[]) =>
    setFormElements(patchConfig(formElements, element.id, { rows: updater(rows) }));

  return (
    <div className="mb-3 space-y-4">
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Columns</span>
        {columns.map((col, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input value={col} placeholder={`Column ${idx + 1}`}
              onChange={(e) => patchCols((cs) => cs.map((c, i) => i === idx ? e.target.value : c))}
              className="flex-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0"
              onClick={() => patchCols((cs) => cs.filter((_, i) => i !== idx))}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => patchCols((cs) => [...cs, ""])}>+ Add Column</Button>
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Rows</span>
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input value={row} placeholder={`Row ${idx + 1}`}
              onChange={(e) => patchRows((rs) => rs.map((r, i) => i === idx ? e.target.value : r))}
              className="flex-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0"
              onClick={() => patchRows((rs) => rs.filter((_, i) => i !== idx))}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => patchRows((rs) => [...rs, ""])}>+ Add Row</Button>
      </div>
      {columns.length > 0 && rows.length > 0 && (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="border-r px-2 py-1 text-left font-medium text-gray-500 w-24">—</th>
                {columns.map((c, i) => <th key={i} className="border-r px-2 py-1 text-left font-medium">{c || `Col ${i+1}`}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-t">
                  <td className="border-r px-2 py-1 font-medium bg-gray-50">{r || `Row ${ri+1}`}</td>
                  {columns.map((_, ci) => <td key={ci} className="border-r px-2 py-1 text-gray-300 italic">cell</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Calculation Grid ─────────────────────────────────────────────────────────
const CALC_DATA_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "dropdown", label: "Dropdown" },
  { value: "barcode", label: "Barcode" },
  { value: "attachment", label: "Attachment" },
];

type CalcColumn = { name: string; dataType: string };

function CalcGridEditor({ element, formElements, setFormElements }: {
  element: FormElement; formElements: FormElement[]; setFormElements: (e: FormElement[]) => void;
}) {
  const rawCols = (element.config?.columns as any[]) ?? [];
  const columns: CalcColumn[] = rawCols.map((c) =>
    typeof c === "string" ? { name: c, dataType: "text" } : c
  );
  const rows: string[] = (element.config?.rows as string[]) ?? [];

  const patchCols = (next: CalcColumn[]) =>
    setFormElements(patchConfig(formElements, element.id, { columns: next }));
  const patchRows = (updater: (r: string[]) => string[]) =>
    setFormElements(patchConfig(formElements, element.id, { rows: updater(rows) }));

  return (
    <div className="mb-3 space-y-4">
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Columns (name + data type)</span>
        {columns.map((col, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input value={col.name} placeholder={`Column ${idx + 1}`}
              onChange={(e) => patchCols(columns.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))}
              className="flex-1" />
            <select className="rounded border px-2 py-1 text-sm w-32"
              value={col.dataType}
              onChange={(e) => patchCols(columns.map((c, i) => i === idx ? { ...c, dataType: e.target.value } : c))}>
              {CALC_DATA_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0"
              onClick={() => patchCols(columns.filter((_, i) => i !== idx))}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm"
          onClick={() => patchCols([...columns, { name: "", dataType: "text" }])}>
          + Add Column
        </Button>
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Rows</span>
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input value={row} placeholder={`Row ${idx + 1}`}
              onChange={(e) => patchRows((rs) => rs.map((r, i) => i === idx ? e.target.value : r))}
              className="flex-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0"
              onClick={() => patchRows((rs) => rs.filter((_, i) => i !== idx))}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => patchRows((rs) => [...rs, ""])}>+ Add Row</Button>
      </div>
      {columns.length > 0 && (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-xs">
            <thead className="bg-gray-100">
              <tr>
                {columns.length > 0 && rows.length > 0 && <th className="border-r px-2 py-1 text-gray-500 w-20">—</th>}
                {columns.map((c, i) => (
                  <th key={i} className="border-r px-2 py-1 text-left font-medium">
                    {c.name || `Col ${i+1}`}
                    <span className="ml-1 font-normal text-gray-400">({c.dataType})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-t">
                  <td className="border-r px-2 py-1 font-medium bg-gray-50">{r || `Row ${ri+1}`}</td>
                  {columns.map((_, ci) => <td key={ci} className="border-r px-2 py-1 text-gray-300 italic">—</td>)}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="border-t">
                  {columns.map((_, ci) => <td key={ci} className="border-r px-2 py-1 text-gray-300 italic">—</td>)}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Dynamic Grid ─────────────────────────────────────────────────────────────
const DYN_DATA_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "attachment", label: "Attachment" },
];

type DynColumn = { name: string; dataType: string };

function DynamicGridEditor({ element, formElements, setFormElements }: {
  element: FormElement; formElements: FormElement[]; setFormElements: (e: FormElement[]) => void;
}) {
  const rawCols = (element.config?.columns as any[]) ?? [];
  const columns: DynColumn[] = rawCols.map((c) =>
    typeof c === "string" ? { name: c, dataType: "text" } : c
  );
  const allowAdd = element.config?.allowRowAddition !== false;

  const patchCols = (next: DynColumn[]) =>
    setFormElements(patchConfig(formElements, element.id, { columns: next }));

  return (
    <div className="mb-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">BETA</span>
        <span className="text-xs text-gray-500">Rows are added dynamically by the submitter.</span>
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Column Definitions</span>
        {columns.map((col, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input value={col.name} placeholder={`Column ${idx + 1}`}
              onChange={(e) => patchCols(columns.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))}
              className="flex-1" />
            <select className="rounded border px-2 py-1 text-sm w-32"
              value={col.dataType}
              onChange={(e) => patchCols(columns.map((c, i) => i === idx ? { ...c, dataType: e.target.value } : c))}>
              {DYN_DATA_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0"
              onClick={() => patchCols(columns.filter((_, i) => i !== idx))}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm"
          onClick={() => patchCols([...columns, { name: "", dataType: "text" }])}>
          + Add Column
        </Button>
      </div>
      <label className="flex items-center gap-2 rounded border bg-blue-50 p-2 cursor-pointer">
        <input type="checkbox" checked={allowAdd}
          onChange={(e) => setFormElements(patchConfig(formElements, element.id, { allowRowAddition: e.target.checked }))}
          className="h-4 w-4" />
        <span className="text-sm text-blue-700">Allow submitter to add rows</span>
      </label>
      {columns.length > 0 && (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-xs">
            <thead className="bg-gray-100">
              <tr>
                {columns.map((c, i) => (
                  <th key={i} className="border-r px-2 py-1 text-left font-medium">
                    {c.name || `Col ${i+1}`}
                    <span className="ml-1 font-normal text-gray-400">({c.dataType})</span>
                  </th>
                ))}
                <th className="px-2 py-1 text-gray-400 w-8">×</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                {columns.map((_, ci) => <td key={ci} className="border-r px-2 py-1 text-gray-300 italic">row 1</td>)}
                <td className="px-2 py-1 text-gray-300">×</td>
              </tr>
            </tbody>
          </table>
          {allowAdd && (
            <div className="border-t px-2 py-1">
              <button className="w-full rounded border border-dashed border-blue-300 py-1 text-xs text-blue-400" disabled>
                + Add Row
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Settings Dialog Content ──────────────────────────────────────────────────
export function QuestionSettingsContent({ element, formElements, setFormElements, isAuditMode = false }: {
  element: FormElement; formElements: FormElement[]; setFormElements: (e: FormElement[]) => void; isAuditMode?: boolean;
}) {
  const patchEl = (patch: Record<string, any>) =>
    setFormElements(patchConfig(formElements, element.id, patch));

  return (
    <div className="space-y-5 overflow-y-auto max-h-[70vh] pr-1">
      {/* Required */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-sm font-medium">Required field</span>
        <Switch checked={Boolean(element.config?.required)}
          onCheckedChange={(v) => patchEl({ required: v })} />
      </div>

      {/* Audit-specific fields */}
      {isAuditMode && (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <span className="text-sm font-semibold text-amber-800">Audit Question Settings</span>
          <label className="flex items-center justify-between">
            <span className="text-sm">Critical question</span>
            <Switch checked={Boolean(element.config?.isCritical)}
              onCheckedChange={(v) => patchEl({ isCritical: v })} />
          </label>
          <div className="flex items-center gap-3">
            <label className="text-sm shrink-0">Max Score:</label>
            <Input type="number" min={0} className="w-24"
              value={(element.config?.maxScore as number) ?? ""}
              onChange={(e) => patchEl({ maxScore: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm shrink-0">Weight (%):</label>
            <Input type="number" min={0} max={100} className="w-24"
              value={(element.config?.weight as number) ?? ""}
              onChange={(e) => patchEl({ weight: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
        </div>
      )}

      {/* Scoring */}
      <div className="space-y-3 rounded-lg border p-3">
        <span className="text-sm font-medium">Scoring</span>
        <select className="w-full rounded border px-2 py-1 text-sm"
          value={(element.config?.scoringType as string) ?? "none"}
          onChange={(e) => patchEl({ scoringType: e.target.value })}>
          <option value="none">No Scoring</option>
          <option value="weightage">Weightage-Based</option>
          <option value="input">Input-Based (BODMAS)</option>
        </select>
        {element.config?.scoringType === "weightage" && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Weightage (marks):</span>
            <Input type="number" className="w-20"
              value={(element.config?.weightage as number) ?? 0}
              onChange={(e) => patchEl({ weightage: Number(e.target.value) })} />
          </div>
        )}
        {element.config?.scoringType === "input" && (
          <div className="space-y-1">
            <span className="text-sm">Calculator function:</span>
            <select className="w-full rounded border px-2 py-1 text-sm"
              value={(element.config?.calculatorFunction as string) ?? "none"}
              onChange={(e) => patchEl({ calculatorFunction: e.target.value })}>
              <option value="none">None</option>
              <option value="average">AVERAGE()</option>
              <option value="sum-na">Σ NA Count</option>
              <option value="sum-weightage">Σ Weightage</option>
            </select>
          </div>
        )}
        <div className="space-y-1">
          <span className="text-sm">Range validation (numbers):</span>
          <div className="flex items-center gap-2">
            <Input type="number" placeholder="Min" className="w-24"
              value={(element.config?.rangeValidation as any)?.min ?? ""}
              onChange={(e) => patchEl({ rangeValidation: { ...(element.config?.rangeValidation as any), min: e.target.value ? Number(e.target.value) : undefined } })} />
            <span className="text-sm">to</span>
            <Input type="number" placeholder="Max" className="w-24"
              value={(element.config?.rangeValidation as any)?.max ?? ""}
              onChange={(e) => patchEl({ rangeValidation: { ...(element.config?.rangeValidation as any), max: e.target.value ? Number(e.target.value) : undefined } })} />
          </div>
        </div>
      </div>

      {/* Type-specific */}
      {element.type === "dropdown" && <DropdownEditor element={element} formElements={formElements} setFormElements={setFormElements} />}
      {element.type === "adv-dropdown" && <AdvDropdownEditor element={element} formElements={formElements} setFormElements={setFormElements} />}
      {element.type === "scoring-dropdown" && <ScoringDropdownEditor element={element} formElements={formElements} setFormElements={setFormElements} />}
      {element.type === "grid" && <GridEditor element={element} formElements={formElements} setFormElements={setFormElements} />}
      {element.type === "calculation-grid" && <CalcGridEditor element={element} formElements={formElements} setFormElements={setFormElements} />}
      {element.type === "dynamic-grid" && <DynamicGridEditor element={element} formElements={formElements} setFormElements={setFormElements} />}
    </div>
  );
}

// ─── Main QuestionCard ────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  "short-answer": "Short Answer",
  "long-answer": "Long Answer",
  "single-answer": "Single Answer",
  "multiple-answers": "Multiple Answers",
  "file-upload": "File Upload",
  "dropdown": "Dropdown",
  "adv-dropdown": "Adv Dropdown",
  "scoring-dropdown": "Scoring Dropdown",
  "grid": "Grid",
  "calculation-grid": "Calculation Grid",
  "dynamic-grid": "Dynamic Grid",
  "date": "Date",
  "time": "Time",
};

export default function QuestionCard({
  element, index, formElements, setFormElements,
  onDelete, onDuplicate, onOpenSettings,
  processWithTags = false, questionTags = [], processWithReview = false,
}: QuestionCardProps) {
  const updateLabel = (label: string) =>
    setFormElements(formElements.map((el) => el.id === element.id ? { ...el, label } : el));

  return (
    <div className="relative rounded-md border bg-white shadow-sm p-4 pr-14">
      {/* Action buttons */}
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate}>
          <Copy className="h-4 w-4 text-blue-500" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenSettings}>
          <Settings className="h-4 w-4 text-gray-500" />
        </Button>
      </div>

      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-gray-400">{index + 1}</span>
        <span className="inline-flex h-5 w-5 shrink-0 rounded-full bg-gray-200" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {TYPE_LABELS[element.type] ?? element.type}
        </span>
        {element.type === "dynamic-grid" && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">BETA</span>
        )}
      </div>

      {/* Addons toolbar */}
      <QuestionAddonsToolbar
        element={element}
        formElements={formElements}
        setFormElements={setFormElements}
        processWithTags={processWithTags}
        questionTags={questionTags}
      />

      {/* Question label input */}
      <div className="flex items-center gap-2 mb-3">
        <Input
          placeholder="Type question here…"
          value={element.label}
          onChange={(e) => updateLabel(e.target.value)}
          className="flex-1"
        />
        <span className="shrink-0 text-xs text-gray-400">{element.label.length}</span>
      </div>

      {/* Type-specific editors */}
      {element.type === "dropdown" && <DropdownEditor element={element} formElements={formElements} setFormElements={setFormElements} />}
      {element.type === "adv-dropdown" && <AdvDropdownEditor element={element} formElements={formElements} setFormElements={setFormElements} />}
      {element.type === "scoring-dropdown" && <ScoringDropdownEditor element={element} formElements={formElements} setFormElements={setFormElements} />}
      {element.type === "grid" && <GridEditor element={element} formElements={formElements} setFormElements={setFormElements} />}
      {element.type === "calculation-grid" && <CalcGridEditor element={element} formElements={formElements} setFormElements={setFormElements} />}
      {element.type === "dynamic-grid" && <DynamicGridEditor element={element} formElements={formElements} setFormElements={setFormElements} />}

      {/* Review config */}
      {processWithReview && (
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 space-y-2">
          <span className="text-sm font-medium text-blue-800">Review Configuration</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 shrink-0">Review Type:</span>
            <select className="flex-1 rounded border px-2 py-1 text-sm"
              value={(element.config?.reviewType as string) ?? "none"}
              onChange={(e) => setFormElements(patchConfig(formElements, element.id, { reviewType: e.target.value }))}>
              <option value="none">No Review</option>
              <option value="review-existing">Review Existing Question</option>
              <option value="independent-review">Independent Review Question</option>
            </select>
          </div>
          {element.config?.reviewType === "independent-review" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 shrink-0">Reviewer Level:</span>
              <select className="flex-1 rounded border px-2 py-1 text-sm"
                value={(element.config?.reviewerLevel as string) ?? "L1"}
                onChange={(e) => setFormElements(patchConfig(formElements, element.id, { reviewerLevel: e.target.value }))}>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="L4">L4</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
