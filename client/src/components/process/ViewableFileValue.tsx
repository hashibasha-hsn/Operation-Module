import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { fileNameFromUrl, isUrlValue } from "@/lib/fileUpload";

/** Renders a plain label as text, or a clickable "View file" link when the value is a URL. */
export default function ViewableFileValue({ value }: { value: string }) {
  if (!value) return null;
  if (!isUrlValue(value)) {
    return <span className="break-all">{value}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1">
      {fileNameFromUrl(value)}
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto min-h-0 p-0 text-sky-600 underline gap-0.5"
        onClick={() => window.open(value, "_blank")}
        title="View file"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        View file
      </Button>
    </span>
  );
}