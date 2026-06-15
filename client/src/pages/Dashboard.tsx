import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Ticket,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Info,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Dashboard() {
  const { t } = useLanguage();
  const [dateOffset, setDateOffset] = useState(0);
  const currentDate = new Date();
  const daysOfWeek = [];

  // Generate calendar days based on offset
  for (let i = 0; i < 3; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + dateOffset + i);
    daysOfWeek.push(date);
  }

  const handlePreviousDates = () => {
    setDateOffset(prev => prev - 1);
  };

  const handleNextDates = () => {
    setDateOffset(prev => prev + 1);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      {/* Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="bg-white p-1 rounded-lg shadow-sm flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger
                value="activity"
                className="flex-1 text-center py-2 px-4 rounded-md transition-all duration-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 hover:bg-orange-100 hover:text-orange-600"
              >
                {t('activityOverview')}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('viewActivityOverview')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger
                value="analytics"
                className="flex-1 text-center py-2 px-4 rounded-md transition-all duration-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 hover:bg-orange-100 hover:text-orange-600"
              >
                {t('summaryAnalytics')}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('viewSummaryAnalytics')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger
                value="reports"
                className="flex-1 text-center py-2 px-4 rounded-md transition-all duration-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 hover:bg-orange-100 hover:text-orange-600"
              >
                {t('customReports')}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('viewCustomReports')}</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <TabsContent value="activity" className="space-y-6 mt-6">
          {/* Summary Cards with white backgrounds and colored indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { titleKey: "processAndWorkflow", icon: CheckCircle2, badgeColor: "bg-yellow-100 text-yellow-700", borderColor: "border-yellow-400" },
              { titleKey: "actionPoint", icon: AlertCircle, badgeColor: "bg-red-100 text-red-700", borderColor: "border-red-400" },
              { titleKey: "learning", icon: BookOpen, badgeColor: "bg-blue-100 text-blue-700", borderColor: "border-blue-400" },
              { titleKey: "ticket", icon: Ticket, badgeColor: "bg-green-100 text-green-700", borderColor: "border-green-400" },
            ].map((card, idx) => (
              <motion.div
                key={card.titleKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-gray-200 hover:border-gray-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-800">
                        <card.icon className="w-4 h-4" />
                        {t(card.titleKey)}
                      </CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.2 }}
                            transition={{ duration: 0.6 }}
                          >
                            <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('moreInfoAbout')} {t(card.titleKey)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{t('pending')}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.badgeColor}`}>0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{t('inProgress')}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.badgeColor}`}>0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{t('completed')}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.badgeColor}`}>0</span>
                      </div>
                      <div className="text-center mt-4 pt-3 border-t border-gray-100">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-3xl font-bold text-orange-500"
                        >
                          0
                        </motion.div>
                        <p className="text-xs text-gray-500 mt-1">{t('assigned')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Tasks in Queue, Notice Board, Activity and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tasks in Queue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="hover:shadow-2xl transition-all duration-500 hover:scale-102 hover:-translate-y-1 gradient-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t('tasksInQueue')}</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            {t('seeAll')}
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('viewAllTasksInQueue')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Calendar */}
                  <div className="flex items-center justify-between mb-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreviousDates}>
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('previousDates')}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex gap-2">
                      {daysOfWeek.map((date, idx) => (
                        <Tooltip key={idx}>
                          <TooltipTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`text-center p-2 rounded-lg cursor-pointer transition-all duration-300 min-w-[60px] ${
                                idx === 0
                                  ? "bg-orange-500 text-white shadow-md"
                                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
                              }`}
                            >
                              <div className="text-xs font-medium">
                                {date.toLocaleDateString("en-US", { weekday: "short" })}
                              </div>
                              <div className="text-lg font-bold">{date.getDate()}</div>
                              <div className="text-xs">
                                {date.toLocaleDateString("en-US", { month: "short" })}
                              </div>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextDates}>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('nextDates')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Task List */}
                  <div className="space-y-3">
                    {["Task 1", "Task 2", "Task 3"].map((task, idx) => (
                      <Tooltip key={task}>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + idx * 0.1 }}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800">{task}</span>
                              <span className="text-xs text-gray-500">
                                {idx === 0 ? t('pending') : idx === 1 ? t('inProgress') : t('completed')}
                              </span>
                            </div>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('viewTaskDetails').replace('{task}', task)}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notice Board */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t('noticeBoard')}</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            {t('seeAll')}
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('viewAllNotices')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Video/Media Placeholder */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-gradient-to-br from-yellow-400 via-orange-500 to-orange-600 rounded-lg aspect-video flex items-center justify-center cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40">
                            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('playVideo')}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Notice Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3 className="font-semibold text-sm text-gray-800">Hashi Basha</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      When the taste and flavor meets, the details of the tale begin Hashi Basha.
                    </p>
                    <div className="flex gap-4 mt-3 text-xs">
                      {[
                        { emoji: "👍", label: "145 Likes", color: "text-gray-600", tooltipKey: "likeThisNotice" },
                        { emoji: "👎", label: "7 Dislikes", color: "text-gray-600", tooltipKey: "dislikeThisNotice" },
                        { emoji: "💬", label: "15 Discussions", color: "text-gray-600", tooltipKey: "viewDiscussions" },
                      ].map((item, idx) => (
                        <Tooltip key={item.label}>
                          <TooltipTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`flex items-center gap-1 cursor-pointer ${item.color} hover:text-gray-800 transition-all duration-300`}
                            >
                              <span>{item.emoji}</span>
                              <span>{item.label}</span>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t(item.tooltipKey)}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity and Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-base text-gray-800">{t('alertsAndActivity')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center py-8 text-gray-500"
                  >
                    <p className="text-sm">{t('noData')}</p>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">{t('summaryAnalyticsContentComingSoon')}</p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">{t('customReportsContentComingSoon')}</p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
