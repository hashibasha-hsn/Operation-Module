import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Download, Clock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { exportRowsToCsv, fetchActionPointsAdvanceReport } from "@/lib/reportApi";
import { fetchUsers } from "@/lib/processApi";
import { buildUserNameMap, humanLabel } from "@/lib/displayLabels";

export default function ActionPointsAdvanceReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionPointIdSearch, setActionPointIdSearch] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers(1000)
      .then((users) => setUserNames(buildUserNameMap(users || [])))
      .catch(() => setUserNames({}));
  }, []);

  const userLabel = (id?: string) => (id ? humanLabel(userNames[id], "Unknown user") : "—");

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await fetchActionPointsAdvanceReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter,
        actionPointId: actionPointIdSearch || undefined,
      });
      setData(result);
    } catch (error) {
      console.error("Error fetching advance report:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [statusFilter, startDate, endDate]);

  const rows = Array.isArray(data?.actionPoints) ? data.actionPoints : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/standard-reports/action-points-org-report">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              Action Points Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Action Points Advance Report</h1>
            <p className="text-sm text-muted-foreground">
              Historical timeline of action point status changes
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!rows.length}
          onClick={() =>
            exportRowsToCsv(
              `action-points-advance-${new Date().toISOString().slice(0, 10)}.csv`,
              ["Title", "Status", "Priority", "Assignee", "Store", "Created", "Completed", "Closed"],
              rows.map((ap: any) => [
                ap.title,
                ap.currentStatus || ap.status,
                ap.priority,
                userLabel(ap.assignedTo),
                humanLabel(ap.storeName, "—"),
                ap.createdAt || "",
                ap.completedAt || "",
                ap.closedAt || "",
              ]),
            )
          }
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Action Point ID</label>
            <Input
              placeholder="Search ID..."
              value={actionPointIdSearch}
              onChange={(e) => setActionPointIdSearch(e.target.value)}
            />
          </div>
          <Button onClick={loadReport}>Apply</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading...</p>
          ) : rows.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No historical action points found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((ap: any) => (
                    <TableRow key={ap.id}>
                      <TableCell className="font-medium">{ap.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ap.currentStatus || ap.status}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{ap.priority}</TableCell>
                      <TableCell>{userLabel(ap.assignedTo)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {(ap.timeline || []).map((ev: any, idx: number) => (
                            <span key={idx} className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {ev.event}:{" "}
                              {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : "—"}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ap.createdAt ? new Date(ap.createdAt).toLocaleDateString() : "—"}
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
