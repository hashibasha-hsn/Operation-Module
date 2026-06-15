import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Save, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Notifications() {
  const { t } = useLanguage();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t('notificationSettings')}</h1>
          <p className="text-muted-foreground mt-1">{t('manageNotificationPreferences')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('emailNotifications')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-enabled">{t('emailNotifications')}</Label>
                  <Switch id="email-enabled" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-daily">{t('dailyDigest')}</Label>
                  <Switch id="email-daily" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-urgent">{t('urgentOnly')}</Label>
                  <Switch id="email-urgent" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('configureEmailNotificationSettings')}</p>
          </TooltipContent>
        </Tooltip>

        {/* Push Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('pushNotifications')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-enabled">{t('pushNotifications')}</Label>
                  <Switch id="push-enabled" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-desktop">{t('desktopAlerts')}</Label>
                  <Switch id="push-desktop" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-mobile">{t('mobileAlerts')}</Label>
                  <Switch id="push-mobile" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('configurePushNotificationSettings')}</p>
          </TooltipContent>
        </Tooltip>

        {/* SMS Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('smsNotifications')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-enabled">{t('smsNotifications')}</Label>
                  <Switch id="sms-enabled" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-urgent">{t('urgentMessagesOnly')}</Label>
                  <Switch id="sms-urgent" />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('configureSmsNotificationSettings')}</p>
          </TooltipContent>
        </Tooltip>

        {/* In-App Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('inAppNotifications')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="inapp-enabled">{t('inAppNotifications')}</Label>
                  <Switch id="inapp-enabled" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="inapp-sound">{t('soundAlerts')}</Label>
                  <Switch id="inapp-sound" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('configureInAppNotificationSettings')}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex justify-end gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">{t('cancel')}</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('cancelChanges')}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              {t('saveSettings')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('saveNotificationSettings')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
