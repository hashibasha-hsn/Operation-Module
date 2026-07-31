import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Lock,
  Mail,
  Save,
  CheckCircle,
  Loader2,
  ChevronDown,
  AlertCircle,
  Award,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";
import { getStoredUser,
  isProfileSetupComplete,
  syncProfileCompletionToSession,
  updateStoredUser, getOrganizationId } from '@/lib/authStorage';
import { getProfileCompletionProgress } from "@/lib/profileCompletion";
import PasswordChangeForm from "@/components/PasswordChangeForm";
import { fetchTwoFactorSettings, updateTwoFactorSettings } from "@/lib/twoFactorApi";
import { fetchUserCertificates, type CourseCertificateRecord } from "@/lib/courseApi";
import { downloadCourseCertificate } from "@/lib/courseCertificate";
import { getCurrentUserDisplayName } from "@/lib/processSubmission";
import { useLanguage } from "@/contexts/LanguageContext";
import { GATEWAY } from "@/lib/apiConfig";

const USER_API = (import.meta.env.VITE_USER_API || `${GATEWAY}/api/user`) + '/users';
const getEntitiesApi = () =>
  `${GATEWAY}/api/org/entities?organizationId=${encodeURIComponent(getOrganizationId())}`;

type EntityOption = {
  id: string;
  storeName?: string;
  name?: string;
};

type ManagerOption = {
  userId: string;
  name: string;
  email?: string;
};

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  designation: string;
  entityId: string;
  storeName: string;
  manager: string;
};

