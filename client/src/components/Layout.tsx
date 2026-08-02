import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  LogOut,
  Settings,
  User,
  Lock,
  Plus,
  Home,
  CheckSquare,
  Flag,
  BookOpen,
  Ticket,
  BarChart3,
  ArrowLeft,
  Bell,
  Globe,
  PieChart,
  GraduationCap,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBellMenu from "@/components/NotificationBellMenu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { PLATFORM_NAME, PLATFORM_SHORT_NAME } from "@/lib/branding";
import PlatformMark from "@/components/PlatformMark";
import {
  getAuthItem,
  getStoredUser,
  isProfileSetupComplete,
  logoutAuthSession,
} from "@/lib/authStorage";
import { usePermissions } from "@/contexts/PermissionContext";

const SIDEBAR_ITEMS = [
  { labelKey: "home", href: "/dashboard", icon: Home },
  { labelKey: "tasks", href: "/tasks", icon: CheckSquare },
  { labelKey: "actionPoints", href: "/action-points", icon: Flag },
  { labelKey: "learning", href: "/learning", icon: GraduationCap },
  { labelKey: "issueTickets", href: "/tickets", icon: Ticket },
];

const REPORTS_SUBMENU = [
  { labelKey: "storeHealthCompliance", href: "/executive-dashboard", icon: PieChart },
  { labelKey: "customDashboards", href: "/custom-dashboards", icon: LayoutGrid },
  { labelKey: "reportingAndInsights", href: "/reporting", icon: BarChart3 },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const { language, setLanguage, t, dir } = useLanguage();
  const { isSuperAdmin } = usePermissions();
  const [location, navigate] = useLocation();
  const user = getStoredUser();
  const currentUserName = String(
    user.fullName || user.name || user.email || "User",
  ).trim();
  const currentUserInitial = currentUserName.charAt(0).toUpperCase() || "U";

  // Keep incomplete profiles on profile setup until name, store, and manager are saved.
  // Super admins are exempt — they manage the platform and don't need a store onboarding.
  useEffect(() => {
    const authenticated = getAuthItem("isAuthenticated") === "true" || Boolean(getAuthItem("accessToken"));
    if (!authenticated) return;
    if (location.startsWith("/profile-settings") || location.startsWith("/login")) return;
    const storedUser = getStoredUser();
    if (storedUser.role === "super_admin") return;
    if (!isProfileSetupComplete(storedUser)) {
      navigate("/profile-settings?setup=1");
    }
  }, [location, navigate]);

  const isReportsRoute = REPORTS_SUBMENU.some(
    (item) => location === item.href || location.startsWith(`${item.href}/`),
  );

  const goBack = () => {
    window.history.back();
  };

  const handleLogout = () => {
    void logoutAuthSession();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background" dir={dir}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="gradient-sidebar border-r border-sidebar-border flex flex-col overflow-hidden shadow-sm"
        style={{ minWidth: "80px", maxWidth: "256px" }}
      >
        <div className="p-4 border-b border-sidebar-border relative z-10">
          <Link href="/dashboard">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PlatformMark size="sm" className="bg-sky-500/15 border-sky-500/20 text-sky-700" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="font-bold text-sidebar-foreground text-sm leading-tight"
                  >
                    {PLATFORM_NAME}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="sidebar-nav-item w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 mb-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("collapse")}
            </button>
          )}

          {!sidebarOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="sidebar-nav-item w-full flex items-center justify-center px-3 py-2 rounded-md mb-2"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{t("expand")}</TooltipContent>
            </Tooltip>
          )}

          {SIDEBAR_ITEMS.map((item, index) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => navigate(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                      isActive ? "sidebar-nav-active" : "sidebar-nav-item text-sidebar-foreground/85"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        >
                          {t(item.labelKey)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
              </Tooltip>
            );
          })}

          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setReportsOpen(!reportsOpen)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                    isReportsRoute ? "sidebar-nav-active" : "sidebar-nav-item text-sidebar-foreground/85"
                  }`}
                >
                  <BookOpen className="w-[18px] h-[18px] flex-shrink-0" />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <>
                        <motion.span className="text-sm font-medium flex-1 text-left whitespace-nowrap overflow-hidden">
                          {t("reports")}
                        </motion.span>
                        <motion.div animate={{ rotate: reportsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">{t("reports")}</TooltipContent>
            </Tooltip>

            <AnimatePresence>
              {reportsOpen && sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-3 mt-1 space-y-0.5 overflow-hidden border-l border-sky-200/80 pl-2"
                >
                  {REPORTS_SUBMENU.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <motion.button
                          whileHover={{ x: 2 }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-all text-xs ${
                            isActive
                              ? "sidebar-nav-active !py-2"
                              : "sidebar-nav-item text-sidebar-foreground/80"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {t(item.labelKey)}
                        </motion.button>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/creator-mode">
                <motion.button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-sky-600 to-cyan-600 text-white hover:from-sky-700 hover:to-cyan-700 transition-all shadow-sm">
                  <Plus className="w-4 h-4" />
                  {sidebarOpen && <span className="text-sm font-medium">{t("creatorMode")}</span>}
                </motion.button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t("creatorMode")}</TooltipContent>
          </Tooltip>
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 pb-2 space-y-1 text-xs"
            >
              <button
                type="button"
                onClick={() => setShowLanguageDialog(true)}
                className="sidebar-nav-item w-full flex items-center gap-2 px-3 py-2 rounded-md text-sidebar-foreground/80"
              >
                <span>🌐</span>
                <span>{t("language")}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {sidebarOpen && (
          <div className="p-3 border-t border-sidebar-border text-center">
            <span className="text-xs font-semibold text-sidebar-foreground/60">{PLATFORM_SHORT_NAME}</span>
          </div>
        )}
      </motion.aside>

      <div className="flex-1 flex flex-col">
        <div className="relative gradient-header backdrop-blur-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={goBack}
              className="text-white/90 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t("back")}
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBellMenu />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-white/90 hover:bg-white/10 hover:text-white"
                >
                  <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center border border-white/25">
                    <span className="text-white font-semibold text-sm">{currentUserInitial}</span>
                  </div>
                  <span className="font-medium text-white">{currentUserName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => navigate("/notifications")}
                >
                  <Bell className="w-4 h-4" />
                  {t("notifications") || "Notifications"}
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/profile-settings")}>
                  <User className="w-4 h-4" />
                  {t("profileSettings")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => navigate("/profile-settings?tab=password")}
                >
                  <Lock className="w-4 h-4" />
                  {t("changePassword")}
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/platform-settings")}>
                  <Settings className="w-4 h-4" />
                  {t("platformSettings")}
                </DropdownMenuItem>
                {isSuperAdmin() && (
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/super-admin")}>
                    <ShieldCheck className="w-4 h-4" />
                    {t("superAdmin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600">
                  <LogOut className="w-4 h-4" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-auto omp-page-bg"
        >
          {children}
        </motion.main>
      </div>

      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t("language")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <button
              onClick={() => {
                setLanguage("en");
                setShowLanguageDialog(false);
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                language === "en" ? "border-sky-500 bg-sky-50" : "border-border hover:border-sky-300"
              }`}
            >
              <span className="text-2xl">🇺🇸</span>
              <div className="text-left">
                <div className="font-medium">{t("english")}</div>
                <div className="text-sm text-muted-foreground">{t("unitedStates")}</div>
              </div>
              {language === "en" && <div className="ml-auto text-sky-600">✓</div>}
            </button>
            <button
              onClick={() => {
                setLanguage("ar");
                setShowLanguageDialog(false);
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                language === "ar" ? "border-sky-500 bg-sky-50" : "border-border hover:border-sky-300"
              }`}
            >
              <span className="text-2xl">🇸🇦</span>
              <div className="text-left">
                <div className="font-medium">العربية</div>
                <div className="text-sm text-muted-foreground">{t("arabicLanguage")}</div>
              </div>
              {language === "ar" && <div className="ml-auto text-sky-600">✓</div>}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
