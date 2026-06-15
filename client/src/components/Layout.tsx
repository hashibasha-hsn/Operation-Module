import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LogOut, Settings, User, Plus, Home, CheckSquare, AlertCircle, BookOpen, Ticket, BarChart3, ArrowLeft, Bell, Users, Building2, FileText, Shield, Layers, Package, GraduationCap, ClipboardList, MessageSquare, Database, Cog, Globe, LineChart, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

const SIDEBAR_ITEMS = [
  { labelKey: "home", href: "/dashboard", icon: Home },
  { labelKey: "tasks", href: "/tasks", icon: CheckSquare },
  { labelKey: "actionPoints", href: "/action-points", icon: AlertCircle },
  { labelKey: "issueTickets", href: "/tickets", icon: Ticket },
  { labelKey: "workflows", href: "/workflows", icon: Layers },
  { labelKey: "approvals", href: "/approvals", icon: ClipboardList },
  { labelKey: "learning", href: "/learning", icon: BookOpen },
  { labelKey: "courses", href: "/courses", icon: GraduationCap },
  { labelKey: "assessments", href: "/assessments", icon: FileText },
  { labelKey: "assets", href: "/assets", icon: Package },
  { labelKey: "users", href: "/users", icon: Users },
  { labelKey: "noticeboard", href: "/noticeboard", icon: MessageSquare },
];

const REPORTS_SUBMENU = [
  { labelKey: "standardReports", href: "/standard-reports", icon: LineChart },
  { labelKey: "executiveDashboard", href: "/executive-dashboard", icon: Clock },
  { labelKey: "biDashboard", href: "/bi-dashboard", icon: BarChart3 },
];

const ADMIN_SUBMENU = [
  { labelKey: "organizations", href: "/entities", icon: Building2 },
  { labelKey: "tags", href: "/tags", icon: FileText },
  { labelKey: "platformSettings", href: "/platform-settings", icon: Cog },
  { labelKey: "securitySettings", href: "/security", icon: Shield },
  { labelKey: "profileSettings", href: "/profile-settings", icon: User },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [location, navigate] = useLocation();

  const goBack = () => {
    window.history.back();
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // All users can access all features - no permission filtering
  const filteredSidebarItems = SIDEBAR_ITEMS;
  const filteredReportsSubmenu = REPORTS_SUBMENU;
  const filteredAdminSubmenu = ADMIN_SUBMENU;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Always visible */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-gradient-to-b from-[#0f172a] to-[#1e3a8a] border-r border-blue-900/30 flex flex-col overflow-hidden"
        style={{ minWidth: '80px', maxWidth: '256px', display: 'flex', visibility: 'visible', opacity: 1 }}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border relative z-10">
          <Link href="/dashboard">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360, boxShadow: "0 0 20px rgba(234, 179, 8, 0.5)" }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-white font-bold text-lg">H</span>
              </motion.div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="font-bold text-white text-lg"
                  >
                    Hashibasha
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSidebarItems.map((item, index) => {
            const activeTab = localStorage.getItem("activeTab");
            const isActive = location === item.href && !(location === "/tasks" && activeTab === "action-point") || (item.href === "/tasks?tab=action-point" && location === "/tasks" && activeTab === "action-point");
            const Icon = item.icon;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (item.href === "/tasks?tab=action-point") {
                        localStorage.setItem("activeTab", "action-point");
                        window.location.href = "/tasks";
                      } else if (item.href === "/tasks") {
                        localStorage.removeItem("activeTab");
                        window.location.href = "/tasks";
                      } else {
                        navigate(item.href);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-white/20 text-white shadow-lg"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        >
                          {t(item.labelKey)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t(item.labelKey)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Reports Submenu */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setReportsOpen(!reportsOpen)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-white hover:bg-white/10 transition-colors"
                >
                  <BarChart3 className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <>
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm font-medium flex-1 text-left whitespace-nowrap overflow-hidden"
                        >
                          {t('reports')}
                        </motion.span>
                        <motion.div
                          animate={{ rotate: reportsOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('reports')}</p>
              </TooltipContent>
            </Tooltip>
            <AnimatePresence>
              {reportsOpen && sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-6 space-y-1 mt-1 overflow-hidden"
                >
                  {filteredReportsSubmenu.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href}>
                        <motion.button
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-white hover:bg-white/10 transition-colors text-xs"
                        >
                          <Icon className="w-4 h-4" />
                          {t(item.labelKey)}
                        </motion.button>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Admin Submenu */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setAdminOpen(!adminOpen)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-white hover:bg-white/10 transition-colors"
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <>
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm font-medium flex-1 text-left whitespace-nowrap overflow-hidden"
                        >
                          {t('admin')}
                        </motion.span>
                        <motion.div
                          animate={{ rotate: adminOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('admin')}</p>
              </TooltipContent>
            </Tooltip>
            <AnimatePresence>
              {adminOpen && sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-6 space-y-1 mt-1 overflow-hidden"
                >
                  {filteredAdminSubmenu.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href}>
                        <motion.button
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-white hover:bg-white/10 transition-colors text-xs"
                        >
                          <Icon className="w-4 h-4" />
                          {t(item.labelKey)}
                        </motion.button>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </nav>

        {/* Creator Mode Button - All users can access */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/creator-mode">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-yellow-500 to-red-500 text-white hover:from-yellow-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {t('creatorMode')}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{t('creatorMode')}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Language & Help */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 text-xs"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05, x: 4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLanguageDialog(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-white hover:bg-white/10 transition-colors"
                  >
                    <span>🌐</span>
                    <span>{t('language')}</span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t('language')}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05, x: 4 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-white hover:bg-white/10 transition-colors"
                  >
                    <span>?</span>
                    <span>{t('help')}</span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t('helpAndSupport')}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse Button */}
        <div className="p-4 border-t border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="w-full"
                >
                  {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{sidebarOpen ? t('collapse') : t('expand')}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Footer Logo */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 border-t border-sidebar-border text-center"
            >
              <span className="text-xs font-semibold text-white">hashibasha</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-blue-900/30 bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" onClick={goBack} className="text-white hover:bg-blue-700/50">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  {t('back')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('goBack')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9 relative text-white hover:bg-blue-700/50">
                  <Bell className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('notifications')}</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-blue-700/50">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold text-sm">S</span>
                  </div>
                  <span className="font-medium">Sayed</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/profile-settings")}>
                  <User className="w-4 h-4" />
                  {t('profileSettings')}
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/platform-settings")}>
                  <Settings className="w-4 h-4" />
                  {t('platformSettings')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-600">
                  <LogOut className="w-4 h-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-auto bg-[#f8f8f8]"
        >
          {children}
        </motion.main>
      </div>

      {/* Language Selection Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('language')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <button
              onClick={() => {
                setLanguage('en');
                setShowLanguageDialog(false);
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                language === 'en' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">🇺🇸</span>
              <div className="text-left">
                <div className="font-medium">English</div>
                <div className="text-sm text-muted-foreground">United States</div>
              </div>
              {language === 'en' && <div className="ml-auto">✓</div>}
            </button>
            <button
              onClick={() => {
                setLanguage('ar');
                setShowLanguageDialog(false);
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                language === 'ar' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">🇸🇦</span>
              <div className="text-left">
                <div className="font-medium">العربية</div>
                <div className="text-sm text-muted-foreground">Arabic</div>
              </div>
              {language === 'ar' && <div className="ml-auto">✓</div>}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
