import { useEffect, useState } from "react";
import { Bell, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStoredUser } from "@/lib/authStorage";
import {
  fetchUserNotifications,
  getNotificationTypeLabel,
  markNotificationRead,
  type AppNotification,
} from "@/lib/notificationApi";

export default function NotificationBellMenu() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const userId = String(getStoredUser().userId || getStoredUser().id || "");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  const loadNotifications = async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    const items = await fetchUserNotifications(userId);
    setNotifications(items);
  };

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 60000);
    return () => window.clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (open) void loadNotifications();
  }, [open, userId]);

  const unreadCount = notifications.filter((item) => item.status !== "READ").length;

  const handleOpenNotification = async (notification: AppNotification) => {
    if (notification.status !== "READ") {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, status: "READ" } : item,
        ),
      );
    }
    const link = String(notification.data?.link || "");
    if (link) {
      navigate(link);
      setOpen(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 relative text-white/90 hover:bg-white/10 hover:text-white"
          title={t("notifications") || "Notifications"}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("notifications") || "Notifications"}</span>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount}</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!userId ? (
          <DropdownMenuItem disabled>
            {t("loginToManageNotifications") || "Sign in to view notifications"}
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            {t("noNotificationsYet") || "No notifications yet"}
          </DropdownMenuItem>
        ) : (
          notifications.slice(0, 8).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-1 py-2 cursor-pointer"
              onClick={() => void handleOpenNotification(notification)}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="font-medium text-sm">{notification.title}</span>
                {notification.status !== "READ" && (
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
              </div>
              <span className="text-xs text-muted-foreground line-clamp-2">
                {notification.content}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {getNotificationTypeLabel(notification.type, t)}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/notifications")} className="gap-2">
          <Settings className="w-4 h-4" />
          {t("notificationSettings") || "Notification settings"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
