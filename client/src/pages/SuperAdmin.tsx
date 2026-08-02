import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStoredUser, getOrganizationId } from "@/lib/authStorage";
import {
  Languages,
  ShieldCheck,
  Palette,
  Search,
  Plus,
  Trash2,
  Save,
  RefreshCcw,
  Users,
  Shield,
  User,
  Loader2,
  Check,
} from "lucide-react";

const LANGUAGE_API = import.meta.env.VITE_LANGUAGE_API || "/api/language";

type LanguageEntry = {
  id: number;
  key: string;
  en: string;
  ar: string;
};

type AdminUser = {
  id: string;
  userId: string;
  name: string;
  email: string;
  designation?: string;
  role?: string;
  isActive?: boolean;
};

const THEME_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "primary", label: "Primary color", placeholder: "#0284c7" },
  { key: "radius", label: "Border radius", placeholder: "1rem" },
  { key: "gradientPrimaryStart", label: "Primary gradient start", placeholder: "#0284c7" },
  { key: "gradientPrimaryMid", label: "Primary gradient middle", placeholder: "#0ea5e9" },
  { key: "gradientPrimaryEnd", label: "Primary gradient end", placeholder: "#06b6d4" },
  { key: "gradientPrimaryHoverStart", label: "Primary hover start", placeholder: "#0369a1" },
  { key: "gradientPrimaryHoverMid", label: "Primary hover middle", placeholder: "#0284c7" },
  { key: "gradientPrimaryHoverEnd", label: "Primary hover end", placeholder: "#0891b2" },
  { key: "gradientHeaderStart", label: "Header gradient start", placeholder: "#0f172a" },
  { key: "gradientHeaderMid", label: "Header gradient mid", placeholder: "#0c4a6e" },
  { key: "gradientHeaderMid2", label: "Header gradient mid 2", placeholder: "#075985" },
  { key: "gradientHeaderEnd", label: "Header gradient end", placeholder: "#0369a1" },
  { key: "gradientHeaderAccent", label: "Header accent line", placeholder: "#38bdf8" },
  { key: "gradientBadgeStart", label: "Badge gradient start", placeholder: "#0284c7" },
  { key: "gradientBadgeEnd", label: "Badge gradient end", placeholder: "#0ea5e9" },
  { key: "loginPanelEnd", label: "Login panel end", placeholder: "#0f172a" },
];

