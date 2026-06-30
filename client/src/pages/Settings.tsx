import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Save, Settings as SettingsIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2"
      >
        <motion.div
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.6 }}
        >
          <SettingsIcon className="w-8 h-8 text-primary" />
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">{t('generalSettings')}</h1>
          <p className="text-muted-foreground mt-1">{t('configureSystemPreferences')}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {[
          { title: t('general'), color: "from-orange-400 to-orange-500" },
          { title: t('security'), color: "from-orange-500 to-orange-600" },
          { title: t('email'), color: "from-orange-400 to-orange-500" },
          { title: t('notifications'), color: "from-orange-500 to-orange-600" },
        ].map((section, idx) => (
          <Tooltip key={section.title}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Card className={`bg-gradient-to-br ${section.color} border-0 hover:shadow-2xl transition-all duration-500 cursor-pointer`}>
                  <CardHeader>
                    <CardTitle className="text-white">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.title === t('general') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="platform-name" className="text-white">{t('platformName')}</Label>
                          <Input id="platform-name" defaultValue="Operation Management Platform" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timezone" className="text-white">{t('timezone')}</Label>
                          <Input id="timezone" defaultValue="UTC" />
                        </div>
                      </>
                    )}
                    {section.title === t('security') && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="two-factor" className="text-white">{t('twoFactorAuthentication')}</Label>
                          <Switch id="two-factor" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="session-timeout" className="text-white">{t('sessionTimeout')}</Label>
                          <Switch id="session-timeout" />
                        </div>
                      </>
                    )}
                    {section.title === t('email') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="email-from" className="text-white">{t('fromEmail')}</Label>
                          <Input id="email-from" type="email" placeholder="noreply@omp.com" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="email-notifications" className="text-white">{t('emailNotifications')}</Label>
                          <Switch id="email-notifications" defaultChecked />
                        </div>
                      </>
                    )}
                    {section.title === t('notifications') && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="push-notifications" className="text-white">{t('pushNotifications')}</Label>
                          <Switch id="push-notifications" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sms-notifications" className="text-white">{t('smsNotifications')}</Label>
                          <Switch id="sms-notifications" />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('configureSettings').replace('{title}', section.title)}</p>
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
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline">{t('cancel')}</Button>
            </motion.button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('cancelChanges')}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Save className="w-4 h-4 mr-2" />
                {t('saveSettings')}
              </Button>
            </motion.button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('saveAllSettings')}</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </div>
  );
}
