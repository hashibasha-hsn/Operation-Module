import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, LayoutGrid, Edit, Trash2, Download, ChevronLeft, ChevronRight, Heart, MessageSquare, X, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import NoticeboardMedia from "@/components/NoticeboardMedia";
import { toast } from "sonner";
import {
  createNoticeboardPost,
  deleteNoticeboardPost,
  downloadNoticeboardPost,
  fetchNoticeboardComments,
  fetchNoticeboardPosts,
  fetchNoticeboardReads,
  formatNoticeboardSchedule,
  getNoticeboardScheduleStatus,
  reorderNoticeboardPosts,
  toNoticeboardDatetimeLocal,
  toggleNoticeboardPostStatus,
  updateNoticeboardPost,
  type NoticeboardComment,
  type NoticeboardPost,
  type NoticeboardRead,
} from "@/lib/noticeboardApi";
import { getStoredUser, getOrganizationId } from '@/lib/authStorage';
import { humanLabel } from "@/lib/displayLabels";
import { useTimezone } from "@/contexts/TimezoneContext";

const EMPTY_POST_DATA = {
  title: "",
  description: "",
  file: null as File | null,
  adminOnlyComments: false,
  tagNames: [] as string[],
  startDate: "",
  endDate: "",
};

function appendScheduleFields(formData: FormData, startDate: string, endDate: string) {
  formData.append("startDate", startDate || "");
  formData.append("endDate", endDate || "");
}

function appendTargetFields(formData: FormData) {
  formData.append("targetStoreIds", JSON.stringify([]));
  formData.append("targetUserIds", JSON.stringify([]));
}

function getNoticeboardAuthorId(): string {
  const user = getStoredUser();
  return String(user.email || user.userId || user.id || "system");
}

