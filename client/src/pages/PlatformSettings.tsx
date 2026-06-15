import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Mail,
  Clock,
  Calendar,
  Globe,
  Shield,
  FileSpreadsheet,
  Bell,
  Webhook,
  Save,
} from "lucide-react";

export default function PlatformSettings() {
  const [activeTab, setActiveTab] = useState("admin");

  const [adminSettings, setAdminSettings] = useState({
    sendEmailOnUserCreation: true,
    sendTemporaryPassword: true,
    sendConsentEmail: true,
    businessDayClosureTime: "23:59",
    startDayOfWeek: "monday",
    timezone: "UTC",
    enableAzureAD: false,
    azureADTenantId: "",
    azureADClientId: "",
  });

  const [additionalSettings, setAdditionalSettings] = useState({
    googleSheetEmail: "",
    snapshotEmailFrequency: "daily",
    snapshotEmailRecipients: "",
    snapshotEmailTime: "09:00",
  });

  const [webhookSettings, setWebhookSettings] = useState({
    processWebhookEnabled: false,
    processWebhookVersion: "v2",
    processWebhookUrl: "",
    processWebhookApiKey: "",
    actionPointWebhookEnabled: false,
    actionPointTriggers: ["created", "completed"],
    actionPointAlertEmail: "",
    ticketWebhookEnabled: false,
    ticketTriggers: ["created", "closed"],
    ticketFallbackUser: "",
    assetWebhookEnabled: false,
  });

  const handleSave = () => {
    console.log("Saving platform settings");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Platform Settings</h1>
            <p className="text-muted-foreground mt-1">Configure platform-wide operating rules</p>
          </div>
        </div>
        <Button className="gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="admin">Admin Configuration</TabsTrigger>
          <TabsTrigger value="additional">Additional Configurations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Configurations</TabsTrigger>
        </TabsList>

        {/* Admin Configuration */}
        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                User Creation Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Send Email on User Creation</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically send emails when new users are created
                  </p>
                </div>
                <Switch
                  checked={adminSettings.sendEmailOnUserCreation}
                  onCheckedChange={(checked) =>
                    setAdminSettings({ ...adminSettings, sendEmailOnUserCreation: checked })
                  }
                />
              </div>
              {adminSettings.sendEmailOnUserCreation && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Send Temporary Password</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Include temporary password in welcome email
                      </p>
                    </div>
                    <Switch
                      checked={adminSettings.sendTemporaryPassword}
                      onCheckedChange={(checked) =>
                        setAdminSettings({ ...adminSettings, sendTemporaryPassword: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Send Consent Email</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Request consent for future communications
                      </p>
                    </div>
                    <Switch
                      checked={adminSettings.sendConsentEmail}
                      onCheckedChange={(checked) =>
                        setAdminSettings({ ...adminSettings, sendConsentEmail: checked })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Business Day Closure Time</Label>
                <Input
                  type="time"
                  value={adminSettings.businessDayClosureTime}
                  onChange={(e) =>
                    setAdminSettings({ ...adminSettings, businessDayClosureTime: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Time when business day ends for submission tracking
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Start Day of the Week</Label>
                <Select
                  value={adminSettings.startDayOfWeek}
                  onValueChange={(value) =>
                    setAdminSettings({ ...adminSettings, startDayOfWeek: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Timezone & SSO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Timezone</Label>
                <Select
                  value={adminSettings.timezone}
                  onValueChange={(value) =>
                    setAdminSettings({ ...adminSettings, timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Asia/Kolkata">India</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Azure AD SSO</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow single sign-on via Azure Active Directory
                  </p>
                </div>
                <Switch
                  checked={adminSettings.enableAzureAD}
                  onCheckedChange={(checked) =>
                    setAdminSettings({ ...adminSettings, enableAzureAD: checked })
                  }
                />
              </div>
              {adminSettings.enableAzureAD && (
                <>
                  <div className="grid gap-2">
                    <Label>Azure AD Tenant ID</Label>
                    <Input
                      placeholder="Enter tenant ID"
                      value={adminSettings.azureADTenantId}
                      onChange={(e) =>
                        setAdminSettings({ ...adminSettings, azureADTenantId: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Azure AD Client ID</Label>
                    <Input
                      placeholder="Enter client ID"
                      value={adminSettings.azureADClientId}
                      onChange={(e) =>
                        setAdminSettings({ ...adminSettings, azureADClientId: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional Configurations */}
        <TabsContent value="additional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Google Sheet Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Share Google Sheet With</Label>
                <Input
                  placeholder="Enter email address"
                  value={additionalSettings.googleSheetEmail}
                  onChange={(e) =>
                    setAdditionalSettings({ ...additionalSettings, googleSheetEmail: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Email address to share Google Sheets with
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Snapshot Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Email Frequency</Label>
                <Select
                  value={additionalSettings.snapshotEmailFrequency}
                  onValueChange={(value) =>
                    setAdditionalSettings({ ...additionalSettings, snapshotEmailFrequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Send Time</Label>
                <Input
                  type="time"
                  value={additionalSettings.snapshotEmailTime}
                  onChange={(e) =>
                    setAdditionalSettings({ ...additionalSettings, snapshotEmailTime: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Recipients</Label>
                <Textarea
                  placeholder="Enter email addresses (comma-separated)"
                  value={additionalSettings.snapshotEmailRecipients}
                  onChange={(e) =>
                    setAdditionalSettings({ ...additionalSettings, snapshotEmailRecipients: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook Configurations */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Process Webhook Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Process Webhooks</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Send process data to external endpoints
                  </p>
                </div>
                <Switch
                  checked={webhookSettings.processWebhookEnabled}
                  onCheckedChange={(checked) =>
                    setWebhookSettings({ ...webhookSettings, processWebhookEnabled: checked })
                  }
                />
              </div>
              {webhookSettings.processWebhookEnabled && (
                <>
                  <div className="grid gap-2">
                    <Label>Webhook Version</Label>
                    <Select
                      value={webhookSettings.processWebhookVersion}
                      onValueChange={(value) =>
                        setWebhookSettings({ ...webhookSettings, processWebhookVersion: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v1">v1</SelectItem>
                        <SelectItem value="v2">v2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Webhook URL (HTTPS)</Label>
                    <Input
                      placeholder="https://your-endpoint.com/webhook"
                      value={webhookSettings.processWebhookUrl}
                      onChange={(e) =>
                        setWebhookSettings({ ...webhookSettings, processWebhookUrl: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>API Key (optional)</Label>
                    <Input
                      type="password"
                      placeholder="Enter API key"
                      value={webhookSettings.processWebhookApiKey}
                      onChange={(e) =>
                        setWebhookSettings({ ...webhookSettings, processWebhookApiKey: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action Point Webhook Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Action Point Webhooks</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Send action point data to external endpoints
                  </p>
                </div>
                <Switch
                  checked={webhookSettings.actionPointWebhookEnabled}
                  onCheckedChange={(checked) =>
                    setWebhookSettings({ ...webhookSettings, actionPointWebhookEnabled: checked })
                  }
                />
              </div>
              {webhookSettings.actionPointWebhookEnabled && (
                <>
                  <div className="grid gap-2">
                    <Label>Triggers</Label>
                    <div className="space-y-2">
                      {["created", "completed", "closed"].map((trigger) => (
                        <div key={trigger} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={webhookSettings.actionPointTriggers.includes(trigger)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWebhookSettings({
                                  ...webhookSettings,
                                  actionPointTriggers: [...webhookSettings.actionPointTriggers, trigger],
                                });
                              } else {
                                setWebhookSettings({
                                  ...webhookSettings,
                                  actionPointTriggers: webhookSettings.actionPointTriggers.filter(
                                    (t) => t !== trigger
                                  ),
                                });
                              }
                            }}
                          />
                          <span className="text-sm capitalize">{trigger}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Alert Email for Failures</Label>
                    <Input
                      placeholder="Enter alert email"
                      value={webhookSettings.actionPointAlertEmail}
                      onChange={(e) =>
                        setWebhookSettings({ ...webhookSettings, actionPointAlertEmail: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ticket Webhook Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Ticket Webhooks</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Send ticket data to external endpoints
                  </p>
                </div>
                <Switch
                  checked={webhookSettings.ticketWebhookEnabled}
                  onCheckedChange={(checked) =>
                    setWebhookSettings({ ...webhookSettings, ticketWebhookEnabled: checked })
                  }
                />
              </div>
              {webhookSettings.ticketWebhookEnabled && (
                <>
                  <div className="grid gap-2">
                    <Label>Triggers</Label>
                    <div className="space-y-2">
                      {["created", "updated", "closed"].map((trigger) => (
                        <div key={trigger} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={webhookSettings.ticketTriggers.includes(trigger)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWebhookSettings({
                                  ...webhookSettings,
                                  ticketTriggers: [...webhookSettings.ticketTriggers, trigger],
                                });
                              } else {
                                setWebhookSettings({
                                  ...webhookSettings,
                                  ticketTriggers: webhookSettings.ticketTriggers.filter((t) => t !== trigger),
                                });
                              }
                            }}
                          />
                          <span className="text-sm capitalize">{trigger}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Fallback User for Assignment</Label>
                    <Input
                      placeholder="Enter fallback user ID"
                      value={webhookSettings.ticketFallbackUser}
                      onChange={(e) =>
                        setWebhookSettings({ ...webhookSettings, ticketFallbackUser: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asset Webhook Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Asset Webhooks</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Send real-time asset updates to external systems
                  </p>
                </div>
                <Switch
                  checked={webhookSettings.assetWebhookEnabled}
                  onCheckedChange={(checked) =>
                    setWebhookSettings({ ...webhookSettings, assetWebhookEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
