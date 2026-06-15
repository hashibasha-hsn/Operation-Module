import { useState } from "react";
import { Calendar, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AddTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTicket?: (data: any) => void;
}

export default function AddTicketModal({
  open,
  onOpenChange,
  onCreateTicket,
}: AddTicketModalProps) {
  const [activeTab, setActiveTab] = useState<"auto" | "custom">("auto");
  const [store, setStore] = useState("hashibasha- Head Office");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [users, setUsers] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [attachments, setAttachments] = useState<File | null>(null);
  const [assignmentType, setAssignmentType] = useState<"users" | "team">("users");

  const handleCreate = () => {
    const ticketData = {
      tab: activeTab,
      store,
      category,
      title,
      description,
      priority,
      users,
      dueDate,
      attachments,
      assignmentType,
    };
    onCreateTicket?.(ticketData);
    onOpenChange(false);
    // Reset form
    setCategory("");
    setTitle("");
    setDescription("");
    setUsers("");
    setDueDate(undefined);
    setAttachments(null);
    setAssignmentType("users");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachments(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Ticket</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "auto" | "custom")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto">Auto</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="store">
                Store <span className="text-red-500">*</span>
              </Label>
              <Select value={store} onValueChange={setStore}>
                <SelectTrigger id="store" className="w-full">
                  <SelectValue placeholder="Select Store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hashibasha- Head Office">hashibasha- Head Office</SelectItem>
                  <SelectItem value="hashibasha- Branch 1">hashibasha- Branch 1</SelectItem>
                  <SelectItem value="hashibasha- Branch 2">hashibasha- Branch 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select Category - Level 1" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Enter Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="attachments"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="attachments">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Upload
                    </span>
                  </Button>
                </label>
                {attachments && (
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    {attachments.name}
                    <button
                      onClick={() => setAttachments(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority <span className="text-red-500">*</span>
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="users">
                Users <span className="text-red-500">*</span>
              </Label>
              <Select value={users} onValueChange={setUsers}>
                <SelectTrigger id="users" className="w-full">
                  <SelectValue placeholder="Search users..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">John Doe</SelectItem>
                  <SelectItem value="user2">Jane Smith</SelectItem>
                  <SelectItem value="user3">Bob Johnson</SelectItem>
                  <SelectItem value="user4">Alice Brown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dueDate ? dueDate.toLocaleDateString() : "Select Due Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleCreate}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!store || !category || !title || !description || !priority || !users || !dueDate}
              >
                Create
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="custom-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="custom-title"
                placeholder="Enter Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="custom-description"
                placeholder="Enter Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-priority">
                Priority <span className="text-red-500">*</span>
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="custom-priority" className="w-full">
                  <SelectValue placeholder="Search Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-store">
                Store <span className="text-red-500">*</span>
              </Label>
              <Select value={store} onValueChange={setStore}>
                <SelectTrigger id="custom-store" className="w-full">
                  <SelectValue placeholder="Select Store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hashibasha- Head Office">hashibasha- Head Office</SelectItem>
                  <SelectItem value="hashibasha- Branch 1">hashibasha- Branch 1</SelectItem>
                  <SelectItem value="hashibasha- Branch 2">hashibasha- Branch 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="custom-attachments"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="custom-attachments">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span className="flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Upload
                    </span>
                  </Button>
                </label>
                {attachments && (
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    {attachments.name}
                    <button
                      onClick={() => setAttachments(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assignment Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignment-type"
                    value="users"
                    checked={assignmentType === "users"}
                    onChange={() => setAssignmentType("users")}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span>Users</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignment-type"
                    value="team"
                    checked={assignmentType === "team"}
                    onChange={() => setAssignmentType("team")}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  <span>Team</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-users">
                {assignmentType === "users" ? "Users" : "Team"} <span className="text-red-500">*</span>
              </Label>
              <Select value={users} onValueChange={setUsers}>
                <SelectTrigger id="custom-users" className="w-full">
                  <SelectValue placeholder={assignmentType === "users" ? "Search users..." : "Search team..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">John Doe</SelectItem>
                  <SelectItem value="user2">Jane Smith</SelectItem>
                  <SelectItem value="user3">Bob Johnson</SelectItem>
                  <SelectItem value="user4">Alice Brown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-dueDate">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dueDate ? dueDate.toLocaleDateString() : "Select Due Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleCreate}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!store || !title || !description || !priority || !users || !dueDate}
              >
                Create
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
