import { Bell, CheckCircle, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStoredUser } from "@/lib/authStorage";
import { useState, useEffect, useCallback } from "react";
import {
  fetchUserNotifications,
  markNotificationRead,
  getSimplePreferences,
  updateSimplePreferences,
  type AppNotification,
  type SimplePreferences,
  getNotificationTypeLabel,
  CHANNEL_INVITE_TYPE,
} from "@/lib/notificationApi";
import { joinChannel, declineChannel } from "@/lib/communicationApi";
import { useLocation } from "wouter";

export default function Notifications() {
  const { t } = useLanguage();
  const user = getStoredUser();
  const userId = String(user.userId || user.id || "");
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [prefs, setPrefs] = useState<SimplePreferences>({
    enabled: true,
    process: true,
    actionPoint: true,
    ticket: true,
    learning: true,
  });

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [fetchedPrefs, fetchedNotifications] = await Promise.all([
      getSimplePreferences(userId),
      fetchUserNotifications(userId),
    ]);
    setPrefs(fetchedPrefs);
    setNotifications(fetchedNotifications);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (key: keyof SimplePreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    await updateSimplePreferences(userId, updated);
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (notification.status !== "READ") {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, status: "READ" } : n,
        ),
      );
    }
    const link = (notification.data as any)?.link;
    if (link) setLocation(link);
  };

  const respondInvite = async (notification: AppNotification, accept: boolean) => {
    const conversationId = String(notification.data?.conversationId || "");
    try {
      if (accept) await joinChannel(conversationId);
      else await declineChannel(conversationId);
    } catch {
      /* keep notification so user can retry */
    }
    await markNotificationRead(notification.id).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    if (accept && conversationId) setLocation(`/communication?conv=${conversationId}`);
  };

  const unreadCount = notifications.filter((n) => n.status !== "READ").length;

  if (!userId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t("notifications") || "Notifications"}</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-muted-foreground">
              {t("loginToManageNotifications") || "Sign in to manage your notifications."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t("notifications") || "Notifications"}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : t("noUnreadNotifications") || "No unread notifications"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("notificationPreferences") || "Notification Preferences"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="master-toggle" className="font-medium">{t("enableNotifications") || "Enable Notifications"}</Label>
              <p className="text-xs text-muted-foreground">{t("masterToggleDescription") || "Master toggle for all notifications"}</p>
            </div>
            <Switch id="master-toggle" checked={prefs.enabled} onCheckedChange={() => handleToggle("enabled")} />
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("notificationTypes") || "Notification Types"}</p>

            <div className="flex items-center justify-between">
              <Label htmlFor="process-toggle" className="text-sm">{t("process") || "Process"}</Label>
              <Switch id="process-toggle" checked={prefs.process} onCheckedChange={() => handleToggle("process")} disabled={!prefs.enabled} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="actionpoint-toggle" className="text-sm">{t("actionPoint") || "Action Point"}</Label>
              <Switch id="actionpoint-toggle" checked={prefs.actionPoint} onCheckedChange={() => handleToggle("actionPoint")} disabled={!prefs.enabled} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ticket-toggle" className="text-sm">{t("ticket") || "Ticket"}</Label>
              <Switch id="ticket-toggle" checked={prefs.ticket} onCheckedChange={() => handleToggle("ticket")} disabled={!prefs.enabled} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="learning-toggle" className="text-sm">{t("learning") || "Learning"}</Label>
              <Switch id="learning-toggle" checked={prefs.learning} onCheckedChange={() => handleToggle("learning")} disabled={!prefs.enabled} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("recentNotifications") || "Recent Notifications"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-sm">
              {t("noNotifications") || "No notifications yet"}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    notification.type === CHANNEL_INVITE_TYPE ? "cursor-default" : "cursor-pointer hover:bg-muted/50"
                  } transition-colors ${
                    notification.status !== "READ" ? "bg-muted/30 border-l-2 border-primary" : ""
                  }`}
                  onClick={() => {
                    if (notification.type !== CHANNEL_INVITE_TYPE) handleNotificationClick(notification);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      {notification.status !== "READ" && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    {notification.content && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.content}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {getNotificationTypeLabel(notification.type || "")}
                      </span>
                      {notification.createdAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {notification.type === CHANNEL_INVITE_TYPE && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            void respondInvite(notification, true);
                          }}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          {t("accept") || "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            void respondInvite(notification, false);
                          }}
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          {t("decline") || "Decline"}
                        </Button>
                      </div>
                    )}
                  </div>
                  {notification.status !== "READ" && (
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
