import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Save, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function Security() {
  const [, navigate] = useLocation();

  const handleGoBack = () => {
    window.history.back();
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
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground mt-1">Manage security and access control</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
                  <Switch id="two-factor-auth" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password-policy">Enforce Password Policy</Label>
                  <Switch id="password-policy" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="session-lock">Session Lock</Label>
                  <Switch id="session-lock" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configure authentication settings</p>
          </TooltipContent>
        </Tooltip>

        {/* Access Control */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="role-based">Role-Based Access Control</Label>
                  <Switch id="role-based" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                  <Switch id="ip-whitelist" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="api-keys">API Key Management</Label>
                  <Switch id="api-keys" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configure access control settings</p>
          </TooltipContent>
        </Tooltip>

        {/* Data Protection */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Data Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="encryption">Data Encryption</Label>
                  <Switch id="encryption" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="backup">Automatic Backup</Label>
                  <Switch id="backup" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="audit-logs">Audit Logging</Label>
                  <Switch id="audit-logs" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configure data protection settings</p>
          </TooltipContent>
        </Tooltip>

        {/* Compliance */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gdpr">GDPR Compliance</Label>
                  <Switch id="gdpr" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="data-retention">Data Retention Policy</Label>
                  <Switch id="data-retention" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configure compliance settings</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex justify-end gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cancel changes</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save security settings</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
