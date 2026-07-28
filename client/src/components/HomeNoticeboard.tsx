import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Flame,
  MessageCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Megaphone,
  Eye,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStoredUser } from "@/lib/authStorage";
import {
  addNoticeboardComment,
  fetchNoticeboardComments,
  fetchNoticeboardPosts,
  formatNoticeboardSchedule,
  markNoticeboardPostRead,
  toggleNoticeboardLike,
  type NoticeboardComment,
  type NoticeboardPost,
} from "@/lib/noticeboardApi";
import NoticeboardMedia from "@/components/NoticeboardMedia";
import { toast } from "sonner";

const REFRESH_MS = 60_000;
const HOME_POST_LIMIT = 6;

type Props = {
  /** Max posts to show on home; default 6 */
  limit?: number;
};

export default function HomeNoticeboard({ limit = HOME_POST_LIMIT }: Props) {
  const { t } = useLanguage();
  const user = getStoredUser();
  const organizationId = String(user.organizationId || "default-org");
  const currentUserId = String(user.userId || user.id || "");
  const currentStoreId = String(user.entityId || user.storeId || "");
  const currentUserName =
    String(user.fullName || user.name || user.email || "User");

  const [posts, setPosts] = useState<NoticeboardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, NoticeboardComment[]>>({});
  const markingReadRef = useRef<Set<string>>(new Set());

  const loadPosts = useCallback(async () => {
    setError("");
    try {
      const data = await fetchNoticeboardPosts(organizationId, true, {
        userId: currentUserId || undefined,
        storeId: currentStoreId || undefined,
      });
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch noticeboard posts:", err);
      setError(t("failedToLoadNoticeboard") || "Failed to load notice board");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, currentUserId, currentStoreId, t]);

  useEffect(() => {
    setLoading(true);
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const onFocus = () => {
      void loadPosts();
    };
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => {
      void loadPosts();
    }, REFRESH_MS);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [loadPosts]);

  const markPostRead = useCallback(
    async (postId: string) => {
      if (!currentUserId) return;
      if (markingReadRef.current.has(postId)) return;

      const current = posts.find((post) => post.id === postId);
      if (current?.hasRead) return;

      markingReadRef.current.add(postId);
      try {
        const result = await markNoticeboardPostRead(postId, {
          userId: currentUserId,
          userName: currentUserName,
        });
        if (!result) return;
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...result.post,
                  hasRead: true,
                  readAt: result.read.createdAt,
                }
              : post,
          ),
        );
      } finally {
        markingReadRef.current.delete(postId);
      }
    },
    [currentUserId, currentUserName, posts],
  );

  const visiblePosts = [...posts].reverse().slice(0, limit);

  const handleLikePost = async (postId: string) => {
    if (!currentUserId) {
      toast.error(t("pleaseLoginToLike") || "Please log in to like posts");
      return;
    }
    void markPostRead(postId);
    const updated = await toggleNoticeboardLike(postId, currentUserId);
    if (updated) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...updated, hasRead: true, readAt: post.readAt || new Date().toISOString() }
            : post,
        ),
      );
    }
  };

  const handleToggleComments = async (postId: string) => {
    const nextOpen = !openComments[postId];
    setOpenComments((prev) => ({ ...prev, [postId]: nextOpen }));
    if (nextOpen) {
      void markPostRead(postId);
      if (!postComments[postId]) {
        const comments = await fetchNoticeboardComments(postId);
        setPostComments((prev) => ({ ...prev, [postId]: comments }));
      }
    }
  };

  const handleSubmitComment = async (postId: string) => {
    const comment = commentDrafts[postId]?.trim();
    if (!comment) return;
    if (!currentUserId) {
      toast.error(t("pleaseLoginToComment") || "Please log in to comment");
      return;
    }
    void markPostRead(postId);
    const result = await addNoticeboardComment(postId, {
      userId: currentUserId,
      userName: currentUserName,
      comment,
    });
    if (!result) {
      toast.error(t("failedToAddComment") || "Failed to add comment");
      return;
    }
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...result.post, hasRead: true, readAt: post.readAt || new Date().toISOString() }
          : post,
      ),
    );
    setPostComments((prev) => ({ ...prev, [postId]: result.comments }));
    setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
  };

  const unreadCount = visiblePosts.filter((post) => !post.hasRead).length;

  const renderPostCard = (post: NoticeboardPost) => (
    <div
      className={`w-full rounded-xl border bg-card overflow-hidden flex flex-col ${
        post.hasRead ? "" : "ring-1 ring-amber-300/70"
      }`}
      onClick={() => void markPostRead(post.id)}
    >
      {post.fileUrl ? (
        <div className="relative w-full bg-muted">
          <NoticeboardMedia
            post={post}
            className="w-full object-contain max-h-72"
          />
          {!post.hasRead && (
            <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              New
            </span>
          )}
        </div>
      ) : null}
      <div className="p-3 space-y-2 flex flex-col">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2">
              {post.title}
            </h3>
            {!post.fileUrl && !post.hasRead && (
              <Badge className="shrink-0 text-[10px] bg-amber-500 hover:bg-amber-500">
                New
              </Badge>
            )}
          </div>
          {post.description ? (
            <p className="text-xs text-muted-foreground mt-1">{post.description}</p>
          ) : null}
          {(post.startDate || post.endDate) && (
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {post.startDate && post.endDate
                ? `${formatNoticeboardSchedule(post.startDate)} – ${formatNoticeboardSchedule(post.endDate)}`
                : post.endDate
                  ? `Until ${formatNoticeboardSchedule(post.endDate)}`
                  : `From ${formatNoticeboardSchedule(post.startDate)}`}
            </p>
          )}
        </div>
        <div className="flex gap-4 pt-2 text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleLikePost(post.id);
            }}
            className="flex items-center gap-1 text-muted-foreground hover:text-orange-600 transition-colors"
          >
            <Flame className="w-4 h-4 text-primary/80" />
            <span>{post.likesCount || 0}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void handleToggleComments(post.id);
            }}
            className="flex items-center gap-1 text-muted-foreground hover:text-green-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-green-500" />
            <span>{post.commentsCount || 0}</span>
          </button>
          <span className="flex items-center gap-1 text-muted-foreground ml-auto">
            <Eye className="w-4 h-4" />
            <span>{post.viewsCount || 0}</span>
          </span>
        </div>
        {openComments[post.id] && (
          <div
            className="space-y-2 rounded-lg border bg-muted/40 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {(postComments[post.id] ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("noCommentsYet") || "No comments yet"}
              </p>
            ) : (
              (postComments[post.id] ?? []).slice(0, 5).map((item) => (
                <div key={item.id} className="text-xs">
                  <span className="font-medium">{item.userName || "User"}:</span>{" "}
                  <span className="text-muted-foreground">{item.comment}</span>
                </div>
              ))
            )}
            <div className="flex gap-2">
              <Input
                value={commentDrafts[post.id] ?? ""}
                onChange={(e) =>
                  setCommentDrafts((prev) => ({
                    ...prev,
                    [post.id]: e.target.value,
                  }))
                }
                placeholder={t("writeAComment") || "Write a comment"}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSubmitComment(post.id);
                  }
                }}
              />
              <Button
                size="sm"
                className="h-8 px-3"
                onClick={() => void handleSubmitComment(post.id)}
              >
                {t("postComment") || "Post"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="bg-white shadow-md border-border/60 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {t("noticeBoard") || "Notice Board"}
                {!loading && posts.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {posts.length}
                  </Badge>
                )}
                {!loading && unreadCount > 0 && (
                  <Badge className="text-[10px] font-normal bg-amber-500 hover:bg-amber-500">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("homeNoticeboardSubtitle") || "Important updates from your organization"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setLoading(true);
                    void loadPosts();
                  }}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("refresh") || "Refresh"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t("loadingNoticeboard") || "Loading notices…"}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center space-y-3">
            <AlertCircle className="w-5 h-5 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setLoading(true);
                void loadPosts();
              }}
            >
              {t("tryAgain") || "Try again"}
            </Button>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm space-y-1">
            <p>{t("noNoticeboardPostsAvailable") || "No noticeboard posts available"}</p>
            <p className="text-xs">
              {t("noticeboardEmptyHint") ||
                "Active posts created in Manage Notice Board will appear here."}
            </p>
          </div>
        ) : (
          <div className="max-h-[36rem] overflow-y-auto space-y-3 pr-1">
            {visiblePosts.map((post) => (
              <div key={post.id}>
                {renderPostCard(post)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
