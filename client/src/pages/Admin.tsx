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
import { formatNow as formatNowInTimezone } from "@/lib/formatDateTime";
import { TIMEZONE_OPTIONS } from "@/lib/timezones";
import { getStoredTimezone } from "@/lib/timezoneStorage";

export default function Admin() {
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
    toast.success(`Timezone updated to ${TIMEZONE_OPTIONS.find((tz) => tz.value === selectedTimezone)?.label ?? selectedTimezone}`);
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
              Back
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Go back to previous page</p>
          </TooltipContent>
        </Tooltip>
        <Cog className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin Center</h1>
          <p className="text-muted-foreground mt-1">System administration and configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Configuration */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
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
                    Current time: {liveTime}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Input
                    id="language"
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance">Maintenance Mode</Label>
                  <Switch id="maintenance" />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configure system settings</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Maintenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <Switch id="maintenance-mode" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="debug-mode">Debug Mode</Label>
                  <Switch id="debug-mode" />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configure maintenance settings</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Database</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full">Backup Database</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Backup database</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full">Optimize Database</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Optimize database</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="w-full">View Logs</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View database logs</p>
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Manage database operations</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CPU Usage</span>
                    <span className="text-sm font-medium">0%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">0%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2"></div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>View system health metrics</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex justify-end gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cancel changes</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save admin settings</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
