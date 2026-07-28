import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, ArrowLeft, Building2, Users, Clock, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchEntities, fetchLearningStoreReport as fetchLearningStoreReportApi } from "@/lib/reportApi";
import { buildStoreNameMap, humanLabel } from "@/lib/displayLabels";

function employeeDisplayName(employee: any) {
  return humanLabel(employee.name, employee.userName, employee.fullName, employee.email, "—");
}

export default function LearningStoreReport() {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeId, setStoreId] = useState("");
  const [data, setData] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEntities()
      .then((entities) => setStoreNames(buildStoreNameMap(entities || [])))
      .catch(() => setStoreNames({}));
  }, []);

  const storeLabel = (id?: string) => (id ? humanLabel(storeNames[id], "—") : "—");

  useEffect(() => {
    if (storeId) {
      fetchLearningStoreReport();
    }
  }, [storeId, startDate, endDate]);

  const fetchLearningStoreReport = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const result = await fetchLearningStoreReportApi(storeId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(result);
    } catch (error) {
      console.error("Error fetching learning store report:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedEmployee && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedEmployee(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className="text-2xl font-bold">
            {selectedEmployee ? 'Employee Detail' : 'Learning Store Report'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="space-y-2">
              <label className="text-sm font-medium">Store ID</label>
              <Input
                placeholder="Enter Store ID"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-48"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={fetchLearningStoreReport} className="mt-6">Apply</Button>
          </div>
        </CardContent>
      </Card>

      {!storeId ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please enter a Store ID to view reports</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : selectedEmployee ? (
        /* Learner Detail View */
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h2 className="font-semibold">{employeeDisplayName(selectedEmployee)} - Course Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modules Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quiz</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <TableRow>
                    <TableCell className="font-medium">Sample Course</TableCell>
                    <TableCell className="text-sm">Category A</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2 w-24">
                          <div className="h-2 rounded-full bg-primary" style={{ width: '75%' }} />
                        </div>
                        <span className="text-sm">75%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">3/4</TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="outline">Completed - 85%</Badge>
                    </TableCell>
                    <TableCell className="text-sm">120 mins</TableCell>
                  </TableRow>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : data ? (
        /* Store Report Main Grid */
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Store: {data.storeName || storeLabel(data.storeId || storeId)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {data.employeeCount} employees • {data.progress}% avg progress • {data.timeSpent} mins total
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed Courses</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Spent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.employees?.map((employee: any) => (
                    <TableRow 
                      key={employee.userId}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <TableCell className="font-medium">{employeeDisplayName(employee)}</TableCell>
                      <TableCell className="text-sm">{employee.email}</TableCell>
                      <TableCell className="text-sm">{employee.designation}</TableCell>
                      <TableCell className="text-sm">{employee.supervisor}</TableCell>
                      <TableCell className="text-sm">{employee.storeName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 w-24">
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${employee.progress}%` }} />
                          </div>
                          <span className="text-sm">{employee.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{employee.completedCourses}</TableCell>
                      <TableCell className="text-sm">{employee.timeSpent} mins</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data found for this store</p>
        </div>
      )}
    </div>
  );
}
