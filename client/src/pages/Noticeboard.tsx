import { useState, useEffect } from "react";
import { getOrganizationId, getCurrentUserId } from '@/lib/authStorage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreVertical, ChevronDown, Edit, Trash2, MessageSquare, ThumbsUp, ThumbsDown, Image as ImageIcon, Video } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Noticeboard() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [postData, setPostData] = useState({
    title: "",
    description: "",
    mediaUrl: "",
    mediaType: "",
    enableDiscussions: false,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`http://localhost:3009/api/org/noticeboard?organizationId=${encodeURIComponent(getOrganizationId())}`);
      const data = await response.json();
      setPosts(data || []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  const handleCreatePost = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/org/noticeboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...postData,
          organizationId: getOrganizationId(),
          createdBy: getCurrentUserId() || 'system',
        }),
      });

      if (response.ok) {
        setPostData({
          title: "",
          description: "",
          mediaUrl: "",
          mediaType: "",
          enableDiscussions: false,
        });
        setIsDialogOpen(false);
        fetchPosts();
      } else {
        console.error('Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setPostData({
      title: post.title,
      description: post.description,
      mediaUrl: post.mediaUrl || "",
      mediaType: post.mediaType || "",
      enableDiscussions: post.enableDiscussions,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    try {
      const response = await fetch(`http://localhost:3009/api/org/noticeboard/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        setPostData({
          title: "",
          description: "",
          mediaUrl: "",
          mediaType: "",
          enableDiscussions: false,
        });
        setEditingPost(null);
        setIsEditDialogOpen(false);
        fetchPosts();
      } else {
        console.error('Failed to update post');
      }
    } catch (err) {
      console.error('Error updating post:', err);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm(t('areYouSureDeletePost'))) return;

    try {
      const response = await fetch(`http://localhost:3009/api/org/noticeboard/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPosts();
      } else {
        console.error('Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await fetch(`http://localhost:3009/api/org/noticeboard/${id}/toggle-status`, {
        method: 'PUT',
      });
      fetchPosts();
    } catch (err) {
      console.error('Error toggling post status:', err);
    }
  };

  const handleLike = async (id: string) => {
    try {
      await fetch(`http://localhost:3009/api/org/noticeboard/${id}/like`, {
        method: 'PUT',
      });
      fetchPosts();
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleDislike = async (id: string) => {
    try {
      await fetch(`http://localhost:3009/api/org/noticeboard/${id}/dislike`, {
        method: 'PUT',
      });
      fetchPosts();
    } catch (err) {
      console.error('Error disliking post:', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('noticeboard')}</h1>
            <p className="text-muted-foreground mt-1">{t('manageAnnouncementsAndUpdates')}</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t('newPost')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('createNoticeboardPost')}</DialogTitle>
              <DialogDescription>
                {t('createNewAnnouncementOrUpdate')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {t('title')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder={t('enterPostTitle')}
                  value={postData.title}
                  onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  {t('description')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={t('enterPostDescription')}
                  value={postData.description}
                  onChange={(e) => setPostData({ ...postData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mediaType">{t('mediaTypeOptional')}</Label>
                  <Select
                    value={postData.mediaType}
                    onValueChange={(value) => setPostData({ ...postData, mediaType: value })}
                  >
                    <SelectTrigger id="mediaType">
                      <SelectValue placeholder={t('selectMediaType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">{t('image')}</SelectItem>
                      <SelectItem value="video">{t('video')}</SelectItem>
                      <SelectItem value="none">{t('none')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mediaUrl">{t('mediaUrlOptional')}</Label>
                  <Input
                    id="mediaUrl"
                    placeholder={t('enterMediaUrl')}
                    value={postData.mediaUrl}
                    onChange={(e) => setPostData({ ...postData, mediaUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="enableDiscussions">{t('enableDiscussions')}</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="enableDiscussions"
                    checked={postData.enableDiscussions}
                    onCheckedChange={(checked) => setPostData({ ...postData, enableDiscussions: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {postData.enableDiscussions ? t('discussionsEnabled') : t('discussionsDisabled')}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleCreatePost}>
                {t('createPost')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPosts')}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {t('status')}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>{t('all')}</DropdownMenuItem>
            <DropdownMenuItem>{t('active')}</DropdownMenuItem>
            <DropdownMenuItem>{t('inactive')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('noNoticeboardPostsAvailable')}
          </div>
        ) : (
          posts.map((post: any) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {post.mediaUrl && (
                    <div className="w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      {post.mediaType === 'image' ? (
                        <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover" />
                      ) : post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                        <p className="text-muted-foreground">{post.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={post.isActive}
                          onCheckedChange={() => handleToggleStatus(post.id)}
                        />
                        <Badge variant={post.isActive ? "default" : "secondary"}>
                          {post.isActive ? t('active') : t('inactive')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{t('createdBy')} {post.creator?.name || t('unknown')}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleLike(post.id)}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        {post.likesCount}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleDislike(post.id)}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        {post.dislikesCount}
                      </Button>
                      {post.enableDiscussions && (
                        <Button variant="ghost" size="sm" className="gap-2">
                          <MessageSquare className="w-4 h-4" />
                          {post.commentsCount}
                        </Button>
                      )}
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPost(post)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Post Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editNoticeboardPost')}</DialogTitle>
            <DialogDescription>
              {t('updateNoticeboardPostDetails')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('title')}</Label>
              <Input
                id="edit-title"
                placeholder={t('enterPostTitle')}
                value={postData.title}
                onChange={(e) => setPostData({ ...postData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('description')}</Label>
              <Textarea
                id="edit-description"
                placeholder={t('enterPostDescription')}
                value={postData.description}
                onChange={(e) => setPostData({ ...postData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-mediaType">{t('mediaTypeOptional')}</Label>
                <Select
                  value={postData.mediaType}
                  onValueChange={(value) => setPostData({ ...postData, mediaType: value })}
                >
                  <SelectTrigger id="edit-mediaType">
                    <SelectValue placeholder={t('selectMediaType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">{t('image')}</SelectItem>
                    <SelectItem value="video">{t('video')}</SelectItem>
                    <SelectItem value="none">{t('none')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mediaUrl">{t('mediaUrlOptional')}</Label>
                <Input
                  id="edit-mediaUrl"
                  placeholder={t('enterMediaUrl')}
                  value={postData.mediaUrl}
                  onChange={(e) => setPostData({ ...postData, mediaUrl: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-enableDiscussions">{t('enableDiscussions')}</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-enableDiscussions"
                  checked={postData.enableDiscussions}
                  onCheckedChange={(checked) => setPostData({ ...postData, enableDiscussions: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {postData.enableDiscussions ? t('discussionsEnabled') : t('discussionsDisabled')}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpdatePost}>
              {t('updatePost')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
