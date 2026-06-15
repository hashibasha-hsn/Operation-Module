import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Lock, Key, UserCheck, AlertTriangle, Save } from "lucide-react";

export default function SecuritySettings() {
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    passwordExpiry: 90,
    minPasswordLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    ipWhitelist: "",
    enforcePasswordHistory: true,
    passwordHistoryCount: 5,
  });

  const handleSave = () => {
    console.log("Saving security settings:", settings);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Security Settings</h1>
            <p className="text-muted-foreground mt-1">Configure platform-wide security policies</p>
          </div>
        </div>
        <Button className="gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      {/* Authentication Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Authentication Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Two-Factor Authentication (2FA)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Require 2FA for all users during login
              </p>
            </div>
            <Switch
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, twoFactorAuth: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Session Timeout (minutes)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Auto-logout after inactivity
              </p>
            </div>
            <Select
              value={settings.sessionTimeout.toString()}
              onValueChange={(value) =>
                setSettings({ ...settings, sessionTimeout: parseInt(value) })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Maximum Login Attempts</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Lock account after failed attempts
              </p>
            </div>
            <Select
              value={settings.maxLoginAttempts.toString()}
              onValueChange={(value) =>
                setSettings({ ...settings, maxLoginAttempts: parseInt(value) })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 attempts</SelectItem>
                <SelectItem value="5">5 attempts</SelectItem>
                <SelectItem value="10">10 attempts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Password Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Password Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Password Expiry (days)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Force password change after
              </p>
            </div>
            <Select
              value={settings.passwordExpiry.toString()}
              onValueChange={(value) =>
                setSettings({ ...settings, passwordExpiry: parseInt(value) })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="0">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Minimum Password Length</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Minimum characters required
              </p>
            </div>
            <Input
              type="number"
              value={settings.minPasswordLength}
              onChange={(e) =>
                setSettings({ ...settings, minPasswordLength: parseInt(e.target.value) })
              }
              className="w-20"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Special Characters</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Must include !@#$%^&*
              </p>
            </div>
            <Switch
              checked={settings.requireSpecialChars}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requireSpecialChars: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Numbers</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Must include at least one number
              </p>
            </div>
            <Switch
              checked={settings.requireNumbers}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requireNumbers: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Uppercase Letters</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Must include at least one uppercase letter
              </p>
            </div>
            <Switch
              checked={settings.requireUppercase}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requireUppercase: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enforce Password History</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Prevent reuse of recent passwords
              </p>
            </div>
            <Switch
              checked={settings.enforcePasswordHistory}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enforcePasswordHistory: checked })
              }
            />
          </div>

          {settings.enforcePasswordHistory && (
            <div className="flex items-center justify-between">
              <div>
                <Label>Password History Count</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Number of passwords to remember
                </p>
              </div>
              <Select
                value={settings.passwordHistoryCount.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, passwordHistoryCount: parseInt(value) })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3</SelectItem>
                  <SelectItem value="5">Last 5</SelectItem>
                  <SelectItem value="10">Last 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Access Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label>IP Whitelist (optional)</Label>
            <Input
              placeholder="Enter allowed IP addresses (comma-separated)"
              value={settings.ipWhitelist}
              onChange={(e) =>
                setSettings({ ...settings, ipWhitelist: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to allow access from any IP
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Security Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Alert on Failed Login Attempts</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Notify admins of suspicious activity
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Alert on Password Changes</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Track password modifications
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Alert on New User Creation</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor user account additions
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
