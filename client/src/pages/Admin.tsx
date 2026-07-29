import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Save, Cog } from "lucide-react";
import { toast } from "sonner";
import { useTimezone } from "@/contexts/TimezoneContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatNow as formatNowInTimezone } from "@/lib/formatDateTime";
import { TIMEZONE_OPTIONS } from "@/lib/timezones";
import { getStoredTimezone } from "@/lib/timezoneStorage";

export default function Admin() {
  const { t } = useLanguage();
  const { timezone, setTimezone } = useTimezone();
  const [selectedTimezone, setSelectedTimezone] = useState(timezone);
  const [defaultLanguage, setDefaultLanguage] = useState("English");
  const [liveTime, setLiveTime] = useState(() => formatNowInTimezone(timezone));

  useEffect(() => {
    setSelectedTimezone(timezone);
  }, [timezone]);

  useEffect(() => {
    setLiveTime(formatNowInTimezone(selectedTimezone));
    const timer = window.setInterval(
      () => setLiveTime(formatNowInTimezone(selectedTimezone)),
      30_000,
    );
    return () => window.clearInterval(timer);
  }, [selectedTimezone]);

  const handleGoBack = () => {
    window.history.back();
  };

  const handleSave = () => {
    setTimezone(selectedTimezone);
    toast.success(t('timezoneUpdatedTo').replace('{{timezone}}', TIMEZONE_OPTIONS.find((tz) => tz.value === selectedTimezone)?.label ?? selectedTimezone));
  };

  const handleCancel = () => {
    setSelectedTimezone(getStoredTimezone());
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={handleGoBack}>
              {t('back')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('goBackToPreviousPage')}</p>
          </TooltipContent>
        </Tooltip>
        <Cog className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t('adminCenter')}</h1>
          <p className="text-muted-foreground mt-1">{t('adminSubtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('systemConfiguration')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('timezone')}</Label>
                  <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder={t('selectTimezone')} />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('currentTime').replace('{{time}}', liveTime)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">{t('defaultLanguage')}</Label>
                  <Input
                    id="language"
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance">{t('maintenanceMode')}</Label>
                  <Switch id="maintenance" />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('configureSystemSettings')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('maintenance')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance-mode">{t('maintenanceMode')}</Label>
                  <Switch id="maintenance-mode" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="debug-mode">{t('debugMode')}</Label>
                  <Switch id="debug-mode" />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('configureMaintenanceSettings')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('database')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full">{t('backupDatabase')}</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('backupDatabaseTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full">{t('optimizeDatabase')}</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('optimizeDatabaseTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full">{t('viewLogs')}</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('viewDatabaseLogs')}</p>
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('manageDatabaseOperations')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('systemHealth')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('cpuUsage')}</span>
                    <span className="text-sm font-medium">0%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('memoryUsage')}</span>
                    <span className="text-sm font-medium">0%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2"></div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('viewSystemHealthMetrics')}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex justify-end gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={handleCancel}>{t('cancel')}</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('cancelChanges')}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {t('saveChanges')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('saveAdminSettings')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
