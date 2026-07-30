import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Search,
  Clock,
  Download,
  Calendar,
  User,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  MapPin,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  fetchAttendanceConfig,
  fetchAttendanceRecords,
  fetchTodayAttendance,
  saveAttendanceConfig,
  type AttendanceRecord as ApiAttendanceRecord,
} from "@/lib/attendanceApi";
import { getOrganizationId, getStoredUser } from "@/lib/authStorage";

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  employeeId?: string;
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
  source?: string;
}

const ORG_API = import.meta.env.VITE_ORG_API || "/api/org";
const USER_API = import.meta.env.VITE_USER_API || "/api/user";

export default function Attendance() {
  const { t } = useLanguage();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showPickerDialog, setShowPickerDialog] = useState(false);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableStores, setAvailableStores] = useState<{ id: string; name: string }[]>([]);
  const [availableUsers, setAvailableUsers] = useState<
    { id: string; name: string; email: string; employeeId?: string }[]
  >([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from, to };
  });
  const [selectedStore, setSelectedStore] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignByTab, setAssignByTab] = useState("store");
  const [storeSearch, setStoreSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [attendanceConfig, setAttendanceConfig] = useState({
    status: true,
    geolocation: true,
    checkInImage: false,
    checkOutImage: false,
    operatingHoursStart: "09:00",
    operatingHoursEnd: "18:00",
    dailyWorkingHours: 9,
    calculateOvertime: true,
    designation: true,
    users: true,
    usersOutsideEntity: true,
    removeInactiveUsers: false,
    primaryAssignee: false,
    notify: false,
    autoCheckInOnLogin: true,
    autoCheckOutOnLogout: true,
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = getStoredUser();

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const [config, records, today] = await Promise.all([
        fetchAttendanceConfig(),
        fetchAttendanceRecords({
          startDate: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
          endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
          store: selectedStore !== "all" ? selectedStore : undefined,
        }),
        fetchTodayAttendance(),
      ]);
      setAttendanceConfig((prev) => ({ ...prev, ...config }));
      setSelectedStores(Array.isArray(config.assignedStoreIds) ? config.assignedStoreIds : []);
      setSelectedUsers(Array.isArray(config.assignedUserIds) ? config.assignedUserIds : []);
      setAttendanceRecords(records as ApiAttendanceRecord[]);
      setTodayRecord(today as AttendanceRecord | null);
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
      toast.error(t('failedToLoadAttendanceData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAttendanceData();
  }, [dateRange, selectedStore]);

  useEffect(() => {
    const loadLookups = async () => {
      setLoadingEntities(true);
      try {
        const orgId = encodeURIComponent(getOrganizationId());
        const [storesRes, usersRes] = await Promise.all([
          fetch(`${ORG_API}/entities?organizationId=${orgId}`),
          fetch(`${USER_API}/users?organizationId=${orgId}&limit=500`),
        ]);
        if (storesRes.ok) {
          const data = await storesRes.json();
          const list = Array.isArray(data) ? data : data?.value || [];
          setAvailableStores(
            list.map((entity: any) => ({
              id: String(entity.id),
              name: entity.storeName || entity.entityId || entity.name || "Store",
            })),
          );
        }
        if (usersRes.ok) {
          const data = await usersRes.json();
          const list = Array.isArray(data) ? data : data.users || [];
          setAvailableUsers(
            list.map((user: any) => ({
              id: String(user.userId || user.id || ""),
              name: user.name || user.email || "User",
              email: user.email || "",
              employeeId: user.employeeId || undefined,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to fetch stores/users:", error);
      } finally {
        setLoadingEntities(false);
      }
    };
    void loadLookups();
  }, []);

  const handleSaveConfig = async () => {
    try {
      await saveAttendanceConfig({
        ...attendanceConfig,
        assignedStoreIds: selectedStores,
        assignedUserIds: selectedUsers,
      });
      setShowConfigDialog(false);
      toast.success(t('attendanceConfigSaved'));
      void loadAttendanceData();
    } catch (error: any) {
      toast.error(error?.message || t('failedToSaveConfig'));
    }
  };

  const handlePublishAttendance = async () => {
    setPublishing(true);
    try {
      await saveAttendanceConfig({
        ...attendanceConfig,
        assignedStoreIds: selectedStores,
        assignedUserIds: selectedUsers,
      });
      toast.success(t('publishedTo', { stores: selectedStores.length, users: selectedUsers.length }));
      setShowPublishDialog(false);
    } catch (error: any) {
      toast.error(error?.message || t('failedToPublish'));
    } finally {
      setPublishing(false);
    }
  };

  const handleUploadAssignees = async (file?: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const nextStores = new Set(selectedStores);
      const nextUsers = new Set(selectedUsers);
      for (const line of lines.slice(1)) {
        const [type, id] = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
        if (!id) continue;
        if (type?.toLowerCase() === "user") nextUsers.add(id);
        else nextStores.add(id);
      }
      setSelectedStores(Array.from(nextStores));
      setSelectedUsers(Array.from(nextUsers));
      toast.success(t('assigneeListImported'));
    } catch (error: any) {
      toast.error(error?.message || t('failedToImport'));
    }
  };

  const filteredPublishStores = availableStores.filter((s) =>
    s.name.toLowerCase().includes(storeSearch.toLowerCase()),
  );
  const filteredPublishUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.employeeId || "").toLowerCase().includes(userSearch.toLowerCase()),
  );

  const resolveUserProfile = (record: AttendanceRecord) =>
    availableUsers.find((user) => user.id === record.userId);

  const displayName = (record: AttendanceRecord) =>
    record.userName || resolveUserProfile(record)?.name || record.email || "-";

  const displayEmployeeId = (record: AttendanceRecord) => {
    const fromRecord = record.employeeId?.trim();
    if (fromRecord && !/^[0-9a-f-]{36}$/i.test(fromRecord)) return fromRecord;
    return resolveUserProfile(record)?.employeeId?.trim() || "-";
  };

  const filteredRecords = attendanceRecords.filter((record) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      displayName(record).toLowerCase().includes(q) ||
      displayEmployeeId(record).toLowerCase().includes(q) ||
      record.email?.toLowerCase().includes(q) ||
      record.store?.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    const headers = [
      t('date'),
      t('name'),
      t('employeeId'),
      t('email'),
      t('store'),
      t('punchIn'),
      t('punchOut'),
      t('timeSpent'),
      t('workingHours'),
      t('deviation'),
      t('deviceInfo'),
    ];
    const escape = (value: string) =>
      /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    const rows = filteredRecords.map((record) =>
      [
        record.date,
        displayName(record),
        displayEmployeeId(record),
        record.email || "-",
        record.store,
        record.checkInTime || "-",
        record.checkOutTime || "-",
        record.totalHours || "-",
        String(record.expectedHours ?? attendanceConfig.dailyWorkingHours),
        record.deviation != null ? String(record.deviation) : "-",
        record.deviceInfo || "-",
      ]
        .map((v) => escape(String(v)))
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(t('attendanceCsvDownloaded'));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">{t("present")}</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-800">{t("absent")}</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800">{t("late")}</Badge>;
      case "checked-in":
        return <Badge className="bg-blue-100 text-blue-800">{t("checkedIn")}</Badge>;
      default:
        return status ? <Badge variant="secondary">{status}</Badge> : <Badge variant="outline">{t("noRecord")}</Badge>;
    }
  };

  const ImageCell = ({ url, label }: { url?: string; label: string }) => {
    if (!url) return <span className="text-muted-foreground">-</span>;
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline"
        title={label}
      >
        <ImageIcon className="h-3.5 w-3.5" />
        {t('view')}
      </a>
    );
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px]">
      {/* Header — Taqtics Admin Studio Attendance */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("attendanceTracking")}</h1>
              <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
                {t('attendanceTrackingDesc')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                {t('stepOneConfigure')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('configureAttendanceSettings')}</DialogTitle>
                <DialogDescription>
                  {t('configureAttendanceSettingsDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('captureRules')}
                  </h3>
                  {[
                    {
                      id: "status",
                      labelKey: "status" as const,
                      descKey: "statusDesc" as const,
                      checked: attendanceConfig.status,
                      key: "status" as const,
                    },
                    {
                      id: "geolocation",
                      labelKey: "geolocation" as const,
                      descKey: "geolocationDesc" as const,
                      checked: attendanceConfig.geolocation,
                      key: "geolocation" as const,
                    },
                    {
                      id: "checkInImage",
                      labelKey: "checkInImage" as const,
                      descKey: "checkInImageDesc" as const,
                      checked: attendanceConfig.checkInImage,
                      key: "checkInImage" as const,
                    },
                    {
                      id: "checkOutImage",
                      labelKey: "checkOutImage" as const,
                      descKey: "checkOutImageDesc" as const,
                      checked: attendanceConfig.checkOutImage,
                      key: "checkOutImage" as const,
                    },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 py-2 border-b border-border/60">
                      <div>
                        <Label htmlFor={item.id}>{t(item.labelKey)}</Label>
                        <p className="text-sm text-muted-foreground">{t(item.descKey)}</p>
                      </div>
                      <Switch
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={(checked) =>
                          setAttendanceConfig({ ...attendanceConfig, [item.key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('operatingHours')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="operatingHoursStart">{t('startTime')}</Label>
                      <Input
                        id="operatingHoursStart"
                        type="time"
                        value={attendanceConfig.operatingHoursStart}
                        onChange={(e) =>
                          setAttendanceConfig({
                            ...attendanceConfig,
                            operatingHoursStart: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">{t('startTimeHint')}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operatingHoursEnd">{t('endTime')}</Label>
                      <Input
                        id="operatingHoursEnd"
                        type="time"
                        value={attendanceConfig.operatingHoursEnd}
                        onChange={(e) =>
                          setAttendanceConfig({
                            ...attendanceConfig,
                            operatingHoursEnd: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">{t('endTimeHint')}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dailyWorkingHours">{t('dailyWorkingHours')}</Label>
                    <Input
                      id="dailyWorkingHours"
                      type="number"
                      min={1}
                      max={24}
                      value={attendanceConfig.dailyWorkingHours}
                      onChange={(e) =>
                        setAttendanceConfig({
                          ...attendanceConfig,
                          dailyWorkingHours: parseInt(e.target.value || "0", 10),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('dailyWorkingHoursHint')}
                    </p>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-2">
                    <div>
                      <Label htmlFor="calculateOvertime">{t('calculateOvertime')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('calculateOvertimeHint')}
                      </p>
                    </div>
                    <Switch
                      id="calculateOvertime"
                      checked={attendanceConfig.calculateOvertime}
                      onCheckedChange={(checked) =>
                        setAttendanceConfig({ ...attendanceConfig, calculateOvertime: checked })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold">{t('webSessionCapture')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('webSessionCaptureHint')}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="autoCheckInOnLogin">{t('autoCheckInOnLogin')}</Label>
                    <Switch
                      id="autoCheckInOnLogin"
                      checked={attendanceConfig.autoCheckInOnLogin}
                      onCheckedChange={(checked) =>
                        setAttendanceConfig({ ...attendanceConfig, autoCheckInOnLogin: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="autoCheckOutOnLogout">{t('autoCheckOutOnLogout')}</Label>
                    <Switch
                      id="autoCheckOutOnLogout"
                      checked={attendanceConfig.autoCheckOutOnLogout}
                      onCheckedChange={(checked) =>
                        setAttendanceConfig({ ...attendanceConfig, autoCheckOutOnLogout: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={() => void handleSaveConfig()}>{t("saveConfiguration")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                {t('stepTwoPublish')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('publishAttendanceSettings')}</DialogTitle>
                <DialogDescription>
                  {t('publishAttendanceSettingsDesc')}
                </DialogDescription>
              </DialogHeader>
              <Tabs value={assignByTab} onValueChange={setAssignByTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="store">{t('byStore')}</TabsTrigger>
                  <TabsTrigger value="user">{t('byUser')}</TabsTrigger>
                  <TabsTrigger value="profile">{t('assigneeProfile')}</TabsTrigger>
                </TabsList>

                <TabsContent value="store" className="space-y-3 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      {selectedStores.length}{t('storesSelected')}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowPickerDialog(true)}>
                      <Building2 className="w-4 h-4 mr-2" />
                      {t('addStores')}
                    </Button>
                  </div>
                  <Input
                    placeholder={t('searchSelectedStores')}
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                  />
                  <div className="max-h-56 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {selectedStores.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">{t('noStoresSelected')}</p>
                    ) : (
                      selectedStores
                        .map((id) => availableStores.find((s) => s.id === id))
                        .filter(Boolean)
                        .filter((s) =>
                          (s?.name || "").toLowerCase().includes(storeSearch.toLowerCase()),
                        )
                        .map((store) => (
                          <div
                            key={store!.id}
                            className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                          >
                            <span className="text-sm">{store!.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSelectedStores(selectedStores.filter((id) => id !== store!.id))
                              }
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="user" className="space-y-3 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      {selectedUsers.length}{t('usersSelected')}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowPickerDialog(true)}>
                      <User className="w-4 h-4 mr-2" />
                      {t('addUsers')}
                    </Button>
                  </div>
                  <Input
                    placeholder={t('searchSelectedUsers')}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <div className="max-h-56 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {selectedUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">{t('noUsersSelected')}</p>
                    ) : (
                      selectedUsers
                        .map((id) => availableUsers.find((u) => u.id === id))
                        .filter(Boolean)
                        .filter(
                          (u) =>
                            (u?.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
                            (u?.email || "").toLowerCase().includes(userSearch.toLowerCase()),
                        )
                        .map((user) => (
                          <div
                            key={user!.id}
                            className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium">{user!.name}</p>
                              <p className="text-xs text-muted-foreground">{user!.email}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSelectedUsers(selectedUsers.filter((id) => id !== user!.id))
                              }
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="space-y-4 pt-3">
                  <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {t('assigneeProfileHint')}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => void handleUploadAssignees(e.target.files?.[0])}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      {t('importCsv')}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={() => void handlePublishAttendance()} disabled={publishing}>
                  {publishing ? t('publishing') : t('publish')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            {t('downloadCsv')}
          </Button>
        </div>
      </div>

      {/* Taqtics 3-step flow */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            step: "1",
            titleKey: "stepConfigure" as const,
            bodyKey: "stepConfigureDesc" as const,
            icon: Settings,
          },
          {
            step: "2",
            titleKey: "stepPublish" as const,
            bodyKey: "stepPublishDesc" as const,
            icon: Upload,
          },
          {
            step: "3",
            titleKey: "stepViewReport" as const,
            bodyKey: "stepViewReportDesc" as const,
            icon: Calendar,
          },
        ].map((item) => (
          <div
            key={item.step}
            className="flex gap-3 rounded-xl border bg-background/80 px-4 py-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {item.step}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="font-semibold text-sm">{t(item.titleKey)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(item.bodyKey)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Policy snapshot + today */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-xl border bg-background p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{t('activePolicy')}</h2>
            <Badge variant={attendanceConfig.status ? "default" : "secondary"}>
              {attendanceConfig.status ? t('attendanceOn') : t('attendanceOff')}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {t('geolocation')}
              </p>
              <p className="font-medium mt-1">{attendanceConfig.geolocation ? t('on') : t('off')}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">{t('selfieInOut')}</p>
              <p className="font-medium mt-1">
                {attendanceConfig.checkInImage ? t('in') : "—"} /{" "}
                {attendanceConfig.checkOutImage ? t('out') : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">{t('operatingHours')}</p>
              <p className="font-medium mt-1">
                {attendanceConfig.operatingHoursStart} – {attendanceConfig.operatingHoursEnd}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">{t('dailyHours')}</p>
              <p className="font-medium mt-1">{attendanceConfig.dailyWorkingHours} h</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('publishedTo', { stores: selectedStores.length, users: selectedUsers.length })}
          </p>
        </div>

        <div className="lg:col-span-4 rounded-xl border bg-background p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            {t('myAttendanceToday')}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">{t('name')}</span>
              <span className="font-medium truncate">
                {(currentUser.name as string) || (currentUser.email as string) || "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">{t('punchIn')}</span>
              <span className="font-medium">{todayRecord?.checkInTime || t('notYet')}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">{t('punchOut')}</span>
              <span className="font-medium">{todayRecord?.checkOutTime || t('notYet')}</span>
            </div>
            <div className="flex justify-between gap-2 items-center">
              <span className="text-muted-foreground">{t('status')}</span>
              {getStatusBadge(todayRecord?.status)}
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">{t('timeSpent')}</span>
              <span className="font-medium">
                {todayRecord?.totalHours ? `${todayRecord.totalHours} h` : "—"}
              </span>
            </div>
          </div>
          {(attendanceConfig.autoCheckInOnLogin || attendanceConfig.autoCheckOutOnLogout) && (
            <p className="text-[11px] text-muted-foreground leading-snug pt-1 border-t">
              <CheckCircle className="inline h-3 w-3 mr-1 text-primary" />
              {t('autoCaptureNote')}
            </p>
          )}
        </div>
      </div>

      {/* Report — lives on Attendance page per Taqtics docs */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t('attendanceReport')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('attendanceReportDesc')}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchByNameOrId')}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="lg:col-span-5 flex flex-wrap items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setDateRange({ ...dateRange, from: new Date(e.target.value) });
                  }
                }}
                className="w-full sm:w-[150px]"
              />
              <span className="text-muted-foreground text-sm">{t('to')}</span>
              <Input
                type="date"
                value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setDateRange({ ...dateRange, to: new Date(e.target.value) });
                  }
                }}
                className="w-full sm:w-[150px]"
              />
            </div>
            <div className="lg:col-span-3 flex flex-wrap gap-2">
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-full sm:flex-1">
                  <SelectValue placeholder={t('allStores')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStores')}</SelectItem>
                  {availableStores.map((store) => (
                    <SelectItem key={store.id} value={store.name}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => void loadAttendanceData()}>
                {t('apply')}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">{t('loadingAttendanceRecords')}</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2 px-6">
              <AlertCircle className="h-8 w-8 mx-auto opacity-40" />
              <p>{t('noAttendanceEntries')}</p>
              <p className="text-xs">
                {t('noAttendanceEntriesHint')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium whitespace-nowrap">{t('date')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('name')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('employeeId')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('email')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('store')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('punchIn')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('punchInImage')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('punchOut')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('punchOutImage')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('timeSpent')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('workingHours')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('deviation')}</th>
                    <th className="p-3 font-medium whitespace-nowrap">{t('deviceInfo')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/20">
                      <td className="p-3 whitespace-nowrap">{record.date}</td>
                      <td className="p-3 font-medium whitespace-nowrap">{displayName(record)}</td>
                      <td className="p-3 whitespace-nowrap">{displayEmployeeId(record)}</td>
                      <td className="p-3 max-w-[180px] truncate">{record.email || "-"}</td>
                      <td className="p-3 max-w-[140px] truncate">{record.store}</td>
                      <td className="p-3 whitespace-nowrap">{record.checkInTime || "-"}</td>
                      <td className="p-3">
                        <ImageCell url={record.selfieUrl} label={t('punchInImage')} />
                      </td>
                      <td className="p-3 whitespace-nowrap">{record.checkOutTime || "-"}</td>
                      <td className="p-3">
                        <ImageCell url={record.punchOutImage} label={t('punchOutImage')} />
                      </td>
                      <td className="p-3 whitespace-nowrap">{record.totalHours || "-"}</td>
                      <td className="p-3 whitespace-nowrap">
                        {record.expectedHours ?? attendanceConfig.dailyWorkingHours}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {record.deviation != null ? (
                          <Badge
                            className={
                              record.deviation >= 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {record.deviation >= 0 ? "+" : ""}
                            {Number(record.deviation).toFixed(1)}h
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-3 max-w-[160px] truncate text-xs text-muted-foreground">
                        {record.deviceInfo || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground px-4 py-3 border-t bg-muted/20">
            {t('attendanceTableNote')}
          </p>
        </div>
      </section>

      {/* Store / user picker */}
      <Dialog open={showPickerDialog} onOpenChange={setShowPickerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{assignByTab === "user" ? t('addUsers') : t('addStores')}</DialogTitle>
            <DialogDescription>
              {assignByTab === "user"
                ? t('selectUsersForPolicy')
                : t('selectStoresForPolicy')}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2 py-2">
            {loadingEntities ? (
              <p className="text-center text-muted-foreground py-8">{t('loading')}</p>
            ) : assignByTab === "user" ? (
              filteredPublishUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('noUsersAvailable')}</p>
              ) : (
                filteredPublishUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedUsers.includes(user.id) ? "default" : "outline"}
                      onClick={() => {
                        setSelectedUsers((prev) =>
                          prev.includes(user.id)
                            ? prev.filter((id) => id !== user.id)
                            : [...prev, user.id],
                        );
                      }}
                    >
                      {selectedUsers.includes(user.id) ? t('added') : t('add')}
                    </Button>
                  </div>
                ))
              )
            ) : filteredPublishStores.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t('noStoresAvailable')}</p>
            ) : (
              filteredPublishStores.map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <p className="font-medium text-sm">{store.name}</p>
                  <Button
                    size="sm"
                    variant={selectedStores.includes(store.id) ? "default" : "outline"}
                    onClick={() => {
                      setSelectedStores((prev) =>
                        prev.includes(store.id)
                          ? prev.filter((id) => id !== store.id)
                          : [...prev, store.id],
                      );
                    }}
                  >
                    {selectedStores.includes(store.id) ? t('added') : t('add')}
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPickerDialog(false)}>
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