export default function ProfileSettings() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const setupMode = params.get("setup") === "1";
  const forcePasswordChange =
    params.get("force") === "1" || Boolean(getStoredUser().mustChangePassword);
  const tabParam = params.get("tab");

  const initialTab =
    forcePasswordChange ||
    (!setupMode && (tabParam === "password" || tabParam === "change-password"))
      ? "Change Password"
      : "My Profile";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileExists, setProfileExists] = useState(false);

  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [accountMeta, setAccountMeta] = useState({
    userId: "",
    designation: "",
    status: "Active",
    joinedDate: "",
    lastLogin: "",
  });

  const [profileData, setProfileData] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
    designation: "",
    entityId: "",
    storeName: "",
    manager: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isSavingTwoFactor, setIsSavingTwoFactor] = useState(false);
  const [certificates, setCertificates] = useState<CourseCertificateRecord[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);

  const tabs = ["My Profile", "Change Password"];

  const storedUser = getStoredUser();
  const currentUserId = String(storedUser.userId ?? storedUser.id ?? "");

  useEffect(() => {
    void loadProfileSetup();
  }, []);

  useEffect(() => {
    if (!setupMode && currentUserId) {
      void fetchUserCertificates(currentUserId)
        .then(setCertificates)
        .catch(() => setCertificates([]))
        .finally(() => setLoadingCertificates(false));
    }
  }, [setupMode, currentUserId]);

  useEffect(() => {
    if (forcePasswordChange) {
      setActiveTab("Change Password");
      return;
    }
    if (setupMode) {
      if (tabParam === "password" || tabParam === "change-password") {
        setActiveTab("Change Password");
      } else {
        setActiveTab("My Profile");
      }
      return;
    }
    if (tabParam === "password" || tabParam === "change-password") {
      setActiveTab("Change Password");
    }
  }, [tabParam, setupMode, forcePasswordChange]);

  const loadProfileSetup = async () => {
    setIsLoadingProfile(true);
    setProfileError("");
    const authUser = getStoredUser();
    const userId = String(authUser.userId ?? authUser.id ?? "");
    const email = String(authUser.email ?? "");

    try {
      const [entitiesRes, usersRes, twoFactorRes] = await Promise.all([
        fetch(getEntitiesApi()),
        fetch(`${USER_API}?limit=1000`),
        !setupMode && currentUserId ? fetchTwoFactorSettings().catch(() => ({ enabled: false })) : Promise.resolve({ enabled: false }),
      ]);

      const entitiesData = entitiesRes.ok ? await entitiesRes.json() : [];
      const usersData = usersRes.ok ? await usersRes.json() : { users: [] };
      const entityList: EntityOption[] = Array.isArray(entitiesData)
        ? entitiesData
        : entitiesData?.entities || [];
      const userList: ManagerOption[] = (usersData?.users || []).map((u: any) => ({
        userId: u.userId,
        name: u.name,
        email: u.email,
      }));

      setEntities(entityList);
      setManagers(userList.filter((u) => u.userId && u.name && u.userId !== userId));
      setTwoFactorEnabled(Boolean(twoFactorRes?.enabled));

      let profile: any = null;
      if (userId) {
        const byIdRes = await fetch(`${USER_API}/${userId}`);
        if (byIdRes.ok) {
          profile = await byIdRes.json();
        }
      }

      if (!profile && email) {
        const byEmail = (usersData?.users || []).find(
          (u: any) => String(u.email || "").toLowerCase() === email.toLowerCase(),
        );
        if (byEmail) {
          profile = byEmail;
        }
      }

      if (profile?.userId) {
        setProfileExists(true);
        const storeName =
          profile.storeName ||
          entityList.find((e) => e.id === profile.entityId)?.storeName ||
          "";
        setProfileData({
          name: profile.name || "",
          email: profile.email || email,
          phone: profile.phone || "",
          designation: profile.designation || "",
          entityId: profile.entityId || "",
          storeName,
          manager: profile.manager || "",
        });
        setAccountMeta({
          userId: profile.userId,
          designation: profile.designation || "",
          status: profile.isActive === false ? t('inactive') : t('active'),
          joinedDate: profile.createdAt
            ? new Date(profile.createdAt).toLocaleDateString()
            : "",
          lastLogin: profile.lastLogin
            ? new Date(profile.lastLogin).toLocaleString()
            : "",
        });
        updateStoredUser({
          userId: profile.userId,
          id: profile.userId,
          name: profile.name,
          email: profile.email || email,
          entityId: profile.entityId,
          storeName,
          manager: profile.manager,
          designation: profile.designation,
          phone: profile.phone,
        });
        syncProfileCompletionToSession({
          userId: profile.userId,
          id: profile.userId,
          name: profile.name,
          email: profile.email || email,
          entityId: profile.entityId,
          storeName,
          manager: profile.manager,
          designation: profile.designation,
          phone: profile.phone,
          profileSetupComplete: profile.profileSetupComplete,
          profileSetupCompletedAt: profile.profileSetupCompletedAt,
          profileCompletion: profile.profileCompletion,
        });
      } else {
        setProfileExists(false);
        setProfileData((prev) => ({
          ...prev,
          email,
          name: String(authUser.name || authUser.fullName || ""),
        }));
        setAccountMeta((prev) => ({ ...prev, userId }));
      }
    } catch (err) {
      console.error("Failed to load profile setup:", err);
      setProfileError(t('failedToLoadProfileData'));
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileError("");
    const name = profileData.name.trim();
    const manager = profileData.manager.trim();
    const entityId = profileData.entityId.trim();
    const storeName = profileData.storeName.trim();

    if (!name || !entityId) {
      setProfileError(t('nameAndStoreRequired'));
      return;
    }

    const authUser = getStoredUser();
    const userId = String(authUser.userId ?? authUser.id ?? accountMeta.userId ?? "");
    if (!userId) {
      setProfileError(t('unableToDetermineUser'));
      return;
    }

    const payload = {
      name,
      email: profileData.email.trim() || authUser.email,
      phone: profileData.phone.trim() || null,
      designation: profileData.designation.trim() || null,
      entityId,
      storeName,
      manager,
      performedBy: authUser.email || name,
      completeProfileSetup: true,
    };

    setIsSavingProfile(true);
    try {
      let response: Response;
      if (profileExists) {
        response = await fetch(`${USER_API}/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(USER_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            ...payload,
            isActive: true,
            validEmail: true,
          }),
        });
      }

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setProfileError(data?.message || t('failedToSaveProfile'));
        return;
      }

      const saved = data?.userId ? data : { ...payload, userId };
      setProfileExists(true);
      syncProfileCompletionToSession({
        userId,
        id: userId,
        name: saved.name || name,
        email: saved.email || payload.email,
        entityId: saved.entityId || entityId,
        storeName: saved.storeName || storeName,
        manager: saved.manager || manager,
        designation: saved.designation || profileData.designation,
        phone: saved.phone || profileData.phone,
        profileSetupComplete: saved.profileSetupComplete ?? true,
        profileSetupCompletedAt: saved.profileSetupCompletedAt,
        profileCompletion: saved.profileCompletion,
      });
      setAccountMeta((prev) => ({
        ...prev,
        userId,
        designation: saved.designation || profileData.designation,
      }));

      toast.success(
        saved.profileSetupComplete !== false
          ? t('profileSavedSetupComplete')
          : t('profileSavedSuccessfully'),
      );
      if (setupMode) {
        // Next onboarding step: verify current password and set a secure password
        setActiveTab("Change Password");
        navigate("/profile-settings?setup=1&tab=password");
        return;
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setProfileError(t('failedToConnectToServer'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openPasswordTab = () => {
    setActiveTab("Change Password");
    navigate(setupMode ? "/profile-settings?setup=1&tab=password" : "/profile-settings?tab=password");
  };

  const finishSetup = () => {
    if (!isProfileSetupComplete(getStoredUser())) {
      setActiveTab("My Profile");
      navigate("/profile-settings?setup=1");
      toast.error(t('completeNameAndStore'));
      return;
    }
    navigate("/dashboard");
  };

  const handleToggleTwoFactor = async (enabled: boolean) => {
    setIsSavingTwoFactor(true);
    try {
      const data = await updateTwoFactorSettings(enabled);
      setTwoFactorEnabled(Boolean(data.enabled));
      toast.success(
        enabled
          ? t('twoFactorEnabled')
          : t('twoFactorDisabled'),
      );
    } catch (err: any) {
      toast.error(err?.message || t('failedToUpdateTwoFactor'));
    } finally {
      setIsSavingTwoFactor(false);
    }
  };

  const canSaveProfile =
    profileData.name.trim() &&
    profileData.entityId.trim() &&
    !isSavingProfile;

  const handleDownloadCertificate = (cert: CourseCertificateRecord) => {
    downloadCourseCertificate({
      userName: getCurrentUserDisplayName() || cert.course?.name || "",
      courseTitle: cert.course?.title ?? "Course",
      score: cert.score ?? 100,
      completedAt: cert.issuedAt ? new Date(cert.issuedAt) : new Date(),
      settings: cert.settings as Record<string, any> | undefined,
    });
  };

  const completionProgress = getProfileCompletionProgress({
    name: profileData.name,
    entityId: profileData.entityId,
    storeName: profileData.storeName,
    manager: profileData.manager,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <User className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">
              {setupMode ? t('completeYourProfile') : t('profileSettings')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {setupMode
                ? t('completeProfileDesc')
                : t('manageYourPersonalSettings')}
            </p>
          </div>
        </div>
        {setupMode && (
          <Badge
            variant={completionProgress.profileSetupComplete ? "default" : "outline"}
            className="gap-1"
          >
            {completionProgress.profileSetupComplete ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {completionProgress.percent}{t('percentComplete')}
          </Badge>
        )}
      </div>

      {setupMode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between gap-3">
              <span>{t('profileCompletionTracking')}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {completionProgress.completedCount}/{completionProgress.totalCount} {t('required')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${completionProgress.percent}%` }}
              />
            </div>
            <ul className="grid gap-2 sm:grid-cols-3">
              {completionProgress.items.map((item) => (
                <li
                  key={item.key}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    item.done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-amber-200 bg-amber-50/60 text-amber-950"
                  }`}
                >
                  {item.done ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  {item.label}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              {t('step')} {activeTab === "Change Password" ? "2" : "1"} {t('of')} 2
              {completionProgress.profileSetupComplete
                ? t('profileFieldsComplete')
                : t('fillNameAndStore')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation — include Change Password during setup for current-password verification */}
      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                className={`rounded-t-lg border-b-2 ${
                  activeTab === tab
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "Change Password") {
                    navigate(
                      setupMode
                        ? "/profile-settings?setup=1&tab=password"
                        : "/profile-settings?tab=password",
                    );
                  } else {
                    navigate(setupMode ? "/profile-settings?setup=1" : "/profile-settings");
                  }
                }}
              >
                {tab === "Change Password"
                  ? t("changePassword")
                  : tab === "My Profile"
                    ? setupMode
                      ? t("profileStepOne")
                      : t("myProfile")
                    : ""}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "My Profile" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profileSetup')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('loadingProfile')}
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">
                      {t('fullName')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      placeholder={t('enterFullName')}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="profileEmail">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="profileEmail"
                        className="pl-10"
                        value={profileData.email}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>
                      {t('store')} <span className="text-destructive">*</span>
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {profileData.storeName || t('selectStore')}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto">
                        {entities.length === 0 ? (
                          <DropdownMenuItem disabled>{t('noStoresAvailable')}</DropdownMenuItem>
                        ) : (
                          entities.map((entity) => (
                            <DropdownMenuItem
                              key={entity.id}
                              onClick={() =>
                                setProfileData({
                                  ...profileData,
                                  entityId: entity.id,
                                  storeName:
                                    entity.storeName || entity.name || t('unnamedStore'),
                                })
                              }
                            >
                              {entity.storeName || entity.name || t('unnamedStore')}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid gap-2">
                    <Label>
                      {t('reportingManager')}
                    </Label>
                    {managers.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {profileData.manager || t('selectReportingManager')}
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto">
                          {managers.map((manager) => (
                            <DropdownMenuItem
                              key={manager.userId}
                              onClick={() =>
                                setProfileData({
                                  ...profileData,
                                  manager: manager.name,
                                })
                              }
                            >
                              <div className="flex flex-col">
                                <span>{manager.name}</span>
                                {manager.email && (
                                  <span className="text-xs text-muted-foreground">
                                    {manager.email}
                                  </span>
                                )}
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Input
                        value={profileData.manager}
                        onChange={(e) =>
                          setProfileData({ ...profileData, manager: e.target.value })
                        }
                        placeholder={t('enterManagerName')}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="designation">{t('designation')}</Label>
                      <Input
                        id="designation"
                        value={profileData.designation}
                        onChange={(e) =>
                          setProfileData({ ...profileData, designation: e.target.value })
                        }
                        placeholder={t('optional')}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">{t('phone')}</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        placeholder={t('optional')}
                      />
                    </div>
                  </div>

                  {profileError && (
                    <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {profileError}
                    </div>
                  )}

                  <div className="flex justify-end mt-2 gap-2">
                    {!setupMode && (
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={openPasswordTab}
                      >
                        <Lock className="w-4 h-4" />
                        {t("changePassword")}
                      </Button>
                    )}
                    <Button
                      className="gap-2"
                      onClick={handleSaveProfile}
                      disabled={!canSaveProfile}
                    >
                      {isSavingProfile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {setupMode ? t('saveAndContinue') : t('saveChanges')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {!setupMode && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t('accountInformation')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">{t('designation')}</span>
                      <Badge variant="outline">
                        {accountMeta.designation || profileData.designation || "—"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">{t('accountStatus')}</span>
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {accountMeta.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">{t('joinedDate')}</span>
                      <span>{accountMeta.joinedDate || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">{t('lastLogin')}</span>
                      <span>{accountMeta.lastLogin || "—"}</span>
                    </div>
                    {!isProfileSetupComplete({
                      name: profileData.name,
                      entityId: profileData.entityId,
                      manager: profileData.manager,
                    }) ? (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        {t('completeNameAndStoreToFinish')}{completionProgress.percent}% done).
                      </p>
                    ) : (
                      <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {t('profileSetupComplete')}
                        {getStoredUser().profileSetupCompletedAt
                          ? ` · ${new Date(String(getStoredUser().profileSetupCompletedAt)).toLocaleString()}`
                          : ""}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    {t('myCertificates')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCertificates ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('loadingCertificates')}
                    </div>
                  ) : certificates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('noCertificatesYet')}
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {certificates.map((cert) => (
                        <li
                          key={cert.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium truncate">
                              {cert.course?.title ?? t('courseCertificate')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('scoreLabel')} {cert.score ?? 100}%
                              {cert.issuedAt
                                ? ` · ${t('issuedOn')} ${new Date(cert.issuedAt).toLocaleDateString()}`
                                : ""}
                              {cert.expiresAt
                                ? ` · ${t('expiresOn')} ${new Date(cert.expiresAt).toLocaleDateString()}`
                                : ""}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDownloadCertificate(cert)}
                          >
                            <Download className="h-4 w-4" />
                            {t('download')}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('security')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="space-y-1">
                      <div className="font-medium">{t('emailOtpTwoFactor')}</div>
                      <p className="text-sm text-muted-foreground">
                        {t('emailOtpTwoFactorDesc')}
                      </p>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={handleToggleTwoFactor}
                      disabled={isSavingTwoFactor}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === "Change Password" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {forcePasswordChange
                ? t('passwordExpiredChangeRequired')
                : setupMode
                  ? t('verifyCurrentPassword')
                  : t("changePassword")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {forcePasswordChange
                ? t('forcePasswordChangeDesc')
                : setupMode
                  ? t('setupPasswordChangeDesc')
                  : t("changePasswordDescription")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {(setupMode || forcePasswordChange) && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {forcePasswordChange
                  ? t('forcePasswordChangeNotice')
                  : t('setupPasswordChangeNotice')}
              </div>
            )}
            <PasswordChangeForm
              onSuccess={() => {
                if (forcePasswordChange) {
                  if (!isProfileSetupComplete(getStoredUser())) {
                    navigate("/profile-settings?setup=1");
                    return;
                  }
                  navigate("/dashboard");
                }
              }}
            />
            {setupMode && !forcePasswordChange && (
              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={finishSetup}>
                  {t('skipForNow')}
                </Button>
                <Button type="button" onClick={finishSetup}>
                  {t('continueToDashboard')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}


    </div>
  );
}
