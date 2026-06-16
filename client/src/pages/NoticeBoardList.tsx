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
import { Plus, LayoutGrid, Edit, Trash2, Download, ChevronLeft, ChevronRight, Flame, Eye, CheckCircle, Upload, X } from "lucide-react";

export default function NoticeBoardList() {
  const [posts, setPosts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postData, setPostData] = useState({
    title: "",
    description: "",
    file: null as File | null,
    adminOnlyComments: false,
    tagNames: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:3012/noticeboard?organizationId=default-org');
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setPosts([]);
    }
  };

  const handleCreatePost = async () => {
    try {
      const formData = new FormData();
      formData.append('title', postData.title);
      formData.append('description', postData.description);
      formData.append('adminOnlyComments', postData.adminOnlyComments.toString());
      formData.append('tagNames', JSON.stringify(postData.tagNames));
      formData.append('organizationId', 'default-org');
      if (postData.file) {
        formData.append('file', postData.file);
      }

      const response = await fetch('http://localhost:3012/noticeboard', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setPostData({
          title: "",
          description: "",
          file: null,
          adminOnlyComments: false,
          tagNames: [],
        });
        setTagInput("");
        setIsDialogOpen(false);
        fetchPosts();
      } else {
        console.error('Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const handleArrangeBoards = () => {
    console.log("Arrange boards clicked");
  };

  const handleEdit = (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (post) {
      setEditingPostId(id);
      setPostData({
        title: post.title,
        description: post.description,
        file: null,
        adminOnlyComments: post.adminOnlyComments,
        tagNames: post.tagNames || [],
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3012/noticeboard/${id}`, {
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

  const handleDownload = (id: string) => {
    console.log("Download post", id);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3012/noticeboard/${id}/toggle-status`, {
        method: 'PUT',
      });
      if (response.ok) {
        fetchPosts();
      } else {
        console.error('Failed to toggle status');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPostId) return;

    try {
      const formData = new FormData();
      formData.append('title', postData.title);
      formData.append('description', postData.description);
      formData.append('adminOnlyComments', postData.adminOnlyComments.toString());
      formData.append('tagNames', JSON.stringify(postData.tagNames));
      if (postData.file) {
        formData.append('file', postData.file);
      }

      const response = await fetch(`http://localhost:3012/noticeboard/${editingPostId}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        setPostData({
          title: "",
          description: "",
          file: null,
          adminOnlyComments: false,
          tagNames: [],
        });
        setTagInput("");
        setEditingPostId(null);
        setIsEditDialogOpen(false);
        fetchPosts();
      } else {
        console.error('Failed to update post');
      }
    } catch (err) {
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

  const totalPages = Math.ceil(posts.length / itemsPerPage);

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
                  <Label htmlFor="file">File Upload</Label>
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
                  <Label htmlFor="edit-file">File Upload</Label>
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
              <TableHead className="w-[250px]">Title</TableHead>
              <TableHead className="w-[300px]">Description</TableHead>
              <TableHead className="w-[200px]">Stats</TableHead>
              <TableHead className="w-[150px]">Action</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!Array.isArray(posts) || posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{post.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>{post.likesCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <span>{post.viewsCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{post.completedCount || 0}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(post.id)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(post.id)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
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
              ))
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
    </div>
  );
}
