import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Flame,
  MessageCircle,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  addNoticeboardComment,
  fetchNoticeboardComments,
  fetchNoticeboardPosts,
  toggleNoticeboardLike,
  type NoticeboardComment,
} from "@/lib/noticeboardApi";
import { getCurrentUser, getCurrentUserId } from "@/lib/processSubmission";
import NoticeboardMedia from "@/components/NoticeboardMedia";
import { toast } from "sonner";

export default function Dashboard() {
  const { t } = useLanguage();
  const [dateOffset, setDateOffset] = useState(0);
  const [noticeboardPosts, setNoticeboardPosts] = useState<any[]>([]);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, NoticeboardComment[]>>({});
  const currentUser = getCurrentUser();
  const currentUserId = getCurrentUserId();
  const currentDate = new Date();
  const daysOfWeek = [];

  useEffect(() => {
    fetchNoticeboardPostsFromApi();
  }, []);

  const fetchNoticeboardPostsFromApi = async () => {
    try {
      const data = await fetchNoticeboardPosts('default-org', true);
      setNoticeboardPosts(data);
    } catch (err) {
      console.error('Failed to fetch noticeboard posts:', err);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUserId) {
      toast.error(t('pleaseLoginToLike'));
      return;
    }
    const updated = await toggleNoticeboardLike(postId, currentUserId);
    if (updated) {
      setNoticeboardPosts((prev) => prev.map((post) => (post.id === postId ? updated : post)));
    }
  };

  const handleToggleComments = async (postId: string) => {
    const nextOpen = !openComments[postId];
    setOpenComments((prev) => ({ ...prev, [postId]: nextOpen }));
    if (nextOpen && !postComments[postId]) {
      const comments = await fetchNoticeboardComments(postId);
      setPostComments((prev) => ({ ...prev, [postId]: comments }));
    }
  };

  const handleSubmitComment = async (postId: string) => {
    const comment = commentDrafts[postId]?.trim();
    if (!comment) return;
    if (!currentUserId) {
      toast.error(t('pleaseLoginToComment'));
      return;
    }
    const result = await addNoticeboardComment(postId, {
      userId: currentUserId,
      userName: currentUser.fullName || currentUser.name || currentUser.email || "User",
      comment,
    });
    if (!result) {
      toast.error(t('failedToAddComment'));
      return;
    }
    setNoticeboardPosts((prev) => prev.map((post) => (post.id === postId ? result.post : post)));
    setPostComments((prev) => ({ ...prev, [postId]: result.comments }));
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
  };

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
    <div className="p-6 space-y-6 bg-muted/30 min-h-screen">
      {/* Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="bg-card p-1 rounded-lg shadow-sm border border-border/60 flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger
                value="activity"
                className="flex-1 text-center py-2 px-4 rounded-md transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                className="flex-1 text-center py-2 px-4 rounded-md transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                className="flex-1 text-center py-2 px-4 rounded-md transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
                          className="text-3xl font-bold text-primary"
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
                                  ? "bg-primary text-primary-foreground shadow-sm"
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
                    {[].map((task: string, idx: number) => (
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
                  {!Array.isArray(noticeboardPosts) || noticeboardPosts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {t('noNoticeboardPostsAvailable')}
                    </div>
                  ) : (
                    noticeboardPosts.slice(0, 3).map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-3"
                      >
                        {post.fileUrl ? (
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-md bg-gray-100">
                            <NoticeboardMedia
                              post={post}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </div>
                        ) : post.fileName ? (
                          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Media missing — edit this post in Notice Board and re-upload the image or video.
                          </p>
                        ) : null}
                        <div>
                          <h3 className="font-semibold text-sm text-gray-800">{post.title}</h3>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{post.description}</p>
                        </div>
                        <div className="flex gap-4 mt-3 text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleLikePost(post.id)}
                                className="flex items-center gap-1 cursor-pointer text-gray-600 hover:text-orange-600 transition-all duration-300"
                              >
                                <Flame className="w-4 h-4 text-primary/80" />
                                <span>{post.likesCount || 0}</span>
                              </motion.button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('likes')}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleToggleComments(post.id)}
                                className="flex items-center gap-1 cursor-pointer text-gray-600 hover:text-green-600 transition-all duration-300"
                              >
                                <MessageCircle className="w-4 h-4 text-green-500" />
                                <span>{post.commentsCount || 0}</span>
                              </motion.button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('comments')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {openComments[post.id] && (
                          <div className="space-y-2 rounded-lg border bg-gray-50 p-3">
                            {(postComments[post.id] ?? []).length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t('noCommentsYet')}</p>
                            ) : (
                              (postComments[post.id] ?? []).map((item) => (
                                <div key={item.id} className="text-xs">
                                  <span className="font-medium text-gray-800">
                                    {item.userName || "User"}:
                                  </span>{" "}
                                  <span className="text-gray-600">{item.comment}</span>
                                </div>
                              ))
                            )}
                            <div className="flex gap-2">
                              <Input
                                value={commentDrafts[post.id] ?? ""}
                                onChange={(e) =>
                                  setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                                }
                                placeholder={t('writeAComment')}
                                className="h-8 text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSubmitComment(post.id);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => handleSubmitComment(post.id)}
                              >
                                {t('postComment')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
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
