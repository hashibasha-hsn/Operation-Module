import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Lock,
  Bell,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Save,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import CountryStateCitySelectors, {
  type CountryStateCitySelection,
} from "@/components/entities/CountryStateCitySelectors";

/** i18next returns the key itself when a translation is missing — use this
 *  to fall back to a hard-coded English string in that case. */
function tr(translated: string, fallback: string): string {
  return !translated || translated === fallback.replace(/ /g, '') || translated.length > 60
    ? fallback
    : translated;
}

const USER_API = import.meta.env.VITE_USER_API || "http://localhost:3009/api/user";
const AUTH_API = import.meta.env.VITE_AUTH_API || "http://localhost:3009/api/auth";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export default function ProfileSettings() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("My Profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const storedUser = getStoredUser();
  const userId = storedUser.userId || storedUser.id || "";

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "",
    designation: "",
    manager: "",
    storeName: "",
    employeeId: "",
    countryId: "",
    stateId: "",
    locationCityId: "",
  });

  // Read-only info
  const [accountInfo, setAccountInfo] = useState({
    userId: "",
    isActive: true,
    createdAt: "",
    lastLogin: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    deadlineAlerts: true,
    weeklyDigest: false,
    mentions: true,
  });

  const TAB_PROFILE  = "My Profile";
  const TAB_PASSWORD = "Change Password";
  const TAB_NOTIF    = "Notifications";
  const tabs = [TAB_PROFILE, TAB_PASSWORD, TAB_NOTIF];

  // Load profile on mount
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${USER_API}/users/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          countryCode: data.countryCode || "",
          designation: data.designation || "",
          manager: data.manager || "",
          storeName: data.storeName || "",
          employeeId: data.employeeId || "",
          countryId: data.countryId || "",
          stateId: data.stateId || "",
          locationCityId: data.locationCityId || "",
        });
        setAccountInfo({
          userId: data.userId || userId,
          isActive: data.isActive ?? true,
          createdAt: data.createdAt || "",
          lastLogin: data.lastLogin || "",
        });
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch(`${USER_API}/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "Save failed");
      // Update localStorage user record
      const updated = await res.json();
      localStorage.setItem("user", JSON.stringify({ ...storedUser, ...updated }));
      toast.success(t("profileSavedSuccessfully") || "Profile saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error(t("fillAllPasswordFields") || "Please fill all password fields");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t("passwordsDoNotMatch") || "Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const email = profileData.email || storedUser.email;
      // Re-authenticate with current password then update
      const res = await fetch(`${AUTH_API}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || "Password change failed");
      toast.success(t("passwordChangedSuccessfully") || "Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    // Notification settings are client-side preferences for now
    localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings));
    toast.success(t("notificationSettingsSaved") || "Notification settings saved");
  };

  const handleLocationChange = (sel: CountryStateCitySelection) => {
    setProfileData((prev) => ({
      ...prev,
      countryId: sel.countryId,
      stateId: sel.stateId,
      locationCityId: sel.cityId,
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <User className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t("profileSettings") || "Profile Settings"}</h1>
          <p className="text-muted-foreground mt-1">{t("manageYourPersonalSettings") || "Manage your personal settings"}</p>
        </div>
      </div>

      {/* Tab Navigation */}
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
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ── My Profile Tab ─────────────────────────────────────────────── */}
      {activeTab === TAB_PROFILE && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("personalInformation") || "Personal Information"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t("fullName") || "Full Name"}</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="employeeId">{t("employeeId") || "Employee ID"}</Label>
                  <Input
                    id="employeeId"
                    value={profileData.employeeId}
                    onChange={(e) => setProfileData({ ...profileData, employeeId: e.target.value })}
                    placeholder="EMP-001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("email") || "Email"}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      className="pl-10"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">{t("phone") || "Phone"}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+966 5X XXX XXXX"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="designation">{t("designation") || "Designation"}</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="designation"
                      className="pl-10"
                      value={profileData.designation}
                      onChange={(e) => setProfileData({ ...profileData, designation: e.target.value })}
                      placeholder="Store Manager"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="manager">{t("reportingManager") || "Reporting Manager"}</Label>
                  <Input
                    id="manager"
                    value={profileData.manager}
                    onChange={(e) => setProfileData({ ...profileData, manager: e.target.value })}
                    placeholder="Manager name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="storeName">{t("storeName") || "Store / Branch"}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="storeName"
                      className="pl-10"
                      value={profileData.storeName}
                      onChange={(e) => setProfileData({ ...profileData, storeName: e.target.value })}
                      placeholder="Riyadh Main Branch"
                    />
                  </div>
                </div>
              </div>

              {/* Country / State / City */}
              <div className="mt-4 space-y-2">
                <Label>{t("countryStateCity") || "Country / State / City"}</Label>
                <CountryStateCitySelectors
                  value={{
                    countryId: profileData.countryId,
                    stateId: profileData.stateId,
                    cityId: profileData.locationCityId,
                  }}
                  onChange={handleLocationChange}
                />
              </div>

              <div className="flex justify-end mt-6">
                <Button className="gap-2" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t("saveChanges") || "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("accountInformation") || "Account Information"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">{t("userId") || "User ID"}</span>
                  <span className="font-mono text-sm">{accountInfo.userId || userId || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">{t("designation") || "Designation"}</span>
                  <Badge variant="outline">{profileData.designation || "—"}</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">{t("accountStatus") || "Account Status"}</span>
                  <Badge variant={accountInfo.isActive ? "default" : "destructive"} className="gap-1">
                    {accountInfo.isActive && <CheckCircle className="w-3 h-3" />}
                    {accountInfo.isActive ? (t("active") || "Active") : (t("inactive") || "Inactive")}
                  </Badge>
                </div>
                {accountInfo.createdAt && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">{t("joinedDate") || "Joined Date"}</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(accountInfo.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                {accountInfo.lastLogin && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">{t("lastLogin") || "Last Login"}</span>
                    <span>{new Date(accountInfo.lastLogin).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Change Password Tab ────────────────────────────────────────── */}
      {activeTab === TAB_PASSWORD && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {t("changePassword") || "Change Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">{t("currentPassword") || "Current Password"}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newPassword">{t("newPassword") || "New Password"}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">{t("confirmNewPassword") || "Confirm New Password"}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button className="gap-2" onClick={handleChangePassword} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t("updatePassword") || "Update Password"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Notifications Tab ─────────────────────────────────────────── */}
      {activeTab === TAB_NOTIF && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t("notificationPreferences") || "Notification Preferences"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(
                [
                  { key: "emailNotifications", label: t("emailNotifications") || "Email Notifications", desc: t("receiveNotificationsViaEmail") || "Receive notifications via email" },
                  { key: "pushNotifications",  label: t("pushNotifications")  || "Push Notifications",  desc: t("receivePushNotifications") || "Receive push notifications on your device" },
                  { key: "taskReminders",      label: t("taskReminders")      || "Task Reminders",      desc: t("remindedAboutUpcomingTasks") || "Get reminded about upcoming tasks" },
                  { key: "deadlineAlerts",     label: t("deadlineAlerts")     || "Deadline Alerts",     desc: t("alertsWhenDeadlinesApproaching") || "Alerts when deadlines are approaching" },
                  { key: "weeklyDigest",       label: t("weeklyDigest")       || "Weekly Digest",       desc: t("weeklyDigestDesc") || "Receive a weekly summary of activities" },
                  { key: "mentions",           label: t("mentions")           || "Mentions",            desc: t("notifiedWhenMentioned") || "Get notified when you're mentioned" },
                ] as { key: keyof typeof notificationSettings; label: string; desc: string }[]
              ).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                  </div>
                  <Switch
                    checked={notificationSettings[key]}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, [key]: checked })
                    }
                  />
                </div>
              ))}
              <div className="flex justify-end mt-4">
                <Button className="gap-2" onClick={handleSaveNotifications}>
                  <Save className="w-4 h-4" />
                  {t("savePreferences") || "Save Preferences"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
