import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Save, Settings as SettingsIcon, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { getStoredUser, getOrganizationId } from '@/lib/authStorage';

type GeneralSettingsState = {
  platformName: string;
  timezone: string;
  twoFactor: boolean;
  sessionTimeout: boolean;
  emailNotifications: boolean;
  smtpHost: string;
};

const SETTINGS_KEY = (orgId: string) => `general-settings:${orgId}`;

const DEFAULT_SETTINGS: GeneralSettingsState = {
  platformName: "Operation Management Platform",
  timezone: "UTC",
  twoFactor: false,
  sessionTimeout: true,
  emailNotifications: true,
  smtpHost: "",
};

function loadSettings(orgId: string): GeneralSettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY(orgId));
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export default function Settings() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const orgId = getOrganizationId();
  const [settings, setSettings] = useState<GeneralSettingsState>(() => loadSettings(orgId));
  const [draft, setDraft] = useState<GeneralSettingsState>(settings);

  useEffect(() => {
    const loaded = loadSettings(orgId);
    setSettings(loaded);
    setDraft(loaded);
  }, [orgId]);

  const handleCancel = () => {
    setDraft(settings);
    toast.message(t("cancelChanges") || "Changes discarded");
  };

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY(orgId), JSON.stringify(draft));
    setSettings(draft);
    toast.success(t("saveAllSettings") || "Settings saved");
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2"
      >
        <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }}>
          <SettingsIcon className="w-8 h-8 text-primary" />
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            {t("generalSettings")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("configureSystemPreferences")}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {[
          { title: t("general"), color: "from-orange-400 to-orange-500" },
          { title: t("security"), color: "from-orange-500 to-orange-600" },
          { title: t("email"), color: "from-orange-400 to-orange-500" },
          { title: t("notifications"), color: "from-orange-500 to-orange-600" },
        ].map((section, idx) => (
          <Tooltip key={section.title}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Card
                  className={`bg-gradient-to-br ${section.color} border-0 hover:shadow-2xl transition-all duration-500`}
                >
                  <CardHeader>
                    <CardTitle className="text-white">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.title === t("general") && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="platform-name" className="text-white">
                            {t("platformName")}
                          </Label>
                          <Input
                            id="platform-name"
                            value={draft.platformName}
                            onChange={(e) => setDraft({ ...draft, platformName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timezone" className="text-white">
                            {t("timezone")}
                          </Label>
                          <Input
                            id="timezone"
                            value={draft.timezone}
                            onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    {section.title === t("security") && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="two-factor" className="text-white">
                            {t("twoFactorAuthentication")}
                          </Label>
                          <Switch
                            id="two-factor"
                            checked={draft.twoFactor}
                            onCheckedChange={(checked) => setDraft({ ...draft, twoFactor: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="session-timeout" className="text-white">
                            {t("sessionTimeout")}
                          </Label>
                          <Switch
                            id="session-timeout"
                            checked={draft.sessionTimeout}
                            onCheckedChange={(checked) =>
                              setDraft({ ...draft, sessionTimeout: checked })
                            }
                          />
                        </div>
                      </>
                    )}
                    {section.title === t("email") && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="email-notifications" className="text-white">
                            {t("emailNotifications") || "Email notifications"}
                          </Label>
                          <Switch
                            id="email-notifications"
                            checked={draft.emailNotifications}
                            onCheckedChange={(checked) =>
                              setDraft({ ...draft, emailNotifications: checked })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-host" className="text-white">
                            SMTP Host
                          </Label>
                          <Input
                            id="smtp-host"
                            value={draft.smtpHost}
                            onChange={(e) => setDraft({ ...draft, smtpHost: e.target.value })}
                            placeholder="smtp.example.com"
                          />
                        </div>
                      </>
                    )}
                    {section.title === t("notifications") && (
                      <>
                        <p className="text-sm text-white/90">
                          {t("manageNotificationPreferences") || "Manage notification preferences"}
                        </p>
                        <Button
                          variant="secondary"
                          className="w-full gap-2"
                          onClick={() => navigate("/notifications")}
                        >
                          <Bell className="w-4 h-4" />
                          {t("notificationSettings") || "Notification Settings"}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("configureSettings").replace("{title}", section.title)}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex justify-end gap-4"
      >
        <Button variant="outline" onClick={handleCancel}>
          {t("cancel")}
        </Button>
        <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          {t("saveSettings")}
        </Button>
      </motion.div>
    </div>
  );
}
