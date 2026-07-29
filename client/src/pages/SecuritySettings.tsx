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
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchPasswordPolicy,
  updatePasswordPolicy,
  type PasswordPolicy,
} from "@/lib/passwordPolicyApi";

const EXPIRY_OPTIONS = [
  { value: "30", labelKey: "expiry30Days" },
  { value: "60", labelKey: "expiry60Days" },
  { value: "90", labelKey: "expiry90Days" },
  { value: "180", labelKey: "expiry180Days" },
  { value: "0", labelKey: "expiryNever" },
];

const WARN_OPTIONS = [
  { value: "0", labelKey: "warnNoWarning" },
  { value: "3", labelKey: "warn3Days" },
  { value: "7", labelKey: "warn7Days" },
  { value: "14", labelKey: "warn14Days" },
];

export default function SecuritySettings() {
  const { t } = useLanguage();
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
      toast.error(t('failedToLoadPolicy'));
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
      toast.success(t('policySaved'));
    } catch (err: any) {
      toast.error(err?.message || t('failedToSavePolicy'));
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
            <h1 className="text-3xl font-bold">{t('securitySettings')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('configurePasswordRotation')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={loadPolicy} disabled={loading || saving}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {t('reload')}
          </Button>
          <Button type="button" className="gap-2" onClick={handleSave} disabled={loading || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('saveChanges')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            {t('passwordRotationPolicy')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('passwordRotationPolicyDescription')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('loadingPolicy')}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Label>{t('passwordExpiry')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('passwordExpiryDescription')}
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
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Label>{t('warnBeforeExpiry')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('warnBeforeExpiryDescription')}
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
                        {t(opt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1">
                <p className="font-medium">
                  {rotationEnabled
                    ? t('rotationActive').replace('{{days}}', String(policy.passwordExpiryDays))
                    : t('rotationDisabled')}
                </p>
                <p className="text-muted-foreground">
                  {rotationEnabled
                    ? t('rotationDetails').replace('{{days}}', String(policy.warnBeforeExpiryDays || "none"))
                    : t('rotationEnableHint')}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
