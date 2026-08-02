import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Save, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchEmailConfig,
  sendTestEmail,
  updateEmailConfig,
  type EmailConfig,
} from "@/lib/emailConfigApi";

const LEGACY_STORAGE_KEY = "hashibasha_email_config";

const DEFAULT_CONFIG: EmailConfig = {
  deliveryProvider: "smtp",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  fromEmail: "",
  fromName: "",
  useTls: true,
  azureTenantId: "",
  azureClientId: "",
  azureClientSecret: "",
  graphSendAsUser: "",
  frontendUrl: "",
};

export default function EmailConfig() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<EmailConfig>(DEFAULT_CONFIG);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await fetchEmailConfig();
        const hasSavedValues =
          saved.smtpHost || saved.smtpUser || saved.fromEmail || saved.hasPassword;

        if (!hasSavedValues) {
          const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (raw) {
            const legacy = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
            const migrated = await updateEmailConfig(legacy);
            setConfig({ ...DEFAULT_CONFIG, ...migrated });
            localStorage.removeItem(LEGACY_STORAGE_KEY);
            return;
          }
        }

        setConfig({ ...DEFAULT_CONFIG, ...saved });
      } catch (err: any) {
        toast.error(err?.message || "Failed to load email configuration");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await updateEmailConfig(config);
      setConfig({ ...DEFAULT_CONFIG, ...saved });
      toast.success(t("emailConfigSaved") || "Email configuration saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save email configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Enter a test recipient email");
      return;
    }

    setTesting(true);
    try {
      await updateEmailConfig(config);
      await sendTestEmail(testEmail.trim());
      toast.success("Test email sent successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send test email");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh] text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Mail className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t("emailConfig")}</h1>
          <p className="text-muted-foreground mt-1">
            Configure outgoing email settings used for welcome emails and system notifications.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 max-w-sm">
            <Label htmlFor="deliveryProvider">Email delivery provider</Label>
            <Select
              value={config.deliveryProvider}
              onValueChange={(v) =>
                setConfig({ ...config, deliveryProvider: v as "smtp" | "graph" })
              }
            >
              <SelectTrigger id="deliveryProvider" className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smtp">SMTP</SelectItem>
                <SelectItem value="graph">Microsoft Graph</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {config.deliveryProvider === "graph"
                ? "Uses Microsoft Graph API to send email as the configured mailbox."
                : "Uses traditional SMTP credentials."}
            </p>
          </div>

          <div className="grid gap-2 max-w-sm">
            <Label htmlFor="frontendUrl">Frontend URL</Label>
            <Input
              id="frontendUrl"
              placeholder="https://operation-module.vercel.app"
              value={config.frontendUrl}
              onChange={(e) => setConfig({ ...config, frontendUrl: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Base URL used for password reset and email verification links.
            </p>
          </div>
        </CardContent>
      </Card>

      {config.deliveryProvider === "graph" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Microsoft Graph Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="azureTenantId">Azure Tenant ID</Label>
                <Input
                  id="azureTenantId"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={config.azureTenantId}
                  onChange={(e) => setConfig({ ...config, azureTenantId: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="azureClientId">Azure Client ID</Label>
                <Input
                  id="azureClientId"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={config.azureClientId}
                  onChange={(e) => setConfig({ ...config, azureClientId: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="azureClientSecret">Azure Client Secret</Label>
                <Input
                  id="azureClientSecret"
                  type="password"
                  placeholder={
                    config.hasAzureSecret
                      ? "Saved (encrypted) — enter only to change"
                      : "••••••••"
                  }
                  value={config.azureClientSecret}
                  onChange={(e) => setConfig({ ...config, azureClientSecret: e.target.value })}
                />
                {config.hasAzureSecret && (
                  <p className="text-xs text-muted-foreground">
                    Stored encrypted in the database.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="graphSendAsUser">Send-as mailbox</Label>
                <Input
                  id="graphSendAsUser"
                  placeholder="automation@hashibasha.com"
                  value={config.graphSendAsUser}
                  onChange={(e) => setConfig({ ...config, graphSendAsUser: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>SMTP Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                placeholder="smtp.example.com"
                value={config.smtpHost}
                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                placeholder="587"
                value={config.smtpPort}
                onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                placeholder="notifications@example.com"
                value={config.smtpUser}
                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                placeholder={config.hasPassword ? "Saved — enter only to change" : "••••••••"}
                value={config.smtpPassword}
                onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                placeholder="noreply@example.com"
                value={config.fromEmail}
                onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                placeholder="Hashibasha"
                value={config.fromName}
                onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
              />
            </div>
          </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Use TLS</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Enable secure connection for SMTP delivery
              </p>
            </div>
            <Switch
              checked={config.useTls}
              onCheckedChange={(checked) => setConfig({ ...config, useTls: checked })}
            />
          </div>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-end">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="testEmail">Send test email</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Test
            </Button>
          </div>

          <div className="flex justify-end">
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
