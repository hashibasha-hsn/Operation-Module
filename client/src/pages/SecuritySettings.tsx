import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Key, Loader2, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPasswordPolicy,
  updatePasswordPolicy,
  type PasswordPolicy,
} from "@/lib/passwordPolicyApi";

const EXPIRY_OPTIONS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "0", label: "Never" },
];

const WARN_OPTIONS = [
  { value: "0", label: "No warning" },
  { value: "3", label: "3 days before" },
  { value: "7", label: "7 days before" },
  { value: "14", label: "14 days before" },
];

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<PasswordPolicy>({
    passwordExpiryDays: 90,
    warnBeforeExpiryDays: 7,
  });

  const loadPolicy = async () => {
    setLoading(true);
    try {
      const data = await fetchPasswordPolicy();
      setPolicy({
        passwordExpiryDays: Number(data.passwordExpiryDays ?? 90),
        warnBeforeExpiryDays: Number(data.warnBeforeExpiryDays ?? 7),
        id: data.id,
        scopeKey: data.scopeKey,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load password rotation policy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicy();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await updatePasswordPolicy({
        passwordExpiryDays: policy.passwordExpiryDays,
        warnBeforeExpiryDays: policy.warnBeforeExpiryDays,
      });
      setPolicy({
        passwordExpiryDays: Number(saved.passwordExpiryDays ?? 90),
        warnBeforeExpiryDays: Number(saved.warnBeforeExpiryDays ?? 7),
        id: saved.id,
        scopeKey: saved.scopeKey,
      });
      toast.success("Password rotation policy saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save password rotation policy");
    } finally {
      setSaving(false);
    }
  };

  const rotationEnabled = policy.passwordExpiryDays > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Security Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure password rotation so users keep accounts secure
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={loadPolicy} disabled={loading || saving}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Reload
          </Button>
          <Button type="button" className="gap-2" onClick={handleSave} disabled={loading || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Password Rotation Policy
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Force users to change their password after a configured period. Expired passwords
            redirect to Change Password after login.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading policy…
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Label>Password expiry (rotation interval)</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Users must change password after this many days
                  </p>
                </div>
                <Select
                  value={String(policy.passwordExpiryDays)}
                  onValueChange={(value) =>
                    setPolicy((prev) => ({
                      ...prev,
                      passwordExpiryDays: parseInt(value, 10),
                    }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Label>Warn before expiry</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Show an approaching-expiry notice on login
                  </p>
                </div>
                <Select
                  value={String(policy.warnBeforeExpiryDays)}
                  onValueChange={(value) =>
                    setPolicy((prev) => ({
                      ...prev,
                      warnBeforeExpiryDays: parseInt(value, 10),
                    }))
                  }
                  disabled={!rotationEnabled}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WARN_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1">
                <p className="font-medium">
                  {rotationEnabled
                    ? `Rotation active — passwords expire every ${policy.passwordExpiryDays} days`
                    : "Rotation disabled — passwords never expire"}
                </p>
                <p className="text-muted-foreground">
                  {rotationEnabled
                    ? `When expired, login still succeeds but the user is required to set a new password (current password verified first). Warning window: ${policy.warnBeforeExpiryDays || "none"}.`
                    : "Set an expiry interval above and save to enable rotation."}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
