import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Paperclip, Trash2, ExternalLink } from "lucide-react";
import { uploadSubmissionFile, fileNameFromUrl } from "@/lib/fileUpload";

interface FileAnswerInputProps {
  value: string;
  onValueChange: (url: string) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  label?: string;
  required?: boolean;
}

export default function FileAnswerInput({
  value,
  onValueChange,
  acceptedTypes = "pdf,xlsx,xls,jpeg,jpg,png,gif,webp,docx,doc,pptx,ppt,csv,txt",
  maxSizeMB = 10,
  label,
  required = false,
}: FileAnswerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const accept = acceptedTypes
    .split(",")
    .map((t) => `.${t.trim().replace(/^\./, "")}`)
    .filter(Boolean)
    .join(",");

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File exceeds the ${maxSizeMB} MB limit`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadSubmissionFile(file);
      if (!url) {
        toast.error("Upload failed — please try again");
        return;
      }
      onValueChange(url);
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <Label className="text-xs text-muted-foreground">
          {label}
          {required ? " (required)" : ""}
        </Label>
      )}
      {!value ? (
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="file"
            accept={accept}
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {uploading && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading…
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm truncate flex-1">{fileNameFromUrl(value)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => window.open(value, "_blank")}
            title="View / Download"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-red-500"
            onClick={() => onValueChange("")}
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
