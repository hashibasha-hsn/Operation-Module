import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  Layers,
  Workflow,
  ClipboardList,
  AlertCircle,
} from "lucide-react";

const CREATION_AND_CONFIG = [
  {
    titleKey: "processAndWorkflow",
    icon: Workflow,
    href: "/process",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
  {
    titleKey: "contentAndLearning",
    icon: BookOpen,
    href: "/categories-and-courses",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
  {
    titleKey: "attendance",
    icon: BarChart3,
    href: "/attendance",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
  {
    titleKey: "actionPointAndTicketConfig",
    icon: CheckSquare,
    href: "/audit",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
  {
    titleKey: "assessment",
    icon: ClipboardList,
    href: "/assessments",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
];

const MANAGEMENT = [
  {
    titleKey: "manageUsers",
    icon: Users,
    href: "/users",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
  {
    titleKey: "manageEntity",
    icon: Building2,
    href: "/entities",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
  {
    titleKey: "manageTags",
    icon: Tag,
    href: "/tags",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
  {
    titleKey: "auditLogs",
    icon: AlertCircle,
    href: "/audit",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
  {
    titleKey: "noticeBoard",
    icon: Bell,
    href: "/noticeboard",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
];

const SETTINGS = [
  {
    titleKey: "securitySettings",
    icon: Lock,
    href: "/security",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
  {
    titleKey: "adminCenter",
    icon: Zap,
    href: "/admin",
    hoverColor: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-orange-400 hover:to-red-400",
  },
];

interface ToolCardProps {
  titleKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  hoverColor: string;
}

function ToolCard({ titleKey, icon: Icon, href, hoverColor }: ToolCardProps) {
  const { t } = useLanguage();
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.08, y: -6, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card className={`cursor-pointer hover:shadow-2xl transition-all duration-500 h-full bg-white ${hoverColor} relative overflow-hidden`}>
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-transparent via-white/50 to-transparent opacity-0"
            whileHover={{
              opacity: 1,
              x: ["-100%", "100%"],
            }}
            transition={{ duration: 0.6 }}
          />
          <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3 relative z-10">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.3 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <Icon className="w-8 h-8 text-primary" />
            </motion.div>
            <motion.p
              whileHover={{ scale: 1.05 }}
              className="text-sm font-medium text-foreground"
            >
              {t(titleKey)}
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

export default function CreatorMode() {
  const { t } = useLanguage();
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      {/* Creation and Configurations Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
          className="bg-gradient-to-br from-yellow-50 to-red-50 rounded-lg p-6 shadow-lg bg-[length:200%_200%]"
        >
          <h2 className="text-lg font-semibold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent mb-6">
            {t('creationAndConfigurations')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {CREATION_AND_CONFIG.map((tool, idx) => (
              <motion.div
                key={tool.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <ToolCard {...tool} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
          className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 shadow-lg bg-[length:200%_200%]"
        >
          <h2 className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-6">
            {t('management')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {MANAGEMENT.map((tool, idx) => (
              <motion.div
                key={tool.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
              >
                <ToolCard {...tool} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "linear",
          }}
          className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6 shadow-lg bg-[length:200%_200%]"
        >
          <h2 className="text-lg font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-6">
            {t('settings')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {SETTINGS.map((tool, idx) => (
              <motion.div
                key={tool.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
              >
                <ToolCard {...tool} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
