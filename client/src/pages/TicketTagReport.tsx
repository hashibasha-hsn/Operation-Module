import { useState, useEffect } from "react";
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
import { Search, Download, Tag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchTicketTagReport } from "@/lib/ticketApi";
import { fetchEntities, fetchUsers } from "@/lib/processApi";
import { buildStoreNameMap, buildUserNameMap, humanLabel } from "@/lib/displayLabels";

export default function TicketTagReport() {
  const { t } = useLanguage();
  const [selectedTag, setSelectedTag] = useState("all");
  const [tagData, setTagData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEntities()
      .then((entities) => setStoreNames(buildStoreNameMap(entities || [])))
      .catch(() => setStoreNames({}));
    fetchUsers(1000)
      .then((users) => setUserNames(buildUserNameMap(users || [])))
      .catch(() => setUserNames({}));
  }, []);

  const storeLabel = (storeId?: string) =>
    storeId ? humanLabel(storeNames[storeId], "—") : "—";
  const userLabel = (id?: string) => (id ? humanLabel(userNames[id], "Unknown user") : "—");

  useEffect(() => {
    fetchTagReport();
  }, [selectedTag]);

  const fetchTagReport = async () => {
    setLoading(true);
    try {
      const data = await fetchTicketTagReport(
        selectedTag && selectedTag !== "all" ? selectedTag : undefined,
      );
      setTagData(data);
    } catch (error) {
      console.error("Error fetching tag report:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTagKeys = () => {
    if (!tagData) return [];
    return Object.keys(tagData);
  };

  const getTicketsForTag = (tagKey: string) => {
    return tagData[tagKey]?.tickets || [];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tag className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('issueTickets')} {t('tagReport')}</h1>
            <p className="text-muted-foreground mt-1">Tickets grouped by tags</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tag Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {getTagKeys().map((tagKey) => (
              <SelectItem key={tagKey} value={tagKey}>
                {tagData[tagKey]?.tagName || tagKey}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : tagData && Object.keys(tagData).length > 0 ? (
        <div className="space-y-6">
          {getTagKeys().map((tagKey) => {
            const tagInfo = tagData[tagKey];
            const tickets = getTicketsForTag(tagKey);
            
            return (
              <Card key={tagKey}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      <span>{tagInfo.tagName || tagKey}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{tickets.length} tickets</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tickets.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No tickets for this tag</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Store</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets.slice(0, 10).map((ticket: any) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-medium">{ticket.title}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                                  ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                  ticket.status === 'on_hold' ? 'bg-orange-100 text-orange-800' :
                                  ticket.status === 'complete' ? 'bg-green-100 text-green-800' :
                                  ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }`}>{ticket.status.replace('_', ' ')}</span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  ticket.priority === 'highest' ? 'bg-red-100 text-red-800' :
                                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  ticket.priority === 'low' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>{ticket.priority}</span>
                              </TableCell>
                              <TableCell>{storeLabel(ticket.storeId)}</TableCell>
                              <TableCell>{userLabel(ticket.assignedTo)}</TableCell>
                              <TableCell>
                                {new Date(ticket.createdAt).toLocaleDateString()}
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
                      {tickets.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                          Showing 10 of {tickets.length} tickets
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t('noTasksAvailableDateRange')}</p>
        </div>
      )}
    </div>
  );
}
