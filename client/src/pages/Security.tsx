import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Save, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

export default function Security() {
  const { t } = useLanguage();
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
              {t('back')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('goBackToPreviousPage')}</p>
          </TooltipContent>
        </Tooltip>
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t('securitySettings')}</h1>
          <p className="text-muted-foreground mt-1">{t('manageSecurityAndAccessControl')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('authentication')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="two-factor-auth">{t('twoFactorAuthentication')}</Label>
                  <Switch id="two-factor-auth" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password-policy">{t('enforcePasswordPolicy')}</Label>
                  <Switch id="password-policy" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="session-lock">{t('sessionLock')}</Label>
                  <Switch id="session-lock" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('configureAuthenticationSettings')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('accessControl')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="role-based">{t('roleBasedAccessControl')}</Label>
                  <Switch id="role-based" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ip-whitelist">{t('ipWhitelist')}</Label>
                  <Switch id="ip-whitelist" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="api-keys">{t('apiKeyManagement')}</Label>
                  <Switch id="api-keys" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('configureAccessControlSettings')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('dataProtection')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="encryption">{t('dataEncryption')}</Label>
                  <Switch id="encryption" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="backup">{t('automaticBackup')}</Label>
                  <Switch id="backup" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="audit-logs">{t('auditLogging')}</Label>
                  <Switch id="audit-logs" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('configureDataProtectionSettings')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t('compliance')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gdpr">{t('gdprCompliance')}</Label>
                  <Switch id="gdpr" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="data-retention">{t('dataRetentionPolicy')}</Label>
                  <Switch id="data-retention" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('configureComplianceSettings')}</p>
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
            <p>{t('saveSecuritySettings')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
