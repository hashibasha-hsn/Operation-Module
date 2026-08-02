import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  CheckSquare,
  BarChart3,
  Shield,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/contexts/PermissionContext";
import { PLATFORM_NAME, PLATFORM_SHORT_NAME } from "@/lib/branding";
import PlatformMark from "@/components/PlatformMark";

const GATEWAY = import.meta.env.VITE_USER_API?.replace('/api/user', '') || '';
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getRememberMePreference, setAuthSession, isProfileSetupComplete, syncProfileCompletionToSession } from "@/lib/authStorage";
import { resendLoginOtp, verifyLoginOtp } from "@/lib/twoFactorApi";
import { recordLoginAttendance } from "@/lib/attendanceApi";

const HIGHLIGHTS = [
  { icon: CheckSquare, titleKey: "tasks", desc: "Track daily operations and approvals" },
  { icon: BarChart3, titleKey: "reports", desc: "Insights across stores and workflows" },
  { icon: Shield, titleKey: "securitySettings", desc: "Role-based access and audit trails" },
];

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(getRememberMePreference);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [otp, setOtp] = useState("");
  const [pendingOtpToken, setPendingOtpToken] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [, navigate] = useLocation();
  const { refreshPermissions } = usePermissions();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${GATEWAY}/api/auth/check-setup`);
      const data = await response.json();

      if (!data.isSetup) {
        navigate("/admin-setup");
      }
    } catch (err) {
      console.error("Failed to check setup status:", err);
    } finally {
      setIsCheckingSetup(false);
    }
  };

  const handleAuthenticatedSession = async (data: any, normalizedEmail: string) => {
    const mustChangePassword = Boolean(
      data.user?.mustChangePassword ?? data.passwordPolicy?.mustChangePassword,
    );
    const userRecord = {
      ...data.user,
      userId: data.user?.userId ?? data.user?.id,
      email: data.user?.email ?? normalizedEmail,
      organizationId: data.user?.organizationId ?? "default-org",
      mustChangePassword,
      passwordExpiringSoon: Boolean(
        data.user?.passwordExpiringSoon ?? data.passwordPolicy?.passwordExpiringSoon,
      ),
      daysUntilExpiry:
        data.user?.daysUntilExpiry ?? data.passwordPolicy?.daysUntilExpiry ?? null,
      passwordExpiresAt:
        data.user?.passwordExpiresAt ?? data.passwordPolicy?.passwordExpiresAt ?? null,
    };
    setAuthSession(
      {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: userRecord,
      },
      rememberMe,
    );

    let profileComplete = false;
    try {
      const userId = userRecord.userId;
      let profile: any = null;
      if (userId) {
        const profileRes = await fetch(`${GATEWAY}/api/user/users/${userId}`);
        if (profileRes.ok) {
          profile = await profileRes.json();
        }
      }
      if (!profile) {
        const listRes = await fetch(`${GATEWAY}/api/user/users?limit=1000`);
        if (listRes.ok) {
          const listData = await listRes.json();
          profile = (listData?.users || []).find(
            (u: any) =>
              String(u.email || "").toLowerCase() === normalizedEmail ||
              String(u.userId) === String(userId),
          );
        }
      }
      if (profile) {
        syncProfileCompletionToSession({
          userId: profile.userId || userId,
          id: profile.userId || userId,
          name: profile.name,
          email: profile.email || normalizedEmail,
          employeeId: profile.employeeId,
          entityId: profile.entityId,
          storeName: profile.storeName,
          manager: profile.manager,
          designation: profile.designation,
          phone: profile.phone,
          profileSetupComplete: profile.profileSetupComplete,
          profileSetupCompletedAt: profile.profileSetupCompletedAt,
          profileCompletion: profile.profileCompletion,
        });
        profileComplete =
          Boolean(profile.profileSetupComplete) ||
          isProfileSetupComplete({
            name: profile.name,
            entityId: profile.entityId,
            storeName: profile.storeName,
            manager: profile.manager,
            profileSetupComplete: profile.profileSetupComplete,
            profileCompletion: profile.profileCompletion,
          });
      }
    } catch (profileErr) {
      console.error("Failed to load user profile after login:", profileErr);
    }

    void recordLoginAttendance().catch((err) => {
      console.warn("Failed to record login attendance:", err);
    });

    // Re-evaluate role + permissions now that a session exists (the provider
    // only fetches on mount, which happens on the login page pre-auth).
    void refreshPermissions().catch((err) => {
      console.error("Failed to refresh permissions after login:", err);
    });

    if (mustChangePassword && !profileComplete) {
      navigate("/profile-settings?setup=1&tab=password&force=1");
    } else if (mustChangePassword) {
      navigate("/profile-settings?tab=password&force=1");
    } else if (!profileComplete) {
      navigate("/profile-settings?setup=1");
    } else {
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    try {
      const response = await fetch(`${GATEWAY}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: trimmedPassword,
          rememberMe,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.access_token) {
        await handleAuthenticatedSession(data, normalizedEmail);
      } else if (response.ok && data?.requiresOtp && data?.pendingToken) {
        setPendingOtpToken(data.pendingToken);
        setOtpEmail(data.email || normalizedEmail);
        setOtp("");
        setIsOtpStep(true);
        setError("");
      } else {
        setError(data?.message || t("invalidEmailOrPassword"));
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(t("failedToConnectToServer"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await verifyLoginOtp(pendingOtpToken, otp, rememberMe);
      await handleAuthenticatedSession(data, email.trim().toLowerCase());
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await resendLoginOtp(pendingOtpToken);
      setPendingOtpToken(data.pendingToken || pendingOtpToken);
      setOtp("");
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsOtpStep(false);
    setPendingOtpToken("");
    setOtp("");
    setError("");
  };

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center login-brand-panel">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-sky-400 mx-auto mb-4" />
          <p className="text-slate-300">{t("checkingSystemStatus")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans antialiased text-foreground">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden login-brand-panel">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full px-14 py-12">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <PlatformMark size="lg" className="bg-white/10 border-white/20 text-white shadow-lg shadow-sky-900/30" />
            <div>
              <p className="text-sky-300/90 text-sm font-medium tracking-wide uppercase">
                {PLATFORM_SHORT_NAME}
              </p>
              <h1 className="max-w-lg text-3xl font-bold text-white tracking-tight leading-tight">
                {PLATFORM_NAME}
              </h1>
            </div>
          </motion.div>

          <div className="space-y-8 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-sky-100 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                Enterprise operations hub
              </div>
              <p className="text-2xl font-semibold text-white leading-snug">
                {t("streamlineBusinessOperations")}
              </p>
              <p className="mt-3 text-slate-300 leading-relaxed">
                Manage tasks, workflows, compliance, and reporting from one unified platform.
              </p>
            </motion.div>

            <div className="space-y-3">
              {HIGHLIGHTS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.titleKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.1, duration: 0.45 }}
                    className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{t(item.titleKey)}</p>
                      <p className="text-sm text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-slate-500"
          >
            © {new Date().getFullYear()} {PLATFORM_NAME}
          </motion.p>
        </div>
      </div>

      {/* Sign-in panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 login-form-panel">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[440px]"
        >
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <PlatformMark size="md" />
            <h1 className="text-center text-xl font-bold tracking-tight">{PLATFORM_NAME}</h1>
          </div>

          <div className="rounded-2xl border border-sky-200/60 gradient-card backdrop-blur-xl p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {isOtpStep ? "Verify your login" : t("welcomeBack")}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isOtpStep
                  ? `Enter the 6-digit OTP sent to ${otpEmail || email.trim().toLowerCase()}.`
                  : t("pleaseEnterDetailsSignIn")}
              </p>
            </div>

            <form onSubmit={isOtpStep ? handleVerifyOtp : handleSubmit} className="space-y-5">
              {!isOtpStep ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t("email")}
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("enterYourEmail")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 bg-background/60 border-border/80 focus-visible:ring-primary/25"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      {t("password")}
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        placeholder={t("enterYourPassword")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 h-12 bg-background/60 border-border/80 focus-visible:ring-primary/25"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="remember-me"
                      className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none"
                    >
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      {t("rememberMe")}
                    </label>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t("forgotPassword")}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">One-time password</Label>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    containerClassName="justify-center"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-muted-foreground text-center">
                    Check your email inbox and spam folder for the verification code.
                  </p>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold gradient-primary shadow-lg shadow-sky-500/30 hover:opacity-95 transition-all"
                disabled={isLoading || (isOtpStep && otp.trim().length !== 6)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isOtpStep ? "Verifying" : t("signingIn")}
                  </>
                ) : (
                  <>
                    {isOtpStep ? "Verify OTP" : t("signIn")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {isOtpStep && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={handleBackToLogin}
                  >
                    Back to login
                  </button>
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline disabled:opacity-50"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                </div>
              )}
            </form>

            <div className="mt-8 pt-6 border-t border-border/70 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <button type="button" className="hover:text-foreground transition-colors">
                {t("contactSupport")}
              </button>
              <span className="text-border">·</span>
              <button type="button" className="hover:text-foreground transition-colors">
                {t("itHelpdesk")}
              </button>
            </div>
          </div>


        </motion.div>
      </div>
    </div>
  );
}
