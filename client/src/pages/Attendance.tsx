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

const ORG_API = import.meta.env.VITE_ORG_API || "http://localhost:3009/api/org";
const USER_API = import.meta.env.VITE_USER_API || "http://localhost:3009/api/user";

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
      toast.error("Failed to load attendance data");
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
      toast.success("Attendance configuration saved");
      void loadAttendanceData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save attendance configuration");
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
      toast.success(
        `Attendance settings published to ${selectedStores.length} store(s) and ${selectedUsers.length} user(s)`,
      );
      setShowPublishDialog(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to publish attendance settings");
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
      toast.success("Assignee list imported from file");
    } catch (error: any) {
      toast.error(error?.message || "Failed to import file");
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
    // Taqtics note: CSV excludes photo binaries; keep URL placeholders only when present as text refs
    const headers = [
      "Date",
      "Name",
      "Employee ID",
      "Email",
      "Store",
      "Punch In",
      "Punch Out",
      "Time Spent",
      "Working Hours",
      "Deviation",
      "Device Info",
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
    toast.success("Attendance CSV downloaded");
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
        View
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
                Monitor store-level check-ins and check-outs — in-time, out-time, and total hours on-site.
                Configure working-hour rules, publish to stores or users, then review the attendance log below.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                1. Configure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configure Attendance Settings</DialogTitle>
                <DialogDescription>
                  Define how attendance should be captured and calculated for your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Capture rules
                  </h3>
                  {[
                    {
                      id: "status",
                      label: "Status",
                      desc: "Toggle attendance on/off for the org",
                      checked: attendanceConfig.status,
                      key: "status" as const,
                    },
                    {
                      id: "geolocation",
                      label: "Geolocation",
                      desc: "Enforces GPS-based check-in/out (mobile)",
                      checked: attendanceConfig.geolocation,
                      key: "geolocation" as const,
                    },
                    {
                      id: "checkInImage",
                      label: "Check-in image",
                      desc: "Requires user to take a selfie while checking in",
                      checked: attendanceConfig.checkInImage,
                      key: "checkInImage" as const,
                    },
                    {
                      id: "checkOutImage",
                      label: "Check-out image",
                      desc: "Requires selfie on check-out",
                      checked: attendanceConfig.checkOutImage,
                      key: "checkOutImage" as const,
                    },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 py-2 border-b border-border/60">
                      <div>
                        <Label htmlFor={item.id}>{item.label}</Label>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
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
                    Operating hours
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="operatingHoursStart">Start time</Label>
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
                      <p className="text-xs text-muted-foreground">When a store&apos;s workday starts</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operatingHoursEnd">End time</Label>
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
                      <p className="text-xs text-muted-foreground">When a store&apos;s workday ends</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dailyWorkingHours">Daily working hours</Label>
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
                      Hours that count as a complete workday
                    </p>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-2">
                    <div>
                      <Label htmlFor="calculateOvertime">Calculate time difference (overtime)</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically calculate over/under time
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
                  <h3 className="text-sm font-semibold">Web session capture</h3>
                  <p className="text-xs text-muted-foreground">
                    Punch-in can also be recorded on web login and punch-out on logout (in addition to mobile).
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="autoCheckInOnLogin">Auto check-in on login</Label>
                    <Switch
                      id="autoCheckInOnLogin"
                      checked={attendanceConfig.autoCheckInOnLogin}
                      onCheckedChange={(checked) =>
                        setAttendanceConfig({ ...attendanceConfig, autoCheckInOnLogin: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="autoCheckOutOnLogout">Auto check-out on logout</Label>
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
                2. Publish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Publish Attendance Settings</DialogTitle>
                <DialogDescription>
                  Assign attendance policies by store or by user — same assignment pattern as Processes.
                </DialogDescription>
              </DialogHeader>
              <Tabs value={assignByTab} onValueChange={setAssignByTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="store">By Store</TabsTrigger>
                  <TabsTrigger value="user">By User</TabsTrigger>
                  <TabsTrigger value="profile">Assignee Profile</TabsTrigger>
                </TabsList>

                <TabsContent value="store" className="space-y-3 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      {selectedStores.length} store(s) selected
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowPickerDialog(true)}>
                      <Building2 className="w-4 h-4 mr-2" />
                      Add stores
                    </Button>
                  </div>
                  <Input
                    placeholder="Search selected stores…"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                  />
                  <div className="max-h-56 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {selectedStores.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">No stores selected</p>
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
                      {selectedUsers.length} user(s) selected
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowPickerDialog(true)}>
                      <User className="w-4 h-4 mr-2" />
                      Add users
                    </Button>
                  </div>
                  <Input
                    placeholder="Search selected users…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <div className="max-h-56 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {selectedUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">No users selected</p>
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
                      You can also assign via an Assignee Profile (same as Processes). Import a CSV of
                      store/user IDs, or manage profiles under Users → Hybrid Assignee.
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
                      Import CSV (type,id)
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={() => void handlePublishAttendance()} disabled={publishing}>
                  {publishing ? "Publishing…" : "Publish"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            DOWNLOAD CSV
          </Button>
        </div>
      </div>

      {/* Taqtics 3-step flow */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            step: "1",
            title: "Configure",
            body: "Status, geolocation, selfie rules, operating hours, overtime.",
            icon: Settings,
          },
          {
            step: "2",
            title: "Publish",
            body: "Assign policies by store, user, or assignee profile.",
            icon: Upload,
          },
          {
            step: "3",
            title: "View report",
            body: "Punch logs stay on this page — filter by date and export CSV.",
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
                <p className="font-semibold text-sm">{item.title}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Policy snapshot + today */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-xl border bg-background p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Active policy</h2>
            <Badge variant={attendanceConfig.status ? "default" : "secondary"}>
              {attendanceConfig.status ? "Attendance ON" : "Attendance OFF"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Geolocation
              </p>
              <p className="font-medium mt-1">{attendanceConfig.geolocation ? "On" : "Off"}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">Selfie in / out</p>
              <p className="font-medium mt-1">
                {attendanceConfig.checkInImage ? "In" : "—"} /{" "}
                {attendanceConfig.checkOutImage ? "Out" : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">Operating hours</p>
              <p className="font-medium mt-1">
                {attendanceConfig.operatingHoursStart} – {attendanceConfig.operatingHoursEnd}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-xs text-muted-foreground">Daily hours</p>
              <p className="font-medium mt-1">{attendanceConfig.dailyWorkingHours} h</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Published to <strong>{selectedStores.length}</strong> store(s) and{" "}
            <strong>{selectedUsers.length}</strong> user(s).
          </p>
        </div>

        <div className="lg:col-span-4 rounded-xl border bg-background p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            My attendance today
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium truncate">
                {(currentUser.name as string) || (currentUser.email as string) || "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Punch in</span>
              <span className="font-medium">{todayRecord?.checkInTime || "Not yet"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Punch out</span>
              <span className="font-medium">{todayRecord?.checkOutTime || "Not yet"}</span>
            </div>
            <div className="flex justify-between gap-2 items-center">
              <span className="text-muted-foreground">Status</span>
              {getStatusBadge(todayRecord?.status)}
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Time spent</span>
              <span className="font-medium">
                {todayRecord?.totalHours ? `${todayRecord.totalHours} h` : "—"}
              </span>
            </div>
          </div>
          {(attendanceConfig.autoCheckInOnLogin || attendanceConfig.autoCheckOutOnLogout) && (
            <p className="text-[11px] text-muted-foreground leading-snug pt-1 border-t">
              <CheckCircle className="inline h-3 w-3 mr-1 text-primary" />
              Web login/logout can create punch records when auto capture is enabled.
            </p>
          )}
        </div>
      </div>

      {/* Report — lives on Attendance page per Taqtics docs */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">3. Attendance report</h2>
            <p className="text-sm text-muted-foreground">
              Real-time punch-in / punch-out records. Filter by date, then export with DOWNLOAD CSV.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, employee ID, or email"
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
              <span className="text-muted-foreground text-sm">to</span>
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
                  <SelectValue placeholder="All stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stores</SelectItem>
                  {availableStores.map((store) => (
                    <SelectItem key={store.id} value={store.name}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => void loadAttendanceData()}>
                Apply
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-background overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading attendance records…</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2 px-6">
              <AlertCircle className="h-8 w-8 mx-auto opacity-40" />
              <p>No attendance entries for this filter.</p>
              <p className="text-xs">
                Configure and publish settings, then punches appear here after check-in/out.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium whitespace-nowrap">Date</th>
                    <th className="p-3 font-medium whitespace-nowrap">Name</th>
                    <th className="p-3 font-medium whitespace-nowrap">Employee ID</th>
                    <th className="p-3 font-medium whitespace-nowrap">Email</th>
                    <th className="p-3 font-medium whitespace-nowrap">Store</th>
                    <th className="p-3 font-medium whitespace-nowrap">Punch In</th>
                    <th className="p-3 font-medium whitespace-nowrap">Punch In Image</th>
                    <th className="p-3 font-medium whitespace-nowrap">Punch Out</th>
                    <th className="p-3 font-medium whitespace-nowrap">Punch Out Image</th>
                    <th className="p-3 font-medium whitespace-nowrap">Time Spent</th>
                    <th className="p-3 font-medium whitespace-nowrap">Working Hours</th>
                    <th className="p-3 font-medium whitespace-nowrap">Deviation</th>
                    <th className="p-3 font-medium whitespace-nowrap">Device Info</th>
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
                        <ImageCell url={record.selfieUrl} label="Punch in image" />
                      </td>
                      <td className="p-3 whitespace-nowrap">{record.checkOutTime || "-"}</td>
                      <td className="p-3">
                        <ImageCell url={record.punchOutImage} label="Punch out image" />
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
            Note: Selfie and GPS data are captured on mobile when camera/location permissions are on.
            CSV export includes all fields except photo binaries (view images in the web table).
          </p>
        </div>
      </section>

      {/* Store / user picker */}
      <Dialog open={showPickerDialog} onOpenChange={setShowPickerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{assignByTab === "user" ? "Add users" : "Add stores"}</DialogTitle>
            <DialogDescription>
              {assignByTab === "user"
                ? "Select users to assign attendance policies"
                : "Select stores to assign attendance policies"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2 py-2">
            {loadingEntities ? (
              <p className="text-center text-muted-foreground py-8">Loading…</p>
            ) : assignByTab === "user" ? (
              filteredPublishUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users available</p>
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
                      {selectedUsers.includes(user.id) ? "Added" : "Add"}
                    </Button>
                  </div>
                ))
              )
            ) : filteredPublishStores.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No stores available</p>
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
                    {selectedStores.includes(store.id) ? "Added" : "Add"}
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPickerDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
