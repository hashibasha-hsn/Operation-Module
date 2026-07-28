import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getEmailFrequencyLabel,
  type NotificationSettingsForm,
} from "@/lib/notificationApi";

type Props = {
  settings: NotificationSettingsForm;
};

function enabledTypes(
  settings: NotificationSettingsForm,
  channel: "email" | "push" | "inApp",
): string[] {
  const items: Array<[string, boolean]> = [
    ["taskReminders", channel === "email" ? settings.emailTaskReminders : channel === "push" ? settings.pushTaskReminders : settings.taskReminders],
    ["deadlineAlerts", channel === "email" ? settings.emailDeadlineAlerts : channel === "push" ? settings.pushDeadlineAlerts : settings.deadlineAlerts],
    ["mentions", channel === "email" ? settings.emailMentions : channel === "push" ? settings.pushMentions : settings.mentions],
  ];
  if (channel === "email" && settings.weeklyDigest) {
    items.push(["weeklyDigest", true]);
  }
  if (channel === "email" && settings.emailLearningAssignments) {
    items.push(["learningAssignments", true]);
  }
  if (channel === "email" && settings.emailCertificateIssued) {
    items.push(["certificateIssued", true]);
  }
  if (channel === "inApp" && settings.learningAssignments) {
    items.push(["learningAssignments", true]);
  }
  if (channel === "inApp" && settings.certificateIssued) {
    items.push(["certificateIssued", true]);
  }
  if (channel === "push" && settings.pushLearningAssignments) {
    items.push(["learningAssignments", true]);
  }
  if (channel === "push" && settings.pushCertificateIssued) {
    items.push(["certificateIssued", true]);
  }
  if (channel === "email" && settings.emailCourseCompletionReminders) {
    items.push(["courseCompletionReminders", true]);
  }
  if (channel === "inApp" && settings.courseCompletionReminders) {
    items.push(["courseCompletionReminders", true]);
  }
  if (channel === "push" && settings.pushCourseCompletionReminders) {
    items.push(["courseCompletionReminders", true]);
  }
  return items.filter(([, on]) => on).map(([key]) => key);
}

export default function NotificationPreferencesSummary({ settings }: Props) {
  const { t } = useLanguage();

  const channels = [
    {
      key: "email",
      label: t("emailNotifications") || "Email",
      icon: Mail,
      enabled: settings.emailEnabled,
      detail: settings.emailEnabled
        ? getEmailFrequencyLabel(settings.emailFrequency)
        : t("off") || "Off",
      types: enabledTypes(settings, "email"),
    },
    {
      key: "push",
      label: t("pushNotifications") || "Push",
      icon: Smartphone,
      enabled: settings.pushEnabled,
      detail: settings.pushEnabled ? t("enabled") || "Enabled" : t("off") || "Off",
      types: enabledTypes(settings, "push"),
    },
    {
      key: "inApp",
      label: t("inAppNotifications") || "In-app",
      icon: Bell,
      enabled: settings.inAppEnabled,
      detail: settings.inAppEnabled ? t("enabled") || "Enabled" : t("off") || "Off",
      types: enabledTypes(settings, "inApp"),
    },
    {
      key: "sms",
      label: t("smsNotifications") || "SMS",
      icon: MessageSquare,
      enabled: settings.smsEnabled,
      detail: settings.smsEnabled
        ? settings.smsUrgentOnly
          ? t("urgentOnly") || "Urgent only"
          : t("enabled") || "Enabled"
        : t("off") || "Off",
      types: [],
    },
  ];

  const typeLabel = (key: string) => {
    if (key === "taskReminders") return t("taskReminders") || "Task reminders";
    if (key === "deadlineAlerts") return t("deadlineAlerts") || "Deadline alerts";
    if (key === "mentions") return t("mentions") || "Mentions";
    if (key === "weeklyDigest") return t("weeklyDigest") || "Weekly digest";
    if (key === "learningAssignments") return t("learningAssignments") || "Learning assignments";
    if (key === "certificateIssued") return t("certificateIssued") || "Certificate issuance";
    if (key === "courseCompletionReminders")
      return t("courseCompletionReminders") || "Course completion reminders";
    return key;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {t("notificationPreferencesSummary") || "Your notification preferences"}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <div key={channel.key} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{channel.label}</span>
                </div>
                <Badge variant={channel.enabled ? "default" : "secondary"}>
                  {channel.enabled ? t("on") || "On" : t("off") || "Off"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{channel.detail}</p>
              {channel.types.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {channel.types.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {typeLabel(type)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
