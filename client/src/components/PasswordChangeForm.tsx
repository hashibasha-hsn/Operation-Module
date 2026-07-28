import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Circle, Eye, EyeOff, Loader2, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { clearMustChangePasswordFlag, getAuthItem } from "@/lib/authStorage";
import {
  getPasswordRuleResults,
  isPasswordValid,
  validatePassword,
} from "@/lib/passwordValidation";
import { useLanguage } from "@/contexts/LanguageContext";

type PasswordChangeFormProps = {
  className?: string;
  onSuccess?: () => void;
};

export default function PasswordChangeForm({ className, onSuccess }: PasswordChangeFormProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const passwordRules = useMemo(
    () => getPasswordRuleResults(form.newPassword),
    [form.newPassword],
  );

  const canSubmit =
    !isSubmitting &&
    Boolean(form.currentPassword.trim()) &&
    isPasswordValid(form.newPassword) &&
    form.newPassword === form.confirmPassword &&
    form.currentPassword !== form.newPassword;

  const updateField = (field: keyof typeof form, value: string) => {
    setError("");
    if (field === "currentPassword") setCurrentPasswordError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resolveApiError = (status: number, data: any) => {
    const raw = data?.message;
    const message = Array.isArray(raw) ? raw.join(", ") : typeof raw === "string" ? raw : raw?.message;
    const code = data?.code || data?.message?.code;

    if (
      status === 403 ||
      code === "CURRENT_PASSWORD_INVALID" ||
      String(message || "").toLowerCase().includes("current password")
    ) {
      return {
        field: "current" as const,
        text: t("currentPasswordIncorrect") || "Current password is incorrect",
      };
    }

    if (status === 401) {
      return {
        field: "form" as const,
        text:
          t("pleaseLoginToChangePassword") ||
          "Your session expired. Please log in again and retry.",
      };
    }

    return {
      field: "form" as const,
      text: message || t("failedToChangePassword") || "Failed to change password",
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCurrentPasswordError("");

    if (!form.currentPassword.trim() || !form.newPassword.trim() || !form.confirmPassword.trim()) {
      setError(t("fillAllPasswordFields") || "Please fill all password fields");
      return;
    }

    const policyError = validatePassword(form.newPassword);
    if (policyError) {
      setError(t("passwordPolicyHint") || policyError);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError(t("passwordsDoNotMatch") || "Passwords do not match");
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError(
        t("newPasswordMustDiffer") ||
          "New password must be different from the current password",
      );
      return;
    }

    const accessToken = getAuthItem("accessToken");
    if (!accessToken) {
      setError(t("pleaseLoginToChangePassword") || "You must be logged in to change your password");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:3009/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const resolved = resolveApiError(response.status, data);
        if (resolved.field === "current") {
          setCurrentPasswordError(resolved.text);
          setForm((prev) => ({ ...prev, currentPassword: "" }));
          setShowCurrent(false);
        } else {
          setError(resolved.text);
        }
        return;
      }

      toast.success(data?.message || t("passwordChangedSuccessfully") || "Password changed successfully");
      clearMustChangePasswordFlag();
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      onSuccess?.();
    } catch (err) {
      console.error("Change password error:", err);
      setError(t("failedToConnectToServer") || "Failed to connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className || "space-y-4 max-w-md"}>
      <div className="rounded-lg border border-sky-200/70 bg-sky-50/60 px-3 py-2 text-sm text-sky-900">
        {t("passwordPolicyHint") ||
          "Password must be at least 8 characters and include 1 lowercase letter, 1 number, and 1 special character"}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="currentPassword">{t("currentPassword") || "Current Password"}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="currentPassword"
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            className={`pl-9 pr-10 ${currentPasswordError ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
            value={form.currentPassword}
            onChange={(e) => updateField("currentPassword", e.target.value)}
            placeholder={t("enterCurrentPassword") || "Enter current password"}
            aria-invalid={Boolean(currentPasswordError)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowCurrent((v) => !v)}
            aria-label={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {currentPasswordError && (
          <p className="text-sm text-destructive">{currentPasswordError}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="newPassword">{t("newPassword") || "New Password"}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="newPassword"
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            className="pl-9 pr-10"
            value={form.newPassword}
            onChange={(e) => updateField("newPassword", e.target.value)}
            placeholder={t("enterNewPassword") || "Enter new password"}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowNew((v) => !v)}
            aria-label={showNew ? "Hide password" : "Show password"}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <ul className="mt-1 space-y-1.5 rounded-lg border border-border/70 bg-muted/30 p-3">
          {passwordRules.map((rule) => (
            <li
              key={rule.id}
              className={`flex items-center gap-2 text-sm ${
                rule.passed ? "text-emerald-600" : "text-muted-foreground"
              }`}
            >
              {rule.passed ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              {rule.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">
          {t("confirmNewPassword") || "Confirm New Password"}
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            className="pl-9 pr-10"
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            placeholder={t("confirmNewPassword") || "Confirm new password"}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword && (
          <p className="text-sm text-destructive">
            {t("passwordsDoNotMatch") || "Passwords do not match"}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" className="gap-2" disabled={!canSubmit}>
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t("updatePassword") || "Update Password"}
        </Button>
      </div>
    </form>
  );
}
