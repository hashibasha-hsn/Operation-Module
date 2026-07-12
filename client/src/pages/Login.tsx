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
import { PLATFORM_NAME, PLATFORM_SHORT_NAME } from "@/lib/branding";
import PlatformMark from "@/components/PlatformMark";
import { AUTH_API } from "@/lib/apiConfig";

const HIGHLIGHTS = [
  { icon: CheckSquare, titleKey: "tasks", desc: "Track daily operations and approvals" },
  { icon: BarChart3, titleKey: "reports", desc: "Insights across stores and workflows" },
  { icon: Shield, titleKey: "securitySettings", desc: "Role-based access and audit trails" },
];

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${AUTH_API}/check-setup`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    try {
      const response = await fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, password: trimmedPassword }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.access_token) {
        const userRecord = {
          ...data.user,
          userId: data.user?.userId ?? data.user?.id,
          email: data.user?.email ?? normalizedEmail,
          organizationId: data.user?.organizationId ?? "default-org",
        };
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("refreshToken", data.refresh_token);
        localStorage.setItem("user", JSON.stringify(userRecord));
        navigate("/dashboard");
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
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("welcomeBack")}</h2>
              <p className="text-muted-foreground mt-2">{t("pleaseEnterDetailsSignIn")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t("forgotPassword")}
                </button>
              </div>

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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("signingIn")}
                  </>
                ) : (
                  <>
                    {t("signIn")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
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

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo: <span className="font-medium text-foreground/80">admin@hashibasha.com</span> /{" "}
            <span className="font-medium text-foreground/80">admin123</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
