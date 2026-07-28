import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BarChart3,
  LayoutGrid,
  LineChart,
  Store,
  Users,
  Shield,
  GraduationCap,
  ArrowRight,
  FileText,
  AlertCircle,
  Ticket,
  Package,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

const MAIN_SECTIONS = [
  {
    key: "storeHealthCompliance",
    descKey: "storeHealthComplianceDesc",
    href: "/executive-dashboard",
    icon: Store,
    gradient: "from-emerald-500 to-teal-600",
    rolesKey: "storeHealthRoles",
  },
  {
    key: "featureReports",
    descKey: "featureReportsDesc",
    href: "/feature-reports",
    icon: BarChart3,
    gradient: "from-orange-500 to-red-500",
    rolesKey: "featureReportsRoles",
  },
  {
    key: "customDashboards",
    descKey: "customDashboardsDesc",
    href: "/custom-dashboards",
    icon: LayoutGrid,
    gradient: "from-violet-500 to-purple-600",
    rolesKey: "customDashboardsRoles",
  },
] as const;

const STANDARD_REPORT_LINKS = [
  { labelKey: "myReport", href: "/standard-reports/my-report", icon: Users },
  { labelKey: "storeReport", href: "/standard-reports/store-report", icon: Store },
  { labelKey: "processReport", href: "/standard-reports/process-report", icon: FileText },
  { labelKey: "organizationReport", href: "/standard-reports/organization-report", icon: Shield },
  { labelKey: "visualReport", href: "/standard-reports/visual-report", icon: LineChart },
] as const;

const FEATURE_QUICK_LINKS = [
  { labelKey: "processReports", href: "/feature-reports", icon: FileText },
  { labelKey: "actionPointsReports", href: "/standard-reports/action-points-org-report", icon: AlertCircle },
  { labelKey: "ticketReports", href: "/standard-reports/ticket-org-report", icon: Ticket },
  { labelKey: "assetReports", href: "/standard-reports/asset-org-report", icon: Package },
  { labelKey: "learningReports", href: "/standard-reports/learning-org-report", icon: GraduationCap },
  { labelKey: "assessmentReports", href: "/standard-reports/assessment-results", icon: CheckCircle },
] as const;

export default function ReportingInsights() {
  const { t } = useLanguage();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <LineChart className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("reportingAndInsights")}</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">{t("reportingAndInsightsIntro")}</p>
          </div>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border bg-card p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold">{t("purposeOfReports")}</h2>
        <ul className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary mt-0.5">•</span>
            {t("reportPurposeVisibility")}
          </li>
          <li className="flex gap-2">
            <span className="text-primary mt-0.5">•</span>
            {t("reportPurposeCompliance")}
          </li>
          <li className="flex gap-2">
            <span className="text-primary mt-0.5">•</span>
            {t("reportPurposeActionable")}
          </li>
          <li className="flex gap-2">
            <span className="text-primary mt-0.5">•</span>
            {t("reportPurposeDecisions")}
          </li>
        </ul>
      </motion.section>

      <div className="grid md:grid-cols-3 gap-6">
        {MAIN_SECTIONS.map((section, idx) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.06 }}
            >
              <Link href={section.href}>
                <Card className="h-full cursor-pointer hover:shadow-lg transition-all hover:border-primary/40 group">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center mb-2`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {t(section.key)}
                    </CardTitle>
                    <CardDescription>{t(section.descKey)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">{t(section.rolesKey)}</p>
                    <Button variant="ghost" className="gap-2 p-0 h-auto text-primary">
                      {t("openSection")}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("standardReports")}</CardTitle>
            <CardDescription>{t("standardReportsHubDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {STANDARD_REPORT_LINKS.map(({ labelKey, href, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button variant="outline" className="w-full justify-between h-11">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {t(labelKey)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("featureReports")}</CardTitle>
            <CardDescription>{t("featureReportsHubDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-2">
            {FEATURE_QUICK_LINKS.map(({ labelKey, href, icon: Icon }) => (
              <Link key={labelKey} href={href}>
                <Button variant="outline" className="w-full justify-start gap-2 h-11">
                  <Icon className="h-4 w-4 text-primary" />
                  {t(labelKey)}
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </motion.section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex gap-3 items-start rounded-lg border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-900 p-4"
      >
        <Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{t("reportAccessTipTitle")}</p>
          <p className="text-sm text-amber-800/90 dark:text-amber-200/80">{t("reportAccessTip")}</p>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{t("storeManagers")}</Badge>
        <Badge variant="secondary">{t("regionalManagers")}</Badge>
        <Badge variant="secondary">{t("admins")}</Badge>
        <Badge variant="secondary">{t("executives")}</Badge>
        <Badge variant="secondary">{t("trainersAndHr")}</Badge>
      </div>
    </div>
  );
}
