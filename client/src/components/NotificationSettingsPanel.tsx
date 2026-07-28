import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2, Mail, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStoredUser } from "@/lib/authStorage";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getEmailFrequencyLabel,
  loadNotificationSettings,
  saveNotificationSettings,
  type EmailFrequency,
  type NotificationSettingsForm,
} from "@/lib/notificationApi";

type Props = {
  userId: string;
  /** embedded = inside profile card; page = full grid layout */
  variant?: "embedded" | "page";
  idPrefix?: string;
  onSettingsChange?: (settings: NotificationSettingsForm) => void;
};

export default function NotificationSettingsPanel({
  userId,
  variant = "page",
  idPrefix = "notif",
  onSettingsChange,
}: Props) {
  const { t } = useLanguage();
  const userEmail = String(getStoredUser().email || "");
  const [settings, setSettings] = useState<NotificationSettingsForm>({
    ...DEFAULT_NOTIFICATION_SETTINGS,
  });
  const [savedSettings, setSavedSettings] = useState<NotificationSettingsForm>({
    ...DEFAULT_NOTIFICATION_SETTINGS,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const applySettings = (next: NotificationSettingsForm) => {
    setSettings(next);
    onSettingsChange?.(next);
  };

  const hasUnsavedChanges =
    JSON.stringify(settings) !== JSON.stringify(savedSettings);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const loaded = await loadNotificationSettings(userId);
        applySettings(loaded);
        setSavedSettings(loaded);
      } catch {
        toast.error(t("failedToConnectToServer") || "Failed to connect to server");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, t]);

  const update = (patch: Partial<NotificationSettingsForm>) => {
    applySettings({ ...settings, ...patch });
  };

  const handleEmailFrequencyChange = (value: EmailFrequency) => {
    update({
      emailFrequency: value,
      weeklyDigest: value === "weekly",
      emailEnabled: value !== "off",
    });
  };

  const handleMasterEmailToggle = (checked: boolean) => {
    update({
      emailEnabled: checked,
      emailFrequency: checked
        ? settings.emailFrequency === "off"
          ? "instant"
          : settings.emailFrequency
        : "off",
    });
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error(t("pleaseLoginToChangePassword") || "You must be logged in");
      return;
    }
    setSaving(true);
    try {
      const saved = await saveNotificationSettings(userId, settings);
      if (!saved.length) {
        toast.error(t("failedToConnectToServer") || "Failed to connect to server");
        return;
      }
      const reloaded = await loadNotificationSettings(userId);
      applySettings(reloaded);
      setSavedSettings(reloaded);
      toast.success(t("notificationSettingsSaved") || "Notification settings saved");
    } catch {
      toast.error(t("failedToConnectToServer") || "Failed to connect to server");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    void loadNotificationSettings(userId).then((loaded) => {
      applySettings(loaded);
      setSavedSettings(loaded);
    });
  };

  if (!userId) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t("loginToManageNotifications") || "Sign in to manage your notification preferences."}
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t("loading") || "Loading..."}
      </div>
    );
  }

  const gridClass =
    variant === "page" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-6";

  return (
    <div className="space-y-6">
      {hasUnsavedChanges && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-950">
            {t("unsavedNotificationChanges") || "You have unsaved notification preference changes."}
          </p>
          <Badge variant="outline">{t("unsavedChanges") || "Unsaved"}</Badge>
        </div>
      )}
      <div className={gridClass}>
        <Card className={variant === "page" ? "lg:col-span-2" : undefined}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-sky-600" />
              {t("emailNotifications") || "Email Notifications"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor={`${idPrefix}-email-enabled`}>
                  {t("enableEmailNotifications") || "Enable email notifications"}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("emailDeliveryAddress") || "Delivery address"}:{" "}
                  <span className="font-medium text-foreground">
                    {userEmail || t("noEmailOnProfile") || "Add email in your profile"}
                  </span>
                </p>
              </div>
              <Switch
                id={`${idPrefix}-email-enabled`}
                checked={settings.emailEnabled}
                onCheckedChange={handleMasterEmailToggle}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("emailFrequency") || "Email frequency"}</Label>
              <Select
                value={settings.emailEnabled ? settings.emailFrequency : "off"}
                onValueChange={(value) => handleEmailFrequencyChange(value as EmailFrequency)}
                disabled={!settings.emailEnabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">{t("instantAlerts") || "Instant"}</SelectItem>
                  <SelectItem value="daily">{t("dailyDigest") || "Daily digest"}</SelectItem>
                  <SelectItem value="weekly">{t("weeklyDigest") || "Weekly digest"}</SelectItem>
                  <SelectItem value="urgent_only">{t("urgentOnly") || "Urgent only"}</SelectItem>
                  <SelectItem value="off">{t("off") || "Off"}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {settings.emailEnabled
                  ? `${t("currentEmailFrequency") || "Current"}: ${getEmailFrequencyLabel(settings.emailFrequency)}. ${
                      t("emailFrequencyHint") ||
                      "Daily and weekly digests batch non-urgent emails."
                    }`
                  : t("emailNotificationsDisabled") || "Email notifications are turned off."}
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <Label>{t("emailNotificationTypes") || "Email notification types"}</Label>
              <p className="text-xs text-muted-foreground">
                {t("emailNotificationTypesHint") ||
                  "Choose which updates are sent to your email. In-app settings are configured separately below."}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <Label>{t("taskReminders") || "Task reminders"}</Label>
                  <Switch
                    checked={settings.emailTaskReminders}
                    disabled={!settings.emailEnabled}
                    onCheckedChange={(checked) => update({ emailTaskReminders: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <Label>{t("deadlineAlerts") || "Deadline alerts"}</Label>
                  <Switch
                    checked={settings.emailDeadlineAlerts}
                    disabled={!settings.emailEnabled}
                    onCheckedChange={(checked) => update({ emailDeadlineAlerts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <Label>{t("mentions") || "Mentions"}</Label>
                  <Switch
                    checked={settings.emailMentions}
                    disabled={!settings.emailEnabled}
                    onCheckedChange={(checked) => update({ emailMentions: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <Label>{t("weeklyDigest") || "Weekly digest"}</Label>
                  <Switch
                    checked={settings.weeklyDigest}
                    disabled={!settings.emailEnabled}
                    onCheckedChange={(checked) =>
                      update({
                        weeklyDigest: checked,
                        emailFrequency: checked
                          ? "weekly"
                          : settings.emailFrequency === "weekly"
                            ? "instant"
                            : settings.emailFrequency,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("pushNotifications") || "Push Notifications"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}-push-enabled`}>
                {t("pushNotifications") || "Push Notifications"}
              </Label>
              <Switch
                id={`${idPrefix}-push-enabled`}
                checked={settings.pushEnabled}
                onCheckedChange={(checked) => update({ pushEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}-push-desktop`}>
                {t("desktopAlerts") || "Desktop alerts"}
              </Label>
              <Switch
                id={`${idPrefix}-push-desktop`}
                checked={settings.pushDesktopEnabled}
                disabled={!settings.pushEnabled}
                onCheckedChange={(checked) => update({ pushDesktopEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}-push-mobile`}>
                {t("mobileAlerts") || "Mobile alerts"}
              </Label>
              <Switch
                id={`${idPrefix}-push-mobile`}
                checked={settings.pushMobileEnabled}
                disabled={!settings.pushEnabled}
                onCheckedChange={(checked) => update({ pushMobileEnabled: checked })}
              />
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <Label>{t("pushNotificationTypes") || "Push notification types"}</Label>
              <p className="text-xs text-muted-foreground">
                {t("pushNotificationTypesHint") ||
                  "Choose which updates trigger push alerts on your devices."}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <Label>{t("taskReminders") || "Task reminders"}</Label>
                  <Switch
                    checked={settings.pushTaskReminders}
                    disabled={!settings.pushEnabled}
                    onCheckedChange={(checked) => update({ pushTaskReminders: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <Label>{t("deadlineAlerts") || "Deadline alerts"}</Label>
                  <Switch
                    checked={settings.pushDeadlineAlerts}
                    disabled={!settings.pushEnabled}
                    onCheckedChange={(checked) => update({ pushDeadlineAlerts: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <Label>{t("mentions") || "Mentions"}</Label>
                  <Switch
                    checked={settings.pushMentions}
                    disabled={!settings.pushEnabled}
                    onCheckedChange={(checked) => update({ pushMentions: checked })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("smsNotifications") || "SMS Notifications"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}-sms-enabled`}>
                {t("smsNotifications") || "SMS Notifications"}
              </Label>
              <Switch
                id={`${idPrefix}-sms-enabled`}
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => update({ smsEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}-sms-urgent`}>
                {t("urgentMessagesOnly") || "Urgent messages only"}
              </Label>
              <Switch
                id={`${idPrefix}-sms-urgent`}
                checked={settings.smsUrgentOnly}
                disabled={!settings.smsEnabled}
                onCheckedChange={(checked) => update({ smsUrgentOnly: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("inAppNotifications") || "In-App Notifications"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor={`${idPrefix}-inapp-enabled`}>
                  {t("inAppNotifications") || "In-App Notifications"}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("inAppNotificationsHint") || "Show alerts inside the application"}
                </p>
              </div>
              <Switch
                id={`${idPrefix}-inapp-enabled`}
                checked={settings.inAppEnabled}
                onCheckedChange={(checked) => update({ inAppEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}-inapp-sound`}>
                {t("soundAlerts") || "Sound alerts"}
              </Label>
              <Switch
                id={`${idPrefix}-inapp-sound`}
                checked={settings.inAppSoundEnabled}
                disabled={!settings.inAppEnabled}
                onCheckedChange={(checked) => update({ inAppSoundEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={variant === "page" ? "lg:col-span-2" : undefined}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-600" />
              {t("learningNotifications") || "Learning Notifications"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {t("learningNotificationsHint") ||
                "Control alerts for course assignments and certificate issuance when you complete learning."}
            </p>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-3 rounded-lg border p-3">
                <Label>{t("learningAssignments") || "Course & assessment assignments"}</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <Label>{t("inAppNotifications") || "In-app"}</Label>
                    <Switch
                      checked={settings.learningAssignments}
                      disabled={!settings.inAppEnabled}
                      onCheckedChange={(checked) => update({ learningAssignments: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <Label>{t("emailNotifications") || "Email"}</Label>
                    <Switch
                      checked={settings.emailLearningAssignments}
                      disabled={!settings.emailEnabled}
                      onCheckedChange={(checked) => update({ emailLearningAssignments: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <Label>{t("pushNotifications") || "Push"}</Label>
                    <Switch
                      checked={settings.pushLearningAssignments}
                      disabled={!settings.pushEnabled}
                      onCheckedChange={(checked) => update({ pushLearningAssignments: checked })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border p-3">
                <Label>{t("certificateIssued") || "Certificate issuance"}</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <Label>{t("inAppNotifications") || "In-app"}</Label>
                    <Switch
                      checked={settings.certificateIssued}
                      disabled={!settings.inAppEnabled}
                      onCheckedChange={(checked) => update({ certificateIssued: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <Label>{t("emailNotifications") || "Email"}</Label>
                    <Switch
                      checked={settings.emailCertificateIssued}
                      disabled={!settings.emailEnabled}
                      onCheckedChange={(checked) => update({ emailCertificateIssued: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <Label>{t("pushNotifications") || "Push"}</Label>
                    <Switch
                      checked={settings.pushCertificateIssued}
                      disabled={!settings.pushEnabled}
                      onCheckedChange={(checked) => update({ pushCertificateIssued: checked })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border p-3">
                <Label>{t("courseCompletionReminders") || "Course completion reminders"}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("courseCompletionRemindersHint") ||
                    "Remind you to finish assigned courses before the due date or when overdue."}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <Label>{t("inAppNotifications") || "In-app"}</Label>
                    <Switch
                      checked={settings.courseCompletionReminders}
                      disabled={!settings.inAppEnabled}
                      onCheckedChange={(checked) => update({ courseCompletionReminders: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <Label>{t("emailNotifications") || "Email"}</Label>
                    <Switch
                      checked={settings.emailCourseCompletionReminders}
                      disabled={!settings.emailEnabled}
                      onCheckedChange={(checked) =>
                        update({ emailCourseCompletionReminders: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <Label>{t("pushNotifications") || "Push"}</Label>
                    <Switch
                      checked={settings.pushCourseCompletionReminders}
                      disabled={!settings.pushEnabled}
                      onCheckedChange={(checked) => update({ pushCourseCompletionReminders: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={variant === "page" ? "lg:col-span-2" : undefined}>
          <CardHeader>
            <CardTitle>{t("inAppNotificationTypes") || "In-app notification types"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <p className="text-xs text-muted-foreground sm:col-span-2">
              {settings.inAppEnabled
                ? t("inAppNotificationTypesHint") ||
                  "Turn off specific in-app alerts while keeping others enabled."
                : t("inAppNotificationsDisabled") ||
                  "In-app notifications are turned off. Enable them above to configure types."}
            </p>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>{t("taskReminders") || "Task reminders"}</Label>
              <Switch
                checked={settings.taskReminders}
                disabled={!settings.inAppEnabled}
                onCheckedChange={(checked) => update({ taskReminders: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>{t("deadlineAlerts") || "Deadline alerts"}</Label>
              <Switch
                checked={settings.deadlineAlerts}
                disabled={!settings.inAppEnabled}
                onCheckedChange={(checked) => update({ deadlineAlerts: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>{t("mentions") || "Mentions"}</Label>
              <Switch
                checked={settings.mentions}
                disabled={!settings.inAppEnabled}
                onCheckedChange={(checked) => update({ mentions: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleCancel}>
          {t("cancel") || "Cancel"}
        </Button>
        <Button className="gap-2" onClick={() => void handleSave()} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t("savePreferences") || "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
