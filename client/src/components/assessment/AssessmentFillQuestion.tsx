import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type QuestionOption = { label: string; score?: number; isCorrect?: boolean };

function getOptions(question: any): QuestionOption[] {
  const raw = question.options;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.options)) return raw.options;
  return [];
}

type Props = {
  question: any;
  value: unknown;
  onChange: (value: unknown) => void;
  showCorrectAnswer?: boolean;
  correctAnswer?: string | string[];
  disabled?: boolean;
};

export default function AssessmentFillQuestion({
  question,
  value,
  onChange,
  showCorrectAnswer,
  correctAnswer,
  disabled,
}: Props) {
  const options = getOptions(question);

  if (question.questionType === "short-answer") {
    return (
      <Input
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer"
        disabled={disabled}
      />
    );
  }

  if (question.questionType === "single-answer") {
    const selected = typeof value === "string" ? value : "";
    return (
      <RadioGroup value={selected} onValueChange={onChange} disabled={disabled}>
        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option.label}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                showCorrectAnswer && correctAnswer === option.label
                  ? "border-green-500 bg-green-50"
                  : showCorrectAnswer && selected === option.label && correctAnswer !== option.label
                    ? "border-red-400 bg-red-50"
                    : ""
              }`}
            >
              <RadioGroupItem value={option.label} id={`${question.id}-${option.label}`} />
              <span>{option.label || "Option"}</span>
            </label>
          ))}
        </div>
      </RadioGroup>
    );
  }

  if (question.questionType === "multiple-answers") {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (label: string) => {
      if (disabled) return;
      if (selected.includes(label)) {
        onChange(selected.filter((item) => item !== label));
      } else {
        onChange([...selected, label]);
      }
    };
    const correctSet = new Set(Array.isArray(correctAnswer) ? correctAnswer : []);

    return (
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.label}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
              showCorrectAnswer && correctSet.has(option.label)
                ? "border-green-500 bg-green-50"
                : showCorrectAnswer && selected.includes(option.label) && !correctSet.has(option.label)
                  ? "border-red-400 bg-red-50"
                  : ""
            }`}
          >
            <Checkbox
              checked={selected.includes(option.label)}
              onCheckedChange={() => toggle(option.label)}
              disabled={disabled}
            />
            <span>{option.label || "Option"}</span>
          </label>
        ))}
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">Unsupported question type</p>;
}
