import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Settings,
  Users,
  FileText,
  CheckSquare,
  Tag,
  Building2,
  Lock,
  Zap,
  BookOpen,
  BarChart3,
  Bell,
  Workflow,
  ClipboardList,
  AlertCircle,
} from "lucide-react";

const CARD_HOVER =
  "hover:border-sky-300 hover:bg-gradient-to-br hover:from-sky-50 hover:to-cyan-50 hover:shadow-md hover:shadow-sky-500/10";

const CREATION_AND_CONFIG = [
  { titleKey: "processAndWorkflow", icon: Workflow, href: "/process" },
  { titleKey: "contentAndLearning", icon: BookOpen, href: "/categories-and-courses" },
  { titleKey: "attendance", icon: BarChart3, href: "/attendance" },
  { titleKey: "actionPointAndTicketConfig", icon: CheckSquare, href: "/ticket-setup" },
  { titleKey: "assessments", icon: ClipboardList, href: "/assessments" },
];

const MANAGEMENT = [
  { titleKey: "manageUsers", icon: Users, href: "/users" },
  { titleKey: "manageEntity", icon: Building2, href: "/entities" },
  { titleKey: "manageTags", icon: Tag, href: "/tags" },
  { titleKey: "auditLogs", icon: AlertCircle, href: "/audit" },
  { titleKey: "noticeBoard", icon: Bell, href: "/noticeboard" },
];

const SETTINGS = [
  { titleKey: "securitySettings", icon: Lock, href: "/security" },
  { titleKey: "adminCenter", icon: Zap, href: "/admin" },
];

interface ToolCardProps {
  titleKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

function ToolCard({ titleKey, icon: Icon, href }: ToolCardProps) {
  const { t } = useLanguage();
  return (
    <Link href={href}>
      <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
        <Card className={`cursor-pointer h-full bg-white border-slate-200 transition-all duration-300 ${CARD_HOVER}`}>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-800">{t(titleKey)}</p>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

function Section({
  title,
  tools,
  delay,
}: {
  title: string;
  tools: ToolCardProps[];
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="creator-section"
    >
      <h2 className="creator-section-title">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {tools.map((tool, idx) => (
          <motion.div
            key={tool.href + tool.titleKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + idx * 0.05 }}
          >
            <ToolCard {...tool} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function CreatorMode() {
  const { t } = useLanguage();
  return (
    <div className="p-8 space-y-8 bg-white min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("creatorMode")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure processes, learning content, users, and platform settings.
        </p>
      </div>

      <Section title={t("creationAndConfigurations")} tools={CREATION_AND_CONFIG} delay={0} />
      <Section title={t("management")} tools={MANAGEMENT} delay={0.1} />
      <Section title={t("settings")} tools={SETTINGS} delay={0.2} />
    </div>
  );
}
