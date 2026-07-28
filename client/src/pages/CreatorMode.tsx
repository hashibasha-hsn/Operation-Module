import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/contexts/PermissionContext";
import {
  Users,
  Tag,
  Building2,
  Lock,
  Zap,
  Mail,
  BookOpen,
  BarChart3,
  Bell,
  Workflow,
  ClipboardList,
  AlertCircle,
  Shield,
  CheckSquare,
  Loader2,
} from "lucide-react";

const CARD_HOVER =
  "hover:border-sky-300 hover:bg-gradient-to-br hover:from-sky-50 hover:to-cyan-50 hover:shadow-md hover:shadow-sky-500/10";

type ToolDef = {
  titleKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  /** Feature name(s) from role-to-permission mapping; any match grants access. */
  permissions?: string[];
  /** Require creator-capable Taqtics role */
  requiresCreator?: boolean;
};

const CREATION_AND_CONFIG: ToolDef[] = [
  {
    titleKey: "processAndWorkflow",
    icon: Workflow,
    href: "/process",
    permissions: ["workflow_view", "workflow_create", "workflow_edit"],
  },
  {
    titleKey: "contentAndLearning",
    icon: BookOpen,
    href: "/categories-and-courses",
    permissions: ["learning_view"],
  },
  {
    titleKey: "attendance",
    icon: BarChart3,
    href: "/attendance",
    permissions: ["reporting_dashboard", "user_view"],
  },
  {
    titleKey: "actionPointAndTicketConfig",
    icon: CheckSquare,
    href: "/ticket-setup",
    permissions: ["ticket_create", "ticket_resolve"],
  },
  {
    titleKey: "assessments",
    icon: ClipboardList,
    href: "/assessments",
    permissions: ["learning_view", "workflow_view"],
  },
];

const MANAGEMENT: ToolDef[] = [
  {
    titleKey: "manageUsers",
    icon: Users,
    href: "/users",
    permissions: ["user_view", "user_create", "user_edit"],
  },
  {
    titleKey: "featurePermissions",
    icon: Shield,
    href: "/feature-permissions",
    permissions: ["designation_edit", "designation_create", "user_edit"],
  },
  {
    titleKey: "manageEntity",
    icon: Building2,
    href: "/entities",
    permissions: ["user_view", "designation_edit"],
  },
  {
    titleKey: "manageTags",
    icon: Tag,
    href: "/tags",
    permissions: ["workflow_edit", "user_edit"],
  },
  {
    titleKey: "auditLogs",
    icon: AlertCircle,
    href: "/audit",
    permissions: ["workflow_view", "reporting_dashboard"],
  },
  {
    titleKey: "noticeBoard",
    icon: Bell,
    href: "/noticeboard",
    permissions: ["learning_view", "user_view"],
  },
];

const SETTINGS: ToolDef[] = [
  {
    titleKey: "securitySettings",
    icon: Lock,
    href: "/security",
    permissions: ["user_edit", "designation_edit"],
  },
  {
    titleKey: "emailConfig",
    icon: Mail,
    href: "/email-config",
    permissions: ["user_edit", "designation_edit"],
  },
  {
    titleKey: "adminCenter",
    icon: Zap,
    href: "/admin",
    permissions: ["user_create", "designation_create"],
    requiresCreator: true,
  },
];

interface ToolCardProps extends ToolDef {
  allowed: boolean;
}

function ToolCard({ titleKey, icon: Icon, href, allowed }: ToolCardProps) {
  const { t } = useLanguage();

  if (!allowed) {
    return (
      <Card className="h-full bg-slate-50 border-slate-200 opacity-55">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
            <Icon className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-500">{t(titleKey)}</p>
          <p className="text-[11px] text-muted-foreground">No permission</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={href}>
      <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
        <Card
          className={`cursor-pointer h-full bg-white border-slate-200 transition-all duration-300 ${CARD_HOVER}`}
        >
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
  canAccess,
}: {
  title: string;
  tools: ToolDef[];
  delay: number;
  canAccess: (tool: ToolDef) => boolean;
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
            <ToolCard {...tool} allowed={canAccess(tool)} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function CreatorMode() {
  const { t } = useLanguage();
  const { hasPermission, hasCreatorAccess, loading, userRole } = usePermissions();

  const canAccess = (tool: ToolDef) => {
    if (tool.requiresCreator && !hasCreatorAccess) return false;
    if (!tool.permissions || tool.permissions.length === 0) return true;
    return tool.permissions.some((permission) => hasPermission(permission));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh] text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading permissions…
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-white min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("creatorMode")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure processes, learning content, users, and platform settings.
          {userRole ? ` · Role: ${userRole}` : ""}
        </p>
      </div>

      <Section
        title={t("creationAndConfigurations")}
        tools={CREATION_AND_CONFIG}
        delay={0}
        canAccess={canAccess}
      />
      <Section title={t("management")} tools={MANAGEMENT} delay={0.1} canAccess={canAccess} />
      <Section title={t("settings")} tools={SETTINGS} delay={0.2} canAccess={canAccess} />
    </div>
  );
}
