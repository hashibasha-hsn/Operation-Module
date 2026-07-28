import { Bell, Settings } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStoredUser } from "@/lib/authStorage";
import NotificationPreferencesSummary from "@/components/NotificationPreferencesSummary";
import NotificationSettingsPanel from "@/components/NotificationSettingsPanel";
import { useState } from "react";
import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettingsForm } from "@/lib/notificationApi";

export default function Notifications() {
  const { t } = useLanguage();
  const user = getStoredUser();
  const userId = String(user.userId || user.id || "");
  const [previewSettings, setPreviewSettings] = useState<NotificationSettingsForm>({
    ...DEFAULT_NOTIFICATION_SETTINGS,
  });

  if (!userId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t("notificationSettings") || "Notification Settings"}</h1>
            <p className="text-muted-foreground mt-1">
              {t("manageNotificationPreferences") || "Manage notification preferences"}
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-muted-foreground">
              {t("loginToManageNotifications") || "Sign in to manage your notification preferences."}
            </p>
            <Link href="/login">
              <Button>{t("signIn") || "Sign in"}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Bell className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t("notificationSettings") || "Notification Settings"}</h1>
            <p className="text-muted-foreground mt-1">
              {t("manageNotificationPreferences") || "Manage notification preferences"}
            </p>
          </div>
        </div>
        <Link href="/profile-settings?tab=notifications">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            {t("profileSettings") || "Profile Settings"}
          </Button>
        </Link>
      </div>

      <NotificationPreferencesSummary settings={previewSettings} />

      <NotificationSettingsPanel
        userId={userId}
        variant="page"
        idPrefix="page"
        onSettingsChange={setPreviewSettings}
      />
    </div>
  );
}
