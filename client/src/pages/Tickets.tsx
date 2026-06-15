import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Search,
  CalendarIcon,
  Download,
  RefreshCw,
  FileText,
  Plus,
  ChevronDown,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Tickets() {
  const [primaryFilter, setPrimaryFilter] = useState("assigned-to-me");
  const [statusFilter, setStatusFilter] = useState("total");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium",
    storeId: "",
    assignedTo: "",
    dueDate: undefined as Date | undefined,
    ticketType: "custom",
  });

  useEffect(() => {
    fetchTickets();
  }, [primaryFilter]);

  const fetchTickets = async () => {
    try {
      let endpoint = 'http://localhost:3000/api/org/tickets?organizationId=default-org';
      
      if (primaryFilter === "assigned-to-me") {
        endpoint = 'http://localhost:3000/api/org/tickets/assigned-to-me?userId=current-user-id&organizationId=default-org';
      } else if (primaryFilter === "created-by-me") {
        endpoint = 'http://localhost:3000/api/org/tickets/created-by-me?userId=current-user-id&organizationId=default-org';
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      setTickets(data || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`http://localhost:3000/api/org/tickets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userId: 'current-user-id' }),
      });
      fetchTickets();
      setIsDetailDialogOpen(false);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !comment) return;

    try {
      await fetch(`http://localhost:3000/api/org/tickets/${selectedTicket.id}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: comment,
          userId: 'current-user-id',
          timestamp: new Date(),
        }),
      });
      setComment("");
      setIsCommentDialogOpen(false);
      fetchTickets();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleCreateTicket = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/org/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTicket,
          organizationId: 'default-org',
          createdBy: 'current-user-id',
        }),
      });

      if (response.ok) {
        setNewTicket({
          title: "",
          description: "",
          priority: "medium",
          storeId: "",
          assignedTo: "",
          dueDate: undefined,
          ticketType: "custom",
        });
        setIsCreateDialogOpen(false);
        fetchTickets();
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
    }
  };

  const getTimeLeft = (dueDate: string) => {
    if (!dueDate) return 'No due date';
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'on_hold':
        return <PauseCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredTickets = tickets.filter((ticket: any) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'total' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const primaryFilters = [
    { label: "Assigned to me", value: "assigned-to-me" },
    { label: "Created by me", value: "created-by-me" },
    { label: "Closure Assigned", value: "closure-assigned" },
  ];

  const statusFilters = [
    { label: "Total", value: "total" },
    { label: "Open", value: "open" },
    { label: "In Progress", value: "in_progress" },
    { label: "On Hold", value: "on_hold" },
    { label: "Completed", value: "complete" },
    { label: "Closed", value: "closed" },
    { label: "Rejected", value: "rejected" },
    { label: "Overdue", value: "overdue" },
    { label: "On Time", value: "on-time" },
    { label: "Due Today", value: "due-today" },
    { label: "Active", value: "active" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Ticket Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage and track all your tickets in one place
        </p>
      </motion.div>

      {/* Primary Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-wrap gap-2">
          {primaryFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={primaryFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPrimaryFilter(filter.value)}
              className={
                primaryFilter === filter.value
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "border-gray-300 hover:border-orange-500"
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Search and Date Range */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col lg:flex-row gap-4 items-start lg:items-center"
      >
      {/* Search Bar */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search tickets..."
          className="pl-10 border-gray-300 focus:border-orange-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

        {/* Date Range Pickers */}
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[160px] justify-start text-left font-normal border-gray-300"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-gray-500">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[160px] justify-start text-left font-normal border-gray-300"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            Apply
          </Button>
        </div>
      </motion.div>

      {/* Secondary Status Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
              className={
                statusFilter === filter.value
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "border-gray-300 hover:border-orange-500"
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-wrap gap-3 items-center justify-between"
      >
        <div className="flex gap-3 items-center">
          <Button variant="outline" size="sm" className="border-gray-300">
            Load More
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Export All</DropdownMenuItem>
              <DropdownMenuItem>Export Current Page</DropdownMenuItem>
              <DropdownMenuItem>Export Selected</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            New Ticket
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Last Updated At:</span>
          <span>Today, 10:30 AM</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Tickets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
            >
              <FileText className="w-12 h-12 text-gray-400" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="text-gray-500 text-lg"
            >
              No Tickets available. Try selecting different filters or create a new ticket.
            </motion.p>
          </div>
        ) : (
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Time Left</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket: any) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">{ticket.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">{ticket.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant={ticket.priority === 'highest' || ticket.priority === 'high' ? 'destructive' : ticket.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          <Badge
                            variant={
                              ticket.status === 'closed' ? 'default' :
                              ticket.status === 'rejected' ? 'destructive' :
                              ticket.status === 'in_progress' ? 'secondary' : 'outline'
                            }
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{ticket.assignedTo || 'N/A'}</TableCell>
                      <TableCell>{ticket.storeId || 'N/A'}</TableCell>
                      <TableCell>
                        {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className={getTimeLeft(ticket.dueDate) === 'Overdue' ? 'text-red-600' : ''}>
                            {getTimeLeft(ticket.dueDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>
              Create a new issue ticket to track and resolve problems.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter ticket title"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter ticket description"
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highest">Highest</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="lowest">Lowest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="storeId">Store ID</Label>
                <Input
                  id="storeId"
                  placeholder="Enter store ID"
                  value={newTicket.storeId}
                  onChange={(e) => setNewTicket({ ...newTicket, storeId: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  placeholder="Enter user ID"
                  value={newTicket.assignedTo}
                  onChange={(e) => setNewTicket({ ...newTicket, assignedTo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTicket.dueDate ? format(newTicket.dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newTicket.dueDate}
                      onSelect={(date) => setNewTicket({ ...newTicket, dueDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket}>
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>
              View and manage ticket details.
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <div className="text-sm mt-1 font-medium">{selectedTicket.title}</div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <div className="mt-1">
                    <Badge
                      variant={selectedTicket.priority === 'highest' || selectedTicket.priority === 'high' ? 'destructive' : selectedTicket.priority === 'medium' ? 'default' : 'secondary'}
                    >
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedTicket.status === 'closed' ? 'default' :
                        selectedTicket.status === 'rejected' ? 'destructive' :
                        selectedTicket.status === 'in_progress' ? 'secondary' : 'outline'
                      }
                    >
                      {selectedTicket.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <div className="text-sm mt-1">
                    {selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <div className="text-sm mt-1">{selectedTicket.assignedTo || 'N/A'}</div>
                </div>
                <div>
                  <Label>Created By</Label>
                  <div className="text-sm mt-1">{selectedTicket.createdBy || 'N/A'}</div>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <div className="text-sm mt-1 p-3 border rounded-lg bg-muted">
                  {selectedTicket.description || 'No description'}
                </div>
              </div>

              {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                <div>
                  <Label>Comments</Label>
                  <div className="mt-2 space-y-2">
                    {selectedTicket.comments.map((comment: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <div className="text-sm font-medium">{comment.userId}</div>
                        <div className="text-sm text-muted-foreground">{comment.text}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(true)}>
              Add Comment
            </Button>
            {selectedTicket?.status === 'open' && (
              <>
                <Button variant="outline" onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}>
                  Start Progress
                </Button>
                <Button onClick={() => handleUpdateStatus(selectedTicket.id, 'complete')}>
                  Mark Complete
                </Button>
              </>
            )}
            {selectedTicket?.status === 'in_progress' && (
              <>
                <Button variant="outline" onClick={() => handleUpdateStatus(selectedTicket.id, 'on_hold')}>
                  Put on Hold
                </Button>
                <Button onClick={() => handleUpdateStatus(selectedTicket.id, 'complete')}>
                  Mark Complete
                </Button>
              </>
            )}
            {selectedTicket?.status === 'complete' && (
              <Button onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}>
                Close Ticket
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Add a comment to this ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                placeholder="Enter your comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComment}>
              Add Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
