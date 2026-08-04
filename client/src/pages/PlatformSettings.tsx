import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Mail,
  Clock,
  Calendar,
  Globe,
  Shield,
  FileSpreadsheet,
  Bell,
  Webhook,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredUser, getOrganizationId } from '@/lib/authStorage';
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getSnapshotConfig,
  saveSnapshotConfig,
  sendSnapshotEmail,
  sendSnapshotTestEmail,
} from "@/lib/snapshotEmail";

const PLATFORM_KEY = (orgId: string) => `platform-settings:${orgId}`;

export default function PlatformSettings() {
  const { t } = useLanguage();
  const orgId = getOrganizationId();
  const [activeTab, setActiveTab] = useState("admin");

  const [adminSettings, setAdminSettings] = useState({
    sendEmailOnUserCreation: true,
    sendTemporaryPassword: true,
    sendConsentEmail: true,
    businessDayClosureTime: "23:59",
    startDayOfWeek: "monday",
    timezone: "UTC",
    enableAzureAD: false,
    azureADTenantId: "",
    azureADClientId: "",
  });

  const [additionalSettings, setAdditionalSettings] = useState({
    googleSheetEmail: "",
    snapshotEmailEnabled: false,
    snapshotEmailFrequency: "daily",
    snapshotEmailRecipients: "",
    snapshotEmailTime: "09:00",
  });

  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [snapshotSending, setSnapshotSending] = useState(false);

  const [webhookSettings, setWebhookSettings] = useState({
    processWebhookEnabled: false,
    processWebhookVersion: "v2",
    processWebhookUrl: "",
    processWebhookApiKey: "",
    actionPointWebhookEnabled: false,
    actionPointTriggers: ["created", "completed"],
    actionPointAlertEmail: "",
    ticketWebhookEnabled: false,
    ticketTriggers: ["created", "closed"],
    ticketFallbackUser: "",
    assetWebhookEnabled: false,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PLATFORM_KEY(orgId));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.adminSettings) setAdminSettings((prev) => ({ ...prev, ...parsed.adminSettings }));
      if (parsed.additionalSettings) {
        setAdditionalSettings((prev) => ({ ...prev, ...parsed.additionalSettings }));
      }
      if (parsed.webhookSettings) {
        setWebhookSettings((prev) => ({ ...prev, ...parsed.webhookSettings }));
      }
    } catch {
      // ignore corrupt storage
    }
  }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      try {
        const config = await getSnapshotConfig(orgId);
        setAdditionalSettings((prev) => ({
          ...prev,
          snapshotEmailEnabled: config.enabled ?? false,
          snapshotEmailFrequency: config.frequency || "daily",
          snapshotEmailRecipients: config.recipients || "",
          snapshotEmailTime: config.timeOfDay || "09:00",
        }));
      } catch {
        // snapshot config unavailable — fall back to local values
      }
    })();
  }, [orgId]);

  const handleSaveSnapshotSettings = async () => {
    if (!orgId) return;
    setSnapshotSaving(true);
    try {
      const config = await saveSnapshotConfig(orgId, {
        enabled: additionalSettings.snapshotEmailEnabled,
        frequency: additionalSettings.snapshotEmailFrequency,
        timeOfDay: additionalSettings.snapshotEmailTime,
        recipients: additionalSettings.snapshotEmailRecipients,
      });
      setAdditionalSettings((prev) => ({
        ...prev,
        snapshotEmailEnabled: config.enabled ?? prev.snapshotEmailEnabled,
        snapshotEmailFrequency: config.frequency || prev.snapshotEmailFrequency,
        snapshotEmailRecipients: config.recipients || prev.snapshotEmailRecipients,
        snapshotEmailTime: config.timeOfDay || prev.snapshotEmailTime,
      }));
      toast.success(t('snapshotEmailSettingsSaved'));
    } catch (error: any) {
      toast.error(error?.message || t('failedToSavePlatformSettings'));
    } finally {
      setSnapshotSaving(false);
    }
  };

  const handleSendSnapshotNow = async () => {
    if (!orgId) return;
    setSnapshotSending(true);
    try {
      const result = await sendSnapshotEmail(orgId);
      toast.success(t('snapshotEmailSent', { count: result?.sentTo?.length ?? 0 }));
    } catch (error: any) {
      toast.error(error?.message || t('snapshotEmailSendFailed'));
    } finally {
      setSnapshotSending(false);
    }
  };

  const handleSendSnapshotTest = async () => {
    if (!orgId) return;
    const to = additionalSettings.snapshotEmailRecipients.trim();
    if (!to) {
      toast.error(t('snapshotTestNoRecipient'));
      return;
    }
    setSnapshotSending(true);
    try {
      const result = await sendSnapshotTestEmail(orgId, to);
      toast.success(t('snapshotTestEmailSent', { to: result?.sentTo?.[0] ?? to }));
    } catch (error: any) {
      toast.error(error?.message || t('snapshotEmailSendFailed'));
    } finally {
      setSnapshotSending(false);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem(
        PLATFORM_KEY(orgId),
        JSON.stringify({
          adminSettings,
          additionalSettings,
          webhookSettings,
          updatedAt: new Date().toISOString(),
        }),
      );
      toast.success(t('platformSettingsSaved'));
    } catch (error: any) {
      toast.error(error?.message || t('failedToSavePlatformSettings'));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('platformSettings')}</h1>
            <p className="text-muted-foreground mt-1">{t('platformSettingsDesc')}</p>
          </div>
        </div>
        <Button className="gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" />
          {t('saveChanges')}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="admin">{t('adminConfiguration')}</TabsTrigger>
          <TabsTrigger value="additional">{t('additionalConfigurations')}</TabsTrigger>
          <TabsTrigger value="webhooks">{t('webhookConfigurations')}</TabsTrigger>
        </TabsList>

        {/* Admin Configuration */}
        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {t('userCreationEmails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('sendEmailOnUserCreation')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('sendEmailOnUserCreationDesc')}
                  </p>
                </div>
                <Switch
                  checked={adminSettings.sendEmailOnUserCreation}
                  onCheckedChange={(checked) =>
                    setAdminSettings({ ...adminSettings, sendEmailOnUserCreation: checked })
                  }
                />
              </div>
              {adminSettings.sendEmailOnUserCreation && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('sendTemporaryPassword')}</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('sendTemporaryPasswordDesc')}
                      </p>
                    </div>
                    <Switch
                      checked={adminSettings.sendTemporaryPassword}
                      onCheckedChange={(checked) =>
                        setAdminSettings({ ...adminSettings, sendTemporaryPassword: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('sendConsentEmail')}</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('sendConsentEmailDesc')}
                      </p>
                    </div>
                    <Switch
                      checked={adminSettings.sendConsentEmail}
                      onCheckedChange={(checked) =>
                        setAdminSettings({ ...adminSettings, sendConsentEmail: checked })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t('businessHours')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>{t('businessDayClosureTime')}</Label>
                <Input
                  type="time"
                  value={adminSettings.businessDayClosureTime}
                  onChange={(e) =>
                    setAdminSettings({ ...adminSettings, businessDayClosureTime: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('businessDayClosureTimeDesc')}
                </p>
              </div>
              <div className="grid gap-2">
                <Label>{t('startDayOfWeek')}</Label>
                <Select
                  value={adminSettings.startDayOfWeek}
                  onValueChange={(value) =>
                    setAdminSettings({ ...adminSettings, startDayOfWeek: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">{t('monday')}</SelectItem>
                    <SelectItem value="sunday">{t('sunday')}</SelectItem>
                    <SelectItem value="saturday">{t('saturday')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t('timezoneSso')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>{t('timezone')}</Label>
                <Select
                  value={adminSettings.timezone}
                  onValueChange={(value) =>
                    setAdminSettings({ ...adminSettings, timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Asia/Kolkata">India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('enableAzureAdSso')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('enableAzureAdSsoDesc')}
                  </p>
                </div>
                <Switch
                  checked={adminSettings.enableAzureAD}
                  onCheckedChange={(checked) =>
                    setAdminSettings({ ...adminSettings, enableAzureAD: checked })
                  }
                />
              </div>
              {adminSettings.enableAzureAD && (
                <>
                  <div className="grid gap-2">
                    <Label>{t('azureAdTenantId')}</Label>
                    <Input
                      placeholder={t('enterTenantId')}
                      value={adminSettings.azureADTenantId}
                      onChange={(e) =>
                        setAdminSettings({ ...adminSettings, azureADTenantId: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('azureAdClientId')}</Label>
                    <Input
                      placeholder={t('enterClientId')}
                      value={adminSettings.azureADClientId}
                      onChange={(e) =>
                        setAdminSettings({ ...adminSettings, azureADClientId: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional Configurations */}
        <TabsContent value="additional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                {t('googleSheetIntegration')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>{t('shareGoogleSheetWith')}</Label>
                <Input
                  placeholder={t('enterEmailAddress')}
                  value={additionalSettings.googleSheetEmail}
                  onChange={(e) =>
                    setAdditionalSettings({ ...additionalSettings, googleSheetEmail: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('shareGoogleSheetWithDesc')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {t('snapshotEmails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('enableSnapshotEmails')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('enableSnapshotEmailsDesc')}
                  </p>
                </div>
                <Switch
                  checked={additionalSettings.snapshotEmailEnabled}
                  onCheckedChange={(checked) =>
                    setAdditionalSettings({ ...additionalSettings, snapshotEmailEnabled: checked })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{t('emailFrequency')}</Label>
                <Select
                  value={additionalSettings.snapshotEmailFrequency}
                  onValueChange={(value) =>
                    setAdditionalSettings({ ...additionalSettings, snapshotEmailFrequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t('daily')}</SelectItem>
                    <SelectItem value="weekly">{t('weekly')}</SelectItem>
                    <SelectItem value="monthly">{t('monthly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('sendTime')}</Label>
                <Input
                  type="time"
                  value={additionalSettings.snapshotEmailTime}
                  onChange={(e) =>
                    setAdditionalSettings({ ...additionalSettings, snapshotEmailTime: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{t('recipients')}</Label>
                <Textarea
                  placeholder={t('recipientsPlaceholder')}
                  value={additionalSettings.snapshotEmailRecipients}
                  onChange={(e) =>
                    setAdditionalSettings({ ...additionalSettings, snapshotEmailRecipients: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  disabled={snapshotSaving}
                  onClick={handleSaveSnapshotSettings}
                >
                  <Save className="w-4 h-4" />
                  {snapshotSaving ? t('saving') : t('saveSnapshotSettings')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={snapshotSending}
                  onClick={handleSendSnapshotNow}
                >
                  <Send className="w-4 h-4" />
                  {snapshotSending ? t('sending') : t('sendSnapshotNow')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={snapshotSending}
                  onClick={handleSendSnapshotTest}
                >
                  <Mail className="w-4 h-4" />
                  {snapshotSending ? t('sending') : t('sendSnapshotTest')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook Configurations */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                {t('processWebhookSettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('enableProcessWebhooks')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('enableProcessWebhooksDesc')}
                  </p>
                </div>
                <Switch
                  checked={webhookSettings.processWebhookEnabled}
                  onCheckedChange={(checked) =>
                    setWebhookSettings({ ...webhookSettings, processWebhookEnabled: checked })
                  }
                />
              </div>
              {webhookSettings.processWebhookEnabled && (
                <>
                  <div className="grid gap-2">
                    <Label>{t('webhookVersion')}</Label>
                    <Select
                      value={webhookSettings.processWebhookVersion}
                      onValueChange={(value) =>
                        setWebhookSettings({ ...webhookSettings, processWebhookVersion: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v1">v1</SelectItem>
                        <SelectItem value="v2">v2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('webhookUrl')}</Label>
                    <Input
                      placeholder={t('webhookUrlPlaceholder')}
                      value={webhookSettings.processWebhookUrl}
                      onChange={(e) =>
                        setWebhookSettings({ ...webhookSettings, processWebhookUrl: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('apiKeyOptional')}</Label>
                    <Input
                      type="password"
                      placeholder={t('enterApiKey')}
                      value={webhookSettings.processWebhookApiKey}
                      onChange={(e) =>
                        setWebhookSettings({ ...webhookSettings, processWebhookApiKey: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('actionPointWebhookSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('enableActionPointWebhooks')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('enableActionPointWebhooksDesc')}
                  </p>
                </div>
                <Switch
                  checked={webhookSettings.actionPointWebhookEnabled}
                  onCheckedChange={(checked) =>
                    setWebhookSettings({ ...webhookSettings, actionPointWebhookEnabled: checked })
                  }
                />
              </div>
              {webhookSettings.actionPointWebhookEnabled && (
                <>
                  <div className="grid gap-2">
                    <Label>{t('triggers')}</Label>
                    <div className="space-y-2">
                      {["created", "completed", "closed"].map((trigger) => (
                        <div key={trigger} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={webhookSettings.actionPointTriggers.includes(trigger)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWebhookSettings({
                                  ...webhookSettings,
                                  actionPointTriggers: [...webhookSettings.actionPointTriggers, trigger],
                                });
                              } else {
                                setWebhookSettings({
                                  ...webhookSettings,
                                  actionPointTriggers: webhookSettings.actionPointTriggers.filter(
                                    (t) => t !== trigger
                                  ),
                                });
                              }
                            }}
                          />
                          <span className="text-sm capitalize">{trigger}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('alertEmailForFailures')}</Label>
                    <Input
                      placeholder={t('enterAlertEmail')}
                      value={webhookSettings.actionPointAlertEmail}
                      onChange={(e) =>
                        setWebhookSettings({ ...webhookSettings, actionPointAlertEmail: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('ticketWebhookSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('enableTicketWebhooks')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('enableTicketWebhooksDesc')}
                  </p>
                </div>
                <Switch
                  checked={webhookSettings.ticketWebhookEnabled}
                  onCheckedChange={(checked) =>
                    setWebhookSettings({ ...webhookSettings, ticketWebhookEnabled: checked })
                  }
                />
              </div>
              {webhookSettings.ticketWebhookEnabled && (
                <>
                  <div className="grid gap-2">
                    <Label>{t('triggers')}</Label>
                    <div className="space-y-2">
                      {["created", "updated", "closed"].map((trigger) => (
                        <div key={trigger} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={webhookSettings.ticketTriggers.includes(trigger)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWebhookSettings({
                                  ...webhookSettings,
                                  ticketTriggers: [...webhookSettings.ticketTriggers, trigger],
                                });
                              } else {
                                setWebhookSettings({
                                  ...webhookSettings,
                                  ticketTriggers: webhookSettings.ticketTriggers.filter((t) => t !== trigger),
                                });
                              }
                            }}
                          />
                          <span className="text-sm capitalize">{trigger}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('fallbackUserForAssignment')}</Label>
                    <Input
                      placeholder={t('enterFallbackUserId')}
                      value={webhookSettings.ticketFallbackUser}
                      onChange={(e) =>
                        setWebhookSettings({ ...webhookSettings, ticketFallbackUser: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('assetWebhookSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('enableAssetWebhooks')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('enableAssetWebhooksDesc')}
                  </p>
                </div>
                <Switch
                  checked={webhookSettings.assetWebhookEnabled}
                  onCheckedChange={(checked) =>
                    setWebhookSettings({ ...webhookSettings, assetWebhookEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
