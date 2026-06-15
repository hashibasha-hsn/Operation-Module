import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Clock, Download, Calendar, MapPin, User, Filter, Settings, CheckCircle, XCircle, AlertCircle, ChevronDown, Upload } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  email?: string;
  store: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: string;
  expectedHours?: number;
  deviation?: number;
  selfieUrl?: string;
  punchOutImage?: string;
  deviceInfo?: string;
  status?: string;
}

export default function Attendance() {
  const { t } = useLanguage();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const [showAddEntityDialog, setShowAddEntityDialog] = useState(false);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableStores, setAvailableStores] = useState<{ id: string; name: string }[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [dateRange, setDateRange] = useState({ from: undefined as Date | undefined, to: undefined as Date | undefined });
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [assignByTab, setAssignByTab] = useState("store");

  const [attendanceConfig, setAttendanceConfig] = useState({
    status: true,
    geolocation: true,
    checkInImage: true,
    checkOutImage: true,
    operatingHoursStart: "09:00",
    operatingHoursEnd: "18:00",
    dailyWorkingHours: 9,
    calculateOvertime: true,
    // Configuration options from dropdown
    designation: true,
    users: true,
    usersOutsideEntity: true,
    removeInactiveUsers: false,
    primaryAssignee: false,
    notify: false,
  });

  // Fetch attendance configuration from API
  useEffect(() => {
    const fetchAttendanceConfig = async () => {
      try {
        const response = await fetch('http://localhost:3009/api/attendance/config');
        if (response.ok) {
          const data = await response.json();
          setAttendanceConfig(data);
        }
      } catch (error) {
        console.error('Failed to fetch attendance config:', error);
      }
    };

    fetchAttendanceConfig();
  }, []);

  // Fetch stores from database
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('http://localhost:3009/api/org/entities');
        if (response.ok) {
          const data = await response.json();
          // Map the API response to match the expected format
          const stores = data.map((entity: any) => ({
            id: entity.id,
            name: entity.storeName || entity.entityId,
          }));
          setAvailableStores(stores);
        }
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchStores();
  }, []);

  // Fetch users from database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3009/api/user/users');
        if (response.ok) {
          const data = await response.json();
          // Map the API response to match the expected format
          const users = data.users.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
          }));
          setAvailableUsers(users);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch attendance records from API
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      try {
        const response = await fetch('http://localhost:3009/api/attendance/records');
        if (response.ok) {
          const data = await response.json();
          setAttendanceRecords(data);
        }
      } catch (error) {
        console.error('Failed to fetch attendance records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceRecords();
  }, [dateRange, selectedStore, selectedUser]);

  const stats = {
    totalRecords: attendanceRecords.length,
    daysCovered: dateRange.from && dateRange.to ? differenceInDays(dateRange.to, dateRange.from) + 1 : 0,
    employees: new Set(attendanceRecords.map(r => r.userId)).size,
    stores: new Set(attendanceRecords.map(r => r.store)).size,
    expectedWorkHrs: attendanceRecords.reduce((acc, r) => acc + (r.expectedHours || 8), 0),
    actualWorkHrs: attendanceRecords.reduce((acc, r) => acc + (parseFloat(r.totalHours || "0") || 0), 0),
    utilization: 0,
    overtime: 0,
    undertime: 0,
    notPunchedOut: attendanceRecords.filter(r => !r.checkOutTime).length,
  };

  // Calculate utilization
  if (stats.expectedWorkHrs > 0) {
    stats.utilization = Math.round((stats.actualWorkHrs / stats.expectedWorkHrs) * 100);
  }

  // Calculate overtime and undertime
  stats.overtime = attendanceRecords.reduce((acc, r) => {
    const actual = parseFloat(r.totalHours || "0") || 0;
    const expected = r.expectedHours || 8;
    return acc + Math.max(0, actual - expected);
  }, 0);

  stats.undertime = attendanceRecords.reduce((acc, r) => {
    const actual = parseFloat(r.totalHours || "0") || 0;
    const expected = r.expectedHours || 8;
    return acc + Math.max(0, expected - actual);
  }, 0);

  const handleExportCSV = () => {
    const headers = ["Date", "Name", "Employee ID", "Email", "Store", "Punch In", "Punch In Image", "Punch Out", "Punch Out Image", "Time Spent", "Working Hours", "Deviation", "Device Info"];
    const csvContent = [
      headers.join(","),
      ...attendanceRecords.map(record => [
        record.date,
        record.userName,
        record.userId,
        record.email || "-",
        record.store,
        record.checkInTime || "-",
        record.selfieUrl || "-",
        record.checkOutTime || "-",
        record.punchOutImage || "-",
        record.totalHours || "-",
        record.expectedHours || 8,
        record.deviation || "-",
        record.deviceInfo || "-",
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">{t('present')}</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-800">{t('absent')}</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800">{t('late')}</Badge>;
      case "checked-in":
        return <Badge className="bg-blue-100 text-blue-800">{t('checkedIn')}</Badge>;
      case "on-leave":
        return <Badge className="bg-purple-100 text-purple-800">{t('onLeave')}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "absent":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "late":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "checked-in":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('attendanceTracking')}</h1>
            <p className="text-muted-foreground mt-1">{t('trackAndManageEmployeeAttendance')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    {t('configure')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('configureAttendance')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="status">{t('status')}</Label>
                          <p className="text-sm text-muted-foreground">{t('toggleAttendanceOnOff')}</p>
                        </div>
                        <Switch
                          id="status"
                          checked={attendanceConfig.status}
                          onCheckedChange={(checked) => setAttendanceConfig({ ...attendanceConfig, status: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="geolocation">{t('geolocation')}</Label>
                          <p className="text-sm text-muted-foreground">{t('enforcesGpsBasedCheckInOut')}</p>
                        </div>
                        <Switch
                          id="geolocation"
                          checked={attendanceConfig.geolocation}
                          onCheckedChange={(checked) => setAttendanceConfig({ ...attendanceConfig, geolocation: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="checkInImage">{t('checkInImage')}</Label>
                          <p className="text-sm text-muted-foreground">{t('requiresUserToTakeSelfie')}</p>
                        </div>
                        <Switch
                          id="checkInImage"
                          checked={attendanceConfig.checkInImage}
                          onCheckedChange={(checked) => setAttendanceConfig({ ...attendanceConfig, checkInImage: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="checkOutImage">{t('checkOutImage')}</Label>
                          <p className="text-sm text-muted-foreground">{t('requiresSelfieOnCheckOut')}</p>
                        </div>
                        <Switch
                          id="checkOutImage"
                          checked={attendanceConfig.checkOutImage}
                          onCheckedChange={(checked) => setAttendanceConfig({ ...attendanceConfig, checkOutImage: checked })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">{t('operatingHours')}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="operatingHoursStart">{t('startTime')}</Label>
                          <Input
                            id="operatingHoursStart"
                            type="time"
                            value={attendanceConfig.operatingHoursStart}
                            onChange={(e) => setAttendanceConfig({ ...attendanceConfig, operatingHoursStart: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">{t('defineWhenStoreWorkdayStarts')}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="operatingHoursEnd">{t('endTime')}</Label>
                          <Input
                            id="operatingHoursEnd"
                            type="time"
                            value={attendanceConfig.operatingHoursEnd}
                            onChange={(e) => setAttendanceConfig({ ...attendanceConfig, operatingHoursEnd: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">{t('defineWhenStoreWorkdayEnds')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dailyWorkingHours">{t('dailyWorkingHours')}</Label>
                        <Input
                          id="dailyWorkingHours"
                          type="number"
                          value={attendanceConfig.dailyWorkingHours}
                          onChange={(e) => setAttendanceConfig({ ...attendanceConfig, dailyWorkingHours: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">{t('setHowManyHoursCountAsCompleteWorkday')}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="calculateOvertime">{t('calculateTimeDifferenceOvertime')}</Label>
                          <p className="text-sm text-muted-foreground">{t('automaticallyCalculateOverUnderTime')}</p>
                        </div>
                        <Switch
                          id="calculateOvertime"
                          checked={attendanceConfig.calculateOvertime}
                          onCheckedChange={(checked) => setAttendanceConfig({ ...attendanceConfig, calculateOvertime: checked })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={async () => {
                      try {
                        const response = await fetch('http://localhost:3009/api/attendance/config', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(attendanceConfig),
                        });
                        if (response.ok) {
                          setShowConfigDialog(false);
                        }
                      } catch (error) {
                        console.error('Failed to save attendance config:', error);
                      }
                    }}>
                      {t('saveConfiguration')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('configureAttendance')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    {t('publish')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('publishAttendanceSettings')}</DialogTitle>
                    <DialogDescription>
                      {t('assignAttendancePolicies')}
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs value={assignByTab} onValueChange={setAssignByTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="store">{t('byStore')}</TabsTrigger>
                      <TabsTrigger value="user">{t('byUser')}</TabsTrigger>
                      <TabsTrigger value="upload">{t('upload')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="store" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{t('assigneeProfile')}</h3>
                          <Button variant="outline" size="sm" onClick={() => setShowAddEntityDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('addEntity')}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{t('quickAssign')}</h4>
                          <div className="border rounded-lg p-4">
                            <Input placeholder={t('searchStores')} className="mb-2" />
                            {selectedStores.length === 0 ? (
                              <p className="text-sm text-muted-foreground">{t('noStoresSelected')}</p>
                            ) : (
                              <div className="space-y-2">
                                {selectedStores.map(storeId => {
                                  const store = availableStores.find(s => s.id === storeId);
                                  return (
                                    <div key={storeId} className="flex items-center justify-between bg-muted p-2 rounded">
                                      <span className="text-sm">{store?.name}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedStores(selectedStores.filter(id => id !== storeId))}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="user" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{t('assigneeProfile')}</h3>
                          <Button variant="outline" size="sm" onClick={() => setShowAddEntityDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('addEntity')}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">{t('quickAssign')}</h4>
                          <div className="border rounded-lg p-4">
                            <Input placeholder={t('searchUsers')} className="mb-2" />
                            {selectedUsers.length === 0 ? (
                              <p className="text-sm text-muted-foreground">{t('noUsersSelected')}</p>
                            ) : (
                              <div className="space-y-2">
                                {selectedUsers.map(userId => {
                                  const user = availableUsers.find(u => u.id === userId);
                                  return (
                                    <div key={userId} className="flex items-center justify-between bg-muted p-2 rounded">
                                      <div>
                                        <span className="text-sm block">{user?.name}</span>
                                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedUsers(selectedUsers.filter(id => id !== userId))}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="upload" className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">{t('dragAndDropFileHere')}</p>
                        <Button variant="outline" size="sm">{t('chooseFile')}</Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={() => setShowPublishDialog(false)}>
                      {t('publish')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('publishAttendanceSettings')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                {t('report')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('downloadAttendanceReport')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Add Entity Dialog */}
      <Dialog open={showAddEntityDialog} onOpenChange={setShowAddEntityDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{assignByTab === "store" ? t('addStore') : t('addUser')}</DialogTitle>
            <DialogDescription>
              {assignByTab === "store" ? t('selectStoresToAssignAttendancePolicies') : t('selectUsersToAssignAttendancePolicies')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {loadingEntities ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{assignByTab === "store" ? t('loadingStores') : t('loadingUsers')}</p>
              </div>
            ) : assignByTab === "store" ? (
              availableStores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('noStoresAvailable')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableStores.map(store => (
                    <div key={store.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{store.name}</p>
                        <p className="text-xs text-muted-foreground">{store.id}</p>
                      </div>
                      <Button
                        variant={selectedStores.includes(store.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (selectedStores.includes(store.id)) {
                            setSelectedStores(selectedStores.filter(id => id !== store.id));
                          } else {
                            setSelectedStores([...selectedStores, store.id]);
                          }
                        }}
                      >
                        {selectedStores.includes(store.id) ? t('added') : t('add')}
                      </Button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              availableUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('noUsersAvailable')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Button
                        variant={selectedUsers.includes(user.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (selectedUsers.includes(user.id)) {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          } else {
                            setSelectedUsers([...selectedUsers, user.id]);
                          }
                        }}
                      >
                        {selectedUsers.includes(user.id) ? t('added') : t('add')}
                      </Button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEntityDialog(false)}>
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t('searchByUserNameOrId')} className="pl-10" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('searchAttendanceRecords')}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                onChange={(e) => setDateRange({ ...dateRange, from: new Date(e.target.value) })}
                className="w-40"
              />
              <span className="text-muted-foreground">{t('to')}</span>
              <Input
                type="date"
                value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                onChange={(e) => setDateRange({ ...dateRange, to: new Date(e.target.value) })}
                className="w-40"
              />
              <Button variant="outline" size="sm">{t('apply')}</Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('filterByDateRange')}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* KPI Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('kpiOverview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('totalRecords')}</p>
              <p className="text-2xl font-bold">{stats.totalRecords}</p>
              <p className="text-xs text-muted-foreground">{t('totalAttendanceEntriesAvailable')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('daysCovered')}</p>
              <p className="text-2xl font-bold">{stats.daysCovered}</p>
              <p className="text-xs text-muted-foreground">{t('totalDistinctDaysIncluded')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('employees')}</p>
              <p className="text-2xl font-bold">{stats.employees}</p>
              <p className="text-xs text-muted-foreground">{t('uniqueEmployeesWithAtLeastOnePunch')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('stores')}</p>
              <p className="text-2xl font-bold">{stats.stores}</p>
              <p className="text-xs text-muted-foreground">{t('uniqueStoresWithAttendanceActivity')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('expectedWorkHrs')}</p>
              <p className="text-2xl font-bold">{stats.expectedWorkHrs.toFixed(1)} h</p>
              <p className="text-xs text-muted-foreground">{t('totalScheduledHoursBasedOnWorkingHours')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('actualWorkHrs')}</p>
              <p className="text-2xl font-bold">{stats.actualWorkHrs.toFixed(1)} h</p>
              <p className="text-xs text-muted-foreground">{t('hoursCalculatedFromPunchInOut')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('utilization')}</p>
              <p className="text-2xl font-bold">{stats.utilization}%</p>
              <p className="text-xs text-muted-foreground">{t('actualHoursVsExpectedHours')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('overtime')}</p>
              <p className="text-2xl font-bold">{stats.overtime.toFixed(1)} h</p>
              <p className="text-xs text-muted-foreground">{t('hoursWorkedBeyondExpected')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('undertime')}</p>
              <p className="text-2xl font-bold">{stats.undertime.toFixed(1)} h</p>
              <p className="text-xs text-muted-foreground">{t('hoursShortOfExpectedTime')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('notPunchedOut')}</p>
              <p className="text-2xl font-bold">{stats.notPunchedOut}</p>
              <p className="text-xs text-muted-foreground">{t('entriesWithoutValidPunchOut')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('attendanceRecords')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('loadingAttendanceRecords')}</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">{t('date')}</th>
                    <th className="text-left p-3 font-medium">{t('name')}</th>
                    <th className="text-left p-3 font-medium">{t('employeeId')}</th>
                    <th className="text-left p-3 font-medium">{t('email')}</th>
                    <th className="text-left p-3 font-medium">{t('store')}</th>
                    <th className="text-left p-3 font-medium">{t('punchIn')}</th>
                    <th className="text-left p-3 font-medium">{t('punchInImage')}</th>
                    <th className="text-left p-3 font-medium">{t('punchOut')}</th>
                    <th className="text-left p-3 font-medium">{t('punchOutImage')}</th>
                    <th className="text-left p-3 font-medium">{t('timeSpent')}</th>
                    <th className="text-left p-3 font-medium">{t('workingHours')}</th>
                    <th className="text-left p-3 font-medium">{t('deviation')}</th>
                    <th className="text-left p-3 font-medium">{t('deviceInfo')}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{record.date}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div className="font-medium">{record.userName}</div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{record.userId}</td>
                      <td className="p-3 text-sm">{record.email || "-"}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {record.store}
                        </div>
                      </td>
                      <td className="p-3">{record.checkInTime || "-"}</td>
                      <td className="p-3">
                        {record.selfieUrl ? (
                          <a href={record.selfieUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">{t('view')}</a>
                        ) : "-"}
                      </td>
                      <td className="p-3">{record.checkOutTime || "-"}</td>
                      <td className="p-3">
                        {record.punchOutImage ? (
                          <a href={record.punchOutImage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">{t('view')}</a>
                        ) : "-"}
                      </td>
                      <td className="p-3">{record.totalHours || "-"}</td>
                      <td className="p-3">{record.expectedHours || 8}</td>
                      <td className="p-3">
                        {record.deviation !== undefined ? (
                          <Badge className={record.deviation >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {record.deviation >= 0 ? "+" : ""}{record.deviation.toFixed(1)}h
                          </Badge>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-sm">{record.deviceInfo || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