export default function NoticeBoardList() {
  const { formatDateTime } = useTimezone();
  const organizationId = getOrganizationId();
  const [posts, setPosts] = useState<NoticeboardPost[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isArrangeOpen, setIsArrangeOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReadsOpen, setIsReadsOpen] = useState(false);
  const [arrangePosts, setArrangePosts] = useState<NoticeboardPost[]>([]);
  const [commentsPost, setCommentsPost] = useState<NoticeboardPost | null>(null);
  const [readsPost, setReadsPost] = useState<NoticeboardPost | null>(null);
  const [comments, setComments] = useState<NoticeboardComment[]>([]);
  const [reads, setReads] = useState<NoticeboardRead[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [readsLoading, setReadsLoading] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postData, setPostData] = useState({ ...EMPTY_POST_DATA });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await fetchNoticeboardPosts(organizationId, false);
      setPosts(data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setPosts([]);
    }
  };

  const validateSchedule = () => {
    if (postData.startDate && postData.endDate && new Date(postData.endDate) < new Date(postData.startDate)) {
      toast.error("End date must be on or after start date");
      return false;
    }
    return true;
  };

  const handleCreatePost = async () => {
    if (!postData.title.trim() || !postData.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    if (!validateSchedule()) return;

    try {
      const formData = new FormData();
      formData.append('title', postData.title);
      formData.append('description', postData.description);
      formData.append('adminOnlyComments', postData.adminOnlyComments.toString());
      formData.append('tagNames', JSON.stringify(postData.tagNames));
      formData.append('organizationId', organizationId);
      formData.append('createdBy', getNoticeboardAuthorId());
      formData.append('isActive', 'true');
      appendScheduleFields(formData, postData.startDate, postData.endDate);
      appendTargetFields(formData);
      if (postData.file) {
        formData.append('file', postData.file);
      }

      const response = await createNoticeboardPost(formData);

      if (response) {
        setPostData({ ...EMPTY_POST_DATA });
        setTagInput("");
        setIsDialogOpen(false);
        const scheduleStatus = getNoticeboardScheduleStatus(response);
        if (scheduleStatus === "scheduled") {
          toast.success(
            `Notice scheduled for everyone — visible from ${formatNoticeboardSchedule(response.startDate)}`,
          );
        } else {
          toast.success("Notice posted for everyone");
        }
        fetchPosts();
      } else {
        toast.error("Failed to create noticeboard post");
        console.error('Failed to create post');
      }
    } catch (err) {
      toast.error("Failed to create noticeboard post");
      console.error('Error creating post:', err);
    }
  };

  const handleArrangeBoards = () => {
    setArrangePosts([...posts]);
    setIsArrangeOpen(true);
  };

  const moveArrangePost = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= arrangePosts.length) return;
    const next = [...arrangePosts];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setArrangePosts(next);
  };

  const handleSaveArrangement = async () => {
    setIsSavingOrder(true);
    try {
      const postOrders = arrangePosts.map((post, index) => ({
        id: post.id,
        displayOrder: index + 1,
      }));
      const updated = await reorderNoticeboardPosts(postOrders, organizationId);
      setPosts(updated.length ? updated : arrangePosts);
      setIsArrangeOpen(false);
      toast.success("Post order updated");
    } catch {
      toast.error("Failed to save post order");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const openComments = async (post: NoticeboardPost) => {
    setCommentsPost(post);
    setIsCommentsOpen(true);
    setCommentsLoading(true);
    try {
      const rows = await fetchNoticeboardComments(post.id);
      setComments(rows);
    } catch {
      setComments([]);
      toast.error("Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  };

  const openReads = async (post: NoticeboardPost) => {
    setReadsPost(post);
    setIsReadsOpen(true);
    setReadsLoading(true);
    try {
      const rows = await fetchNoticeboardReads(post.id);
      setReads(rows);
    } catch {
      setReads([]);
      toast.error("Failed to load readers");
    } finally {
      setReadsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (post) {
      setEditingPostId(id);
      setPostData({
        title: post.title,
        description: post.description,
        file: null,
        adminOnlyComments: !!post.adminOnlyComments,
        tagNames: post.tagNames || [],
        startDate: toNoticeboardDatetimeLocal(post.startDate),
        endDate: toNoticeboardDatetimeLocal(post.endDate),
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    try {
      const ok = await deleteNoticeboardPost(id);
      if (ok) {
        toast.success("Post deleted");
        fetchPosts();
      } else {
        toast.error("Failed to delete post");
      }
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleDownload = async (post: NoticeboardPost) => {
    try {
      await downloadNoticeboardPost(post);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download post");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await toggleNoticeboardPostStatus(id);
      if (updated) {
        fetchPosts();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPostId) return;
    if (!postData.title.trim() || !postData.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    if (!validateSchedule()) return;

    try {
      const formData = new FormData();
      formData.append('title', postData.title);
      formData.append('description', postData.description);
      formData.append('adminOnlyComments', postData.adminOnlyComments.toString());
      formData.append('tagNames', JSON.stringify(postData.tagNames));
      appendScheduleFields(formData, postData.startDate, postData.endDate);
      appendTargetFields(formData);
      if (postData.file) {
        formData.append('file', postData.file);
      }

      const response = await updateNoticeboardPost(editingPostId, formData);

      if (response) {
        setPostData({ ...EMPTY_POST_DATA });
        setTagInput("");
        setEditingPostId(null);
        setIsEditDialogOpen(false);
        toast.success("Notice updated — visible to everyone");
        fetchPosts();
      } else {
        toast.error("Failed to update noticeboard post");
        console.error('Failed to update post');
      }
    } catch (err) {
      toast.error("Failed to update noticeboard post");
      console.error('Error updating post:', err);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !postData.tagNames.includes(tagInput.trim())) {
      setPostData({
        ...postData,
        tagNames: [...postData.tagNames, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setPostData({
      ...postData,
      tagNames: postData.tagNames.filter((t) => t !== tag),
    });
  };

  const totalPages = Math.max(1, Math.ceil(posts.length / itemsPerPage));
  const paginatedPosts = posts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notice Board List</h1>
        <div className="flex gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Post</DialogTitle>
                <DialogDescription>
                  Create a new notice board post
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter post title"
                    value={postData.title}
                    onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Enter post description"
                    value={postData.description}
                    onChange={(e) => setPostData({ ...postData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Image or Video Upload</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setPostData({ ...postData, file: e.target.files?.[0] || null })}
                      className="cursor-pointer"
                    />
                    {postData.file && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPostData({ ...postData, file: null })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {postData.file && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {postData.file.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminOnlyComments">Admin Only Comments</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="adminOnlyComments"
                      checked={postData.adminOnlyComments}
                      onCheckedChange={(checked) => setPostData({ ...postData, adminOnlyComments: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {postData.adminOnlyComments ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagNames">Tag Names</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tagNames"
                      placeholder="Add a tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>
                  {postData.tagNames.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {postData.tagNames.map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start date</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={postData.startDate}
                      onChange={(e) => setPostData({ ...postData, startDate: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty to show immediately</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End date</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={postData.endDate}
                      onChange={(e) => setPostData({ ...postData, endDate: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for no expiry</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePost}>
                  Create Post
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Post Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Post</DialogTitle>
                <DialogDescription>
                  Update the notice board post
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    placeholder="Enter post title"
                    value={postData.title}
                    onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Enter post description"
                    value={postData.description}
                    onChange={(e) => setPostData({ ...postData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-file">Image or Video Upload</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-file"
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setPostData({ ...postData, file: e.target.files?.[0] || null })}
                      className="cursor-pointer"
                    />
                    {postData.file && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPostData({ ...postData, file: null })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {postData.file && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {postData.file.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-adminOnlyComments">Admin Only Comments</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="edit-adminOnlyComments"
                      checked={postData.adminOnlyComments}
                      onCheckedChange={(checked) => setPostData({ ...postData, adminOnlyComments: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {postData.adminOnlyComments ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tagNames">Tag Names</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-tagNames"
                      placeholder="Add a tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>
                  {postData.tagNames.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {postData.tagNames.map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startDate">Start date</Label>
                    <Input
                      id="edit-startDate"
                      type="datetime-local"
                      value={postData.startDate}
                      onChange={(e) => setPostData({ ...postData, startDate: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty to show immediately</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endDate">End date</Label>
                    <Input
                      id="edit-endDate"
                      type="datetime-local"
                      value={postData.endDate}
                      onChange={(e) => setPostData({ ...postData, endDate: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for no expiry</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePost}>
                  Update Post
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleArrangeBoards} className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            Arrange Boards
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Media</TableHead>
              <TableHead className="w-[180px]">Title</TableHead>
              <TableHead className="w-[180px]">Description</TableHead>
              <TableHead className="w-[160px]">Schedule</TableHead>
              <TableHead className="w-[140px]">Audience</TableHead>
              <TableHead className="w-[120px]">Stats</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!Array.isArray(posts) || posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center text-muted-foreground">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              paginatedPosts.map((post) => {
                const scheduleStatus = getNoticeboardScheduleStatus(post);
                const scheduleLabel =
                  scheduleStatus === "scheduled"
                    ? "Scheduled"
                    : scheduleStatus === "expired"
                      ? "Expired"
                      : scheduleStatus === "live"
                        ? "Live"
                        : "Always on";
                const scheduleClass =
                  scheduleStatus === "scheduled"
                    ? "bg-amber-100 text-amber-800"
                    : scheduleStatus === "expired"
                      ? "bg-slate-100 text-slate-600"
                      : scheduleStatus === "live"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-sky-100 text-sky-800";

                return (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="h-16 w-24 overflow-hidden rounded-md bg-muted">
                      {post.fileUrl ? (
                        <NoticeboardMedia post={post} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No media
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{post.description}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${scheduleClass}`}>
                        {scheduleLabel}
                      </span>
                      <div className="text-muted-foreground">
                        <div>Start: {formatNoticeboardSchedule(post.startDate)}</div>
                        <div>End: {formatNoticeboardSchedule(post.endDate)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-800">
                      Everyone
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1" title="Likes">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>{post.likesCount ?? 0}</span>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-sky-600"
                        title="View comments"
                        onClick={() => openComments(post)}
                      >
                        <MessageSquare className="w-4 h-4 text-sky-500" />
                        <span>{post.commentsCount ?? 0}</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-emerald-600"
                        title="View readers"
                        onClick={() => openReads(post)}
                      >
                        <Eye className="w-4 h-4 text-emerald-600" />
                        <span>{post.viewsCount ?? 0}</span>
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TableActionsMenu>
                      <DropdownMenuItem onClick={() => handleEdit(post.id)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(post)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                    </TableActionsMenu>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={post.isActive}
                        onCheckedChange={() => handleToggleStatus(post.id)}
                      />
                      <span className="text-sm">{post.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Total {posts.length} items
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">{currentPage}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comments Dialog */}
      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              {commentsPost?.title ? `All comments on "${commentsPost.title}"` : "Post comments"}
            </DialogDescription>
          </DialogHeader>
          {commentsLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {comments.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{item.userName || "User"}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.createdAt ? formatDateTime(item.createdAt) : ""}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{item.comment}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Readers Dialog */}
      <Dialog open={isReadsOpen} onOpenChange={setIsReadsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Readers</DialogTitle>
            <DialogDescription>
              {readsPost?.title
                ? `Who read "${readsPost.title}" (${readsPost.viewsCount ?? reads.length} total)`
                : "Users who marked this notice as read"}
            </DialogDescription>
          </DialogHeader>
          {readsLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading readers...</p>
          ) : reads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No reads yet</p>
          ) : (
            <div className="space-y-2">
              {reads.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {humanLabel(item.userName, "Unknown user")}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.createdAt ? formatDateTime(item.createdAt) : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Arrange Boards Dialog */}
      <Dialog open={isArrangeOpen} onOpenChange={setIsArrangeOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Arrange Boards</DialogTitle>
            <DialogDescription>
              Change the display order of notice board posts. Top posts appear first.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {arrangePosts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center gap-2 rounded-md border bg-white px-3 py-2"
              >
                <span className="w-6 text-sm font-medium text-muted-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{post.title}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={index === 0}
                  onClick={() => moveArrangePost(index, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={index === arrangePosts.length - 1}
                  onClick={() => moveArrangePost(index, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArrangeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveArrangement} disabled={isSavingOrder}>
              Save Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