export default function SuperAdmin() {
  const { t } = useLanguage();
  const user = getStoredUser();
  const orgId = getOrganizationId();
  const [activeTab, setActiveTab] = useState("labels");
  const isSuper = user.role === "super_admin";

  // ------- Labels tab -------
  const [entries, setEntries] = useState<LanguageEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [dirty, setDirty] = useState<Record<number, LanguageEntry>>({});
  const [newEntry, setNewEntry] = useState({ key: "", en: "", ar: "" });

  // ------- Theme tab -------
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [themeLoading, setThemeLoading] = useState(false);

  // ------- Admins tab -------
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [roleBusy, setRoleBusy] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const res = await fetch(`${LANGUAGE_API}/entries`);
      if (!res.ok) throw new Error("Failed to load labels");
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
      setDirty({});
    } catch (e: any) {
      toast.error(e?.message || "Failed to load labels");
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const loadTheme = useCallback(async () => {
    setThemeLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_ORG_API || "/api/org"}/ui-settings`, {
        headers: { "X-Organization-Id": orgId },
      });
      if (!res.ok) return;
      const data = await res.json();
      setTheme(data?.theme || {});
    } finally {
      setThemeLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_USER_API || "/api/user"}/users?limit=1000`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      const users = Array.isArray(data) ? data : data?.users || [];
      setAdmins(
        users.map((u: any) => ({
          id: u.userId || u.id,
          userId: u.userId || u.id,
          name: u.name || "",
          email: u.email || "",
          designation: u.designation || "",
          role: u.role || "user",
          isActive: u.isActive !== false,
        })),
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to load users");
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.key.toLowerCase().includes(q) ||
        (e.en || "").toLowerCase().includes(q) ||
        (e.ar || "").toLowerCase().includes(q),
    );
  }, [entries, search]);

  const handleEdit = (id: number, field: "en" | "ar", value: string) => {
    setDirty((prev) => {
      const base = entries.find((e) => e.id === id)!;
      return { ...prev, [id]: { ...base, [field]: value } };
    });
  };

  const handleSaveLabels = async () => {
    const changed = Object.values(dirty);
    if (changed.length === 0) {
      toast.info("No label changes to save");
      return;
    }
    try {
      for (const entry of changed) {
        const res = await fetch(`${LANGUAGE_API}/entries/${entry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ en: entry.en, ar: entry.ar }),
        });
        if (!res.ok) throw new Error(`Failed to save ${entry.key}`);
      }
      localStorage.removeItem(`translations_en`);
      localStorage.removeItem(`translations_en_timestamp`);
      localStorage.removeItem(`translations_ar`);
      localStorage.removeItem(`translations_ar_timestamp`);
      try {
        await fetch(`${LANGUAGE_API}/cache/clear`, { method: "POST" });
      } catch {}
      const i18n = (window as any).i18n;
      if (i18n) {
        await i18n.reloadResources(["en", "ar"]);
      }
      toast.success("Labels saved — applied instantly");
      setDirty({});
      await loadEntries();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save labels");
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.key.trim()) {
      toast.error("Key is required");
      return;
    }
    try {
      const res = await fetch(`${LANGUAGE_API}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newEntry.key.trim(),
          en: newEntry.en,
          ar: newEntry.ar,
        }),
      });
      if (!res.ok) throw new Error("Failed to add key");
      toast.success("Key added");
      setNewEntry({ key: "", en: "", ar: "" });
      await loadEntries();
    } catch (e: any) {
      toast.error(e?.message || "Failed to add key");
    }
  };

  const handleDeleteEntry = async (entry: LanguageEntry) => {
    try {
      const res = await fetch(`${LANGUAGE_API}/entries/${entry.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete key");
      toast.success(`Deleted ${entry.key} — falling back to default text`);
      await loadEntries();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete key");
    }
  };

  const handleThemeChange = (key: string, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
    applyThemePreview({ ...theme, [key]: value });
  };

  const applyThemePreview = (values: Record<string, string>) => {
    const entries = Object.entries(values).filter(([, v]) => v);
    if (entries.length === 0) return;
    const vars = entries
      .map(([key, value]) => {
        const nameMap: Record<string, string> = {
          primary: "--primary",
          radius: "--radius",
          gradientPrimaryStart: "--gradient-primary-start",
          gradientPrimaryMid: "--gradient-primary-mid",
          gradientPrimaryEnd: "--gradient-primary-end",
          gradientPrimaryHoverStart: "--gradient-primary-hover-start",
          gradientPrimaryHoverMid: "--gradient-primary-hover-mid",
          gradientPrimaryHoverEnd: "--gradient-primary-hover-end",
          gradientHeaderStart: "--gradient-header-start",
          gradientHeaderMid: "--gradient-header-mid",
          gradientHeaderMid2: "--gradient-header-mid2",
          gradientHeaderEnd: "--gradient-header-end",
          gradientHeaderAccent: "--gradient-header-accent",
          gradientBadgeStart: "--gradient-badge-start",
          gradientBadgeEnd: "--gradient-badge-end",
          loginPanelEnd: "--login-panel-end",
        };
        return nameMap[key] ? `${nameMap[key]}: ${value};` : "";
      })
      .filter(Boolean)
      .join("\n");
    let style = document.getElementById("super-admin-theme-preview") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "super-admin-theme-preview";
      document.head.appendChild(style);
    }
    style.textContent = `:root {\n${vars}\n}`;
  };

  const handleSaveTheme = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_ORG_API || "/api/org"}/ui-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Organization-Id": orgId,
        },
        body: JSON.stringify({ theme }),
      });
      if (!res.ok) throw new Error("Failed to save theme");
      toast.success("Theme saved — applied to all users");
      applyThemePreview(theme);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save theme");
    }
  };

  const handleResetTheme = () => {
    setTheme({});
    document.getElementById("super-admin-theme-preview")?.remove();
    toast.success("Theme reset to default");
  };

  const handleRoleChange = async (target: AdminUser, role: string) => {
    if (role === target.role) return;
    if (target.role === "super_admin" && role !== "super_admin") {
      toast.error("Super admin role cannot be changed");
      return;
    }
    setRoleBusy(target.userId);
    try {
      const actorId = user.userId || user.id;
      const res = await fetch(
        `${import.meta.env.VITE_USER_API || "/api/user"}/users/${target.userId}/role`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-User-Id": actorId },
          body: JSON.stringify({ role, actorUserId: actorId }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to update role");
      }
      toast.success(`${target.name || target.email} is now ${role}`);
      await loadAdmins();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update role");
    } finally {
      setRoleBusy(null);
    }
  };

  if (!isSuper) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <ShieldCheck className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-semibold">Super Admin Only</h2>
            <p className="text-muted-foreground">You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleBadge = (role?: string) => {
    if (role === "super_admin") return <Badge className="bg-amber-500 hover:bg-amber-500">Super Admin</Badge>;
    if (role === "admin") return <Badge className="bg-sky-600 hover:bg-sky-600">Admin</Badge>;
    return <Badge variant="secondary">User</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Super Admin</h1>
            <p className="text-muted-foreground mt-1">Full control of labels, global UI, and admin users</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="labels" className="gap-2">
            <Languages className="w-4 h-4" /> Labels
          </TabsTrigger>
          <TabsTrigger value="ui" className="gap-2">
            <Palette className="w-4 h-4" /> Global UI
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2">
            <Users className="w-4 h-4" /> Admins
          </TabsTrigger>
        </TabsList>

        {/* ---------------- LABELS TAB ---------------- */}
        <TabsContent value="labels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" /> All Labels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search key or text…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={loadEntries} disabled={loadingEntries}>
                  <RefreshCcw className="w-4 h-4" /> Refresh
                </Button>
                <Button onClick={handleSaveLabels} disabled={Object.keys(dirty).length === 0}>
                  <Save className="w-4 h-4" />
                  Save changes ({Object.keys(dirty).length})
                </Button>
              </div>

              <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Plus className="w-4 h-4" /> Add new label
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    placeholder="Key (e.g. welcomeTitle)"
                    value={newEntry.key}
                    onChange={(e) => setNewEntry({ ...newEntry, key: e.target.value })}
                  />
                  <Input
                    placeholder="English"
                    value={newEntry.en}
                    onChange={(e) => setNewEntry({ ...newEntry, en: e.target.value })}
                  />
                  <Input
                    placeholder="العربية"
                    value={newEntry.ar}
                    onChange={(e) => setNewEntry({ ...newEntry, ar: e.target.value })}
                  />
                  <Button onClick={handleAddEntry}>
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border max-h-[520px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-[220px]">Key</TableHead>
                      <TableHead>English</TableHead>
                      <TableHead>العربية</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="align-top">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{entry.key}</code>
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            className="min-w-[220px]"
                            defaultValue={entry.en}
                            onBlur={(e) => handleEdit(entry.id, "en", e.target.value)}
                            key={`${entry.id}-en-${entry.en}`}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            className="min-w-[220px]"
                            defaultValue={entry.ar}
                            onBlur={(e) => handleEdit(entry.id, "ar", e.target.value)}
                            key={`${entry.id}-ar-${entry.ar}`}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteEntry(entry)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          {loadingEntries ? "Loading…" : "No labels found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- GLOBAL UI TAB ---------------- */}
        <TabsContent value="ui" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" /> Global UI Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSaveTheme}>
                  <Save className="w-4 h-4" /> Save theme
                </Button>
                <Button variant="outline" onClick={handleResetTheme}>
                  Reset to default
                </Button>
                <Button variant="ghost" onClick={loadTheme} disabled={themeLoading}>
                  <RefreshCcw className="w-4 h-4" /> Reload
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {THEME_FIELDS.map((field) => {
                  const value = theme[field.key] || "";
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-sm">{field.label}</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="h-9 w-10 rounded border cursor-pointer"
                          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#0284c7"}
                          onChange={(e) => handleThemeChange(field.key, e.target.value)}
                          disabled={field.key === "radius"}
                        />
                        <Input
                          placeholder={field.placeholder}
                          value={value}
                          onChange={(e) => handleThemeChange(field.key, e.target.value)}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="font-medium text-sm">Preview</div>
                <div className="flex items-center gap-3">
                  <div className="gradient-primary px-4 py-2 rounded-lg">Primary button</div>
                  <div className="gradient-badge px-4 py-2 rounded-full">Badge</div>
                  <div className="px-4 py-2 rounded-lg border bg-card">Card</div>
                </div>
                <div className="gradient-header relative rounded-lg px-4 py-3 overflow-hidden">
                  <span className="text-white font-medium">Header bar</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- ADMINS TAB ---------------- */}
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> User Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={loadAdmins} disabled={adminsLoading}>
                  <RefreshCcw className="w-4 h-4" /> Refresh
                </Button>
              </div>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[220px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((u) => (
                      <TableRow key={u.userId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium">{u.name || "—"}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{u.designation || "—"}</TableCell>
                        <TableCell>{roleBadge(u.role)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant={u.role === "admin" ? "default" : "outline"}
                              size="sm"
                              disabled={u.role === "super_admin" || roleBusy === u.userId}
                              onClick={() => handleRoleChange(u, "admin")}
                            >
                              {roleBusy === u.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                              Make Admin
                            </Button>
                            <Button
                              variant={u.role === "admin" ? "destructive" : "outline"}
                              size="sm"
                              disabled={u.role !== "admin" || roleBusy === u.userId}
                              onClick={() => handleRoleChange(u, "user")}
                            >
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {admins.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          {adminsLoading ? "Loading…" : "No users found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
