import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import { Search, Download, Filter } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchTicketAdvanceSearch } from "@/lib/ticketApi";

export default function TicketAdvanceSearch() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [storeIdFilter, setStoreIdFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (searchTerm) filters.ticketId = searchTerm;
      if (statusFilter !== "all") filters.status = statusFilter;
      if (priorityFilter !== "all") filters.priority = priorityFilter;
      if (storeIdFilter) filters.storeId = storeIdFilter;
      if (assignedToFilter) filters.assignedTo = assignedToFilter;
      if (createdByFilter) filters.createdBy = createdByFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const data = await fetchTicketAdvanceSearch(filters);
      setTickets(data);
    } catch (error) {
      console.error("Error searching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setStoreIdFilter("");
    setAssignedToFilter("");
    setCreatedByFilter("");
    setStartDate("");
    setEndDate("");
    setTickets([]);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      open: "default",
      in_progress: "secondary",
      on_hold: "outline",
      complete: "default",
      closed: "outline",
      rejected: "destructive",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      status === 'open' ? 'bg-blue-100 text-blue-800' :
      status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
      status === 'on_hold' ? 'bg-orange-100 text-orange-800' :
      status === 'complete' ? 'bg-green-100 text-green-800' :
      status === 'closed' ? 'bg-gray-100 text-gray-800' :
      'bg-red-100 text-red-800'
    }`}>{status.replace('_', ' ')}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors: Record<string, string> = {
      highest: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
      lowest: "bg-gray-100 text-gray-800",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority] || 'bg-gray-100 text-gray-800'}`}>{priority}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('issueTickets')} {t('advanceSearch')}</h1>
            <p className="text-muted-foreground mt-1">Advanced search for tickets</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSearch} className="gap-2">
            <Search className="w-4 h-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ticket ID</label>
              <Input
                placeholder="Search by ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="highest">Highest</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="lowest">Lowest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Store ID</label>
              <Input
                placeholder="Enter Store ID"
                value={storeIdFilter}
                onChange={(e) => setStoreIdFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned To</label>
              <Input
                placeholder="Enter User ID"
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Created By</label>
              <Input
                placeholder="Enter User ID"
                value={createdByFilter}
                onChange={(e) => setCreatedByFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search Results</span>
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground">{tickets.length} records</span>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">No tickets found. Use the filters above to search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Store ID</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">{ticket.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{ticket.title}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{ticket.storeId}</TableCell>
                      <TableCell>{ticket.assignedTo}</TableCell>
                      <TableCell>{ticket.createdBy}</TableCell>
                      <TableCell>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <TableActionsMenu>
                          <DropdownMenuItem>View</DropdownMenuItem>
                        </TableActionsMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
