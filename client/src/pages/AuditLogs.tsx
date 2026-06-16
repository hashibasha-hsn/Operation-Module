import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Calendar, RefreshCw, Inbox } from "lucide-react";

export default function AuditLogs() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const handleSubmit = () => {
    console.log("Filtering logs from", startDate, "to", endDate);
  };

  const handleLoadMore = () => {
    console.log("Loading more logs");
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header with Date Filters and Load More */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10 w-48"
            />
          </div>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            Submit
          </Button>
        </div>
        <Button variant="outline" onClick={handleLoadMore} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Load More
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <div className="flex items-center gap-2">
                  Target
                  <Search className="w-4 h-4 text-gray-400 cursor-pointer" />
                </div>
              </TableHead>
              <TableHead className="w-[150px]">
                <div className="flex items-center gap-2">
                  Operation
                  <Search className="w-4 h-4 text-gray-400 cursor-pointer" />
                </div>
              </TableHead>
              <TableHead className="w-[180px]">
                <div className="flex items-center gap-2">
                  Performed By
                  <Search className="w-4 h-4 text-gray-400 cursor-pointer" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  Details
                  <Search className="w-4 h-4 text-gray-400 cursor-pointer" />
                </div>
              </TableHead>
              <TableHead className="w-[200px]">
                <div className="flex items-center gap-2">
                  Created At
                  <Search className="w-4 h-4 text-gray-400 cursor-pointer" />
                  <RefreshCw className="w-4 h-4 text-gray-400 cursor-pointer" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-96">
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Inbox className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No data</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.target}</TableCell>
                  <TableCell>{log.operation}</TableCell>
                  <TableCell>{log.performedBy}</TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell>{log.createdAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
