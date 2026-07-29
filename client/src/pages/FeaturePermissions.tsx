import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Shield,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Search,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/contexts/PermissionContext";
import { getStoredUser, getOrganizationId } from '@/lib/authStorage';

const USER_API = import.meta.env.VITE_USER_API || '/api/user';

type FeatureRow = {
  id: string;
  name: string;
  displayName: string;
  category: string;
  description?: string;
  isActive?: boolean;
};

type SystemRoleRow = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  scopeLevel?: string;
  hasCreatorAccess?: boolean;
  isActive?: boolean;
};

type DesignationRow = {
  id: string;
  name: string;
  systemRole: SystemRoleRow | null;
};

type MatrixKey = string; // `${roleId}:${featureId}`

function matrixKey(roleId: string, featureId: string): MatrixKey {
  return `${roleId}:${featureId}`;
}

export default function FeaturePermissions() {
  const { t } = useLanguage();
  const { refreshPermissions } = usePermissions();
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<"designations" | "roles">("designations");
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [systemRoles, setSystemRoles] = useState<SystemRoleRow[]>([]);
  const [designations, setDesignations] = useState<DesignationRow[]>([]);
  const [baseline, setBaseline] = useState<Record<MatrixKey, boolean>>({});
  const [matrix, setMatrix] = useState<Record<MatrixKey, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");

  const loadMatrix = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [featuresRes, rolesRes, designationsRes, permissionsRes] = await Promise.all([
        fetch(`${USER_API}/features`),
        fetch(`${USER_API}/system-roles`),
        fetch(`${USER_API}/designations?organizationId=${encodeURIComponent(getOrganizationId())}`),
        fetch(`${USER_API}/role-feature-permissions`),
      ]);

      if (!featuresRes.ok) throw new Error("Failed to load features");
      if (!rolesRes.ok) throw new Error("Failed to load system roles");
      if (!designationsRes.ok) throw new Error("Failed to load designations");
      if (!permissionsRes.ok) throw new Error("Failed to load role permissions");

      const featuresData: FeatureRow[] = await featuresRes.json();
      const rolesData: SystemRoleRow[] = await rolesRes.json();
      const designationsData: any[] = await designationsRes.json();
      const permissionsData: any[] = await permissionsRes.json();

      const activeFeatures = (Array.isArray(featuresData) ? featuresData : [])
        .filter((f) => f.isActive !== false)
        .sort((a, b) =>
          `${a.category}-${a.displayName}`.localeCompare(`${b.category}-${b.displayName}`),
        );

      const activeRoles = (Array.isArray(rolesData) ? rolesData : [])
        .filter((r) => r.isActive !== false)
        .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name));

      const designationsList = Array.isArray(designationsData) ? designationsData : [];
      let mappingsByDesignation = new Map<string, any>();
      try {
        const mappingsRes = await fetch(
          `${USER_API}/designation-role-mapping?organizationId=${encodeURIComponent(getOrganizationId())}`,
        );
        if (mappingsRes.ok) {
          const mappings = await mappingsRes.json();
          mappingsByDesignation = new Map(
            (Array.isArray(mappings) ? mappings : []).map((mapping: any) => [
              mapping.designationId,
              mapping,
            ]),
          );
        }
      } catch {
        // fall back to per-designation fetch below
      }

      const designationsWithRoles: DesignationRow[] = await Promise.all(
        designationsList.map(async (designation) => {
          let systemRole: SystemRoleRow | null = null;
          const mapping = mappingsByDesignation.get(designation.id);
          if (mapping?.systemRole) {
            systemRole = mapping.systemRole;
          } else if (mapping?.systemRoleId) {
            systemRole = activeRoles.find((role) => role.id === mapping.systemRoleId) || null;
          } else {
            try {
              const mappingRes = await fetch(
                `${USER_API}/designation-role-mapping/designation/${designation.id}`,
              );
              if (mappingRes.ok) {
                const single = await mappingRes.json();
                if (single?.systemRole) {
                  systemRole = single.systemRole;
                } else if (single?.systemRoleId) {
                  systemRole =
                    activeRoles.find((role) => role.id === single.systemRoleId) || null;
                }
              }
            } catch {
              // designation may not have a mapped role yet
            }
          }
          return {
            id: designation.id,
            name: designation.name,
            systemRole,
          };
        }),
      );

      const nextMatrix: Record<MatrixKey, boolean> = {};
      for (const role of activeRoles) {
        for (const feature of activeFeatures) {
          nextMatrix[matrixKey(role.id, feature.id)] = false;
        }
      }
      for (const permission of Array.isArray(permissionsData) ? permissionsData : []) {
        if (permission?.roleId && permission?.featureId) {
          nextMatrix[matrixKey(permission.roleId, permission.featureId)] = true;
        }
      }

      setFeatures(activeFeatures);
      setSystemRoles(activeRoles);
      setDesignations(designationsWithRoles);
      setBaseline(nextMatrix);
      setMatrix(nextMatrix);
    } catch (err: any) {
      console.error("Failed to load permission matrix:", err);
      setLoadError(err?.message || "Failed to load permission matrix");
      toast.error("Failed to load feature permissions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatrix();
  }, [loadMatrix]);

  const dirtyKeys = useMemo(() => {
    return Object.keys(matrix).filter((key) => Boolean(matrix[key]) !== Boolean(baseline[key]));
  }, [matrix, baseline]);

  const filteredFeatures = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return features;
    return features.filter(
      (feature) =>
        feature.displayName?.toLowerCase().includes(q) ||
        feature.name?.toLowerCase().includes(q) ||
        feature.category?.toLowerCase().includes(q),
    );
  }, [features, search]);

  const featureGroups = useMemo(() => {
    const groups = new Map<string, FeatureRow[]>();
    for (const feature of filteredFeatures) {
      const category = feature.category || "General";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category)!.push(feature);
    }
    return Array.from(groups.entries());
  }, [filteredFeatures]);

  const togglePermission = (roleId: string, featureId: string) => {
    if (!roleId) return;
    const key = matrixKey(roleId, featureId);
    setMatrix((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (dirtyKeys.length === 0) {
      toast.message("No permission changes to save");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    // Group dirty cells by system role, then sync each role's full enabled feature set
    const dirtyRoleIds = Array.from(
      new Set(dirtyKeys.map((key) => key.split(":")[0]).filter(Boolean)),
    );

    const errors: string[] = [];
    for (const roleId of dirtyRoleIds) {
      const grants = features
        .filter((feature) => Boolean(matrix[matrixKey(roleId, feature.id)]))
        .map((feature) => ({
          featureId: feature.id,
          permissionLevel: "read",
        }));

      try {
        const response = await fetch(`${USER_API}/role-feature-permissions/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roleId,
            grants,
            performedBy: getStoredUser().email || getStoredUser().name || "admin",
            source: "feature_permissions_matrix",
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || `Failed to sync permissions for role ${roleId}`);
        }
      } catch (err: any) {
        errors.push(err?.message || roleId);
      }
    }

    setIsSaving(false);

    if (errors.length > 0) {
      toast.error(`Saved with ${errors.length} error(s). Refresh and retry failed roles.`);
      await loadMatrix();
      return;
    }

    setBaseline({ ...matrix });
    setSaveSuccess(true);
    toast.success("Role-to-permission mapping saved");
    try {
      await refreshPermissions();
    } catch {
      // non-blocking
    }
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const rows =
    viewMode === "designations"
      ? designations.map((designation) => ({
          key: designation.id,
          label: designation.name,
          subtitle: designation.systemRole
            ? designation.systemRole.displayName || designation.systemRole.name
            : "No system role mapped",
          roleId: designation.systemRole?.id || "",
          disabled: !designation.systemRole?.id,
        }))
      : systemRoles.map((role) => ({
          key: role.id,
          label: role.displayName || role.name,
          subtitle: role.description || role.scopeLevel || role.name,
          roleId: role.id,
          disabled: false,
        }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading permission matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-muted/30 min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate("/creator-mode")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to Creator Mode</p>
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">
                {t("featurePermissions") || "Feature Permissions"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure feature access by designation (via mapped system role). Changes are
                written to Audit Logs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void loadMatrix()} disabled={isSaving}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={isSaving || dirtyKeys.length === 0}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes{dirtyKeys.length > 0 ? ` (${dirtyKeys.length})` : ""}
              </>
            )}
          </Button>
        </div>
      </div>

      {loadError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 flex items-start gap-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div>
              <p className="font-medium">{loadError}</p>
              <Button variant="link" className="px-0 h-auto" onClick={() => void loadMatrix()}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Permission Matrix</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Rows are designations (or system roles). Columns are features. Toggles update the
                mapped system role permissions.
              </p>
            </div>
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "designations" | "roles")}
            >
              <TabsList>
                <TabsTrigger value="designations">By Designation</TabsTrigger>
                <TabsTrigger value="roles">By System Role</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search features..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {viewMode === "designations" && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Designations inherit permissions from their mapped system role. Changing a toggle
              updates that role for every designation using it.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {rows.length === 0 || filteredFeatures.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {rows.length === 0
                ? viewMode === "designations"
                  ? "No designations found. Create designations under Manage Users."
                  : "No system roles found."
                : "No features match your search."}
            </div>
          ) : (
            <div className="overflow-auto max-h-[70vh] border rounded-lg">
              <table className="w-full min-w-[900px] border-collapse">
                <thead className="sticky top-0 z-20 bg-card">
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold bg-muted/50 min-w-[220px] sticky left-0 z-30">
                      {viewMode === "designations" ? "Designation" : "System Role"}
                    </th>
                    {featureGroups.map(([category, group]) =>
                      group.map((feature, index) => (
                        <th
                          key={feature.id}
                          className="text-center p-2 font-semibold bg-muted/50 min-w-[110px] align-bottom"
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center gap-1 cursor-help">
                                {index === 0 && (
                                  <Badge variant="outline" className="mb-1 text-[10px]">
                                    {category}
                                  </Badge>
                                )}
                                <span className="text-xs leading-tight">{feature.displayName}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="font-medium">{feature.displayName}</p>
                              <p className="text-xs opacity-90">{feature.name}</p>
                              {feature.description && (
                                <p className="text-xs mt-1">{feature.description}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <motion.tr
                      key={row.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(rowIndex * 0.03, 0.3) }}
                      className="border-b hover:bg-muted/30"
                    >
                      <td className="p-3 sticky left-0 bg-card z-10 min-w-[220px]">
                        <div className="font-semibold text-sm">{row.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{row.subtitle}</div>
                        {row.disabled && (
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            Unmapped
                          </Badge>
                        )}
                      </td>
                      {filteredFeatures.map((feature) => {
                        const enabled = row.roleId
                          ? Boolean(matrix[matrixKey(row.roleId, feature.id)])
                          : false;
                        const dirty =
                          row.roleId &&
                          Boolean(matrix[matrixKey(row.roleId, feature.id)]) !==
                            Boolean(baseline[matrixKey(row.roleId, feature.id)]);

                        return (
                          <td key={`${row.key}-${feature.id}`} className="text-center p-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex justify-center rounded-md py-1 ${
                                    dirty ? "bg-sky-50 ring-1 ring-sky-200" : ""
                                  }`}
                                >
                                  <Switch
                                    checked={enabled}
                                    disabled={row.disabled || isSaving}
                                    onCheckedChange={() =>
                                      togglePermission(row.roleId, feature.id)
                                    }
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {row.disabled
                                    ? "Map a system role to this designation first"
                                    : enabled
                                      ? `${row.label} can access ${feature.displayName}`
                                      : `${row.label} cannot access ${feature.displayName}`}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Designations</p>
            <p className="text-2xl font-semibold">{designations.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">System Roles</p>
            <p className="text-2xl font-semibold">{systemRoles.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground">Features</p>
            <p className="text-2xl font-semibold">{features.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
