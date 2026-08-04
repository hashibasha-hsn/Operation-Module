import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface MultipleAnswersInputProps {
  value: string;
  onValueChange: (next: string) => void;
  options: Array<{ label: string }>;
}

function parse(value: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [String(value)];
  } catch {
    return value ? [value] : [];
  }
}

export default function MultipleAnswersInput({
  value,
  onValueChange,
  options,
}: MultipleAnswersInputProps) {
  const [extraDraft, setExtraDraft] = useState("");
  const selected = parse(value);

  const update = (next: string[]) => onValueChange(JSON.stringify(next));

  const toggleOption = (label: string, checked: boolean) => {
    const next = checked
      ? [...selected, label]
      : selected.filter((item) => item !== label);
    update(next);
  };

  const addExtra = () => {
    const text = extraDraft.trim();
    if (!text) return;
    update([...selected, text]);
    setExtraDraft("");
  };

  return (
    <div className="space-y-3">
      {options.length > 0 && (
        <div className="space-y-2">
          {options.map((option: any) => {
            const checked = selected.includes(option.label);
            return (
              <label key={option.label} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggleOption(option.label, e.target.checked)}
                  className="h-4 w-4"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      )}

      {selected.map((item, idx) => {
        const isPredefined = options.some((o) => o.label === item);
        if (isPredefined) return null;
        return (
          <div key={`${item}-${idx}`} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={(e) => {
                const next = [...selected];
                next[idx] = e.target.value;
                update(next);
              }}
              className="flex-grow"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500"
              onClick={() => update(selected.filter((_, i) => i !== idx))}
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      <div className="flex items-center gap-2">
        <Input
          value={extraDraft}
          onChange={(e) => setExtraDraft(e.target.value)}
          placeholder="Add an extra answer..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addExtra();
            }
          }}
          className="flex-grow"
        />
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addExtra}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      {selected.length === 0 && (
        <Label className="text-xs text-muted-foreground">
          Select one or more options, or add an extra answer.
        </Label>
      )}
    </div>
  );
}
