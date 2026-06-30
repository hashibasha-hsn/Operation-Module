import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableActionsMenu } from "@/components/ui/table-actions-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  MoreVertical,
  Filter,
  Search,
  Mail,
  Users as UsersIcon,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  Settings,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import * as XLSX from 'xlsx';
import {
  sortDesignationsBySystemRole,
  sortSystemRolesByHierarchy,
} from "@/lib/designationOrder";
import {
  assignUserToProcesses,
  fetchPublishedProcesses,
} from "@/lib/processSubmission";
import UserHierarchyTree from "@/components/users/UserHierarchyTree";
import UserHierarchyDetails from "@/components/users/UserHierarchyDetails";
import HybridAssigneePanel from "@/components/users/HybridAssigneePanel";
import {
  countHierarchySubordinates,
  getUserDefaultStoreName as resolveHierarchyDefaultStoreName,
  getStoresUnderCoverage,
  resolveHierarchyUser,
} from "@/lib/userHierarchy";
import type { HierarchyUser } from "@/components/users/UserHierarchyTree";

const COUNTRY_PHONE_OPTIONS = [
  { code: "+966", label: "+966 (Saudi Arabia)", maxLength: 9, pattern: /^5\d{8}$/ },
  { code: "+965", label: "+965 (Kuwait)", maxLength: 8, pattern: /^[569]\d{7}$/ },
] as const;

function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, "");
}

function validatePhoneNumber(phone: string, countryCode: string): string | null {
  if (!phone) return null;

  const option = COUNTRY_PHONE_OPTIONS.find((item) => item.code === countryCode);
  if (!option) return "Please select a valid country code";

  if (!option.pattern.test(phone)) {
    if (countryCode === "+966") {
      return "Saudi number must be 9 digits and start with 5";
    }
    return "Kuwait number must be 8 digits and start with 5, 6, or 9";
  }

  return null;
}

const DEFAULT_USER_TABLE_COLUMNS = [
  'name', 'email', 'employeeId', 'designation', 'manager', 'storeName', 'createdAt', 'lastLogin', 'validEmail', 'status', 'action',
];

const USER_TABLE_STANDARD_COLUMNS = [
  { key: 'name', labelKey: 'name' },
  { key: 'email', labelKey: 'email' },
  { key: 'employeeId', labelKey: 'employeeId' },
  { key: 'designation', labelKey: 'designation' },
  { key: 'manager', labelKey: 'manager' },
  { key: 'storeName', labelKey: 'storeName' },
  { key: 'createdAt', labelKey: 'createdAt' },
  { key: 'lastLogin', labelKey: 'lastLogin' },
  { key: 'validEmail', labelKey: 'validEmail' },
  { key: 'status', labelKey: 'status' },
  { key: 'action', labelKey: 'action' },
] as const;

function userTagColumnKey(tagId: string) {
  return `tag:${tagId}`;
}

function isUserTagColumnKey(key: string) {
  return key.startsWith('tag:');
}

function getUserTagCellValue(user: any, tag: { name: string }) {
  if (!user?.tags || typeof user.tags !== 'object') return '-';
  const value = user.tags[tag.name];
  return value != null && value !== '' ? String(value) : '-';
}

function formatDateTime(value: unknown, fallback = 'N/A') {
  if (!value) return fallback;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
}

export default function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedHierarchyUser, setSelectedHierarchyUser] = useState<any | null>(null);
  const [entities, setEntities] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0, validEmails: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [validEmailFilter, setValidEmailFilter] = useState<"all" | "valid" | "invalid">("all");
  const [sortBy, setSortBy] = useState<"nameAsc" | "nameDesc" | "emailAsc" | "emailDesc">("nameAsc");
  const [appliedEmailFilter, setAppliedEmailFilter] = useState("");
  const [appliedValidEmailFilter, setAppliedValidEmailFilter] = useState<"all" | "valid" | "invalid">("all");
  const [appliedSortBy, setAppliedSortBy] = useState<"nameAsc" | "nameDesc" | "emailAsc" | "emailDesc" | null>(null);
  const [activeTab, setActiveTab] = useState("Users");
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [createError, setCreateError] = useState("");
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isDesignationDialogOpen, setIsDesignationDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    entity: "",
    entityId: "",
    name: "",
    employeeId: "",
    email: "",
    validEmail: false,
    password: "",
    phoneNumber: "",
    countryCode: "+966",
    manager: "",
    designation: "",
    tags: "",
  });
  const [selectedTags, setSelectedTags] = useState<any>({});
  const [designationData, setDesignationData] = useState({
    designation: "",
    reportingDesignation: "",
    systemRole: "",
    hasCreatorAccess: false,
  });
  const [designations, setDesignations] = useState<any[]>([]);
  const [systemRoles, setSystemRoles] = useState<any[]>([]);
  const [isProcessAssignmentOpen, setIsProcessAssignmentOpen] = useState(false);
  const [publishedProcesses, setPublishedProcesses] = useState<any[]>([]);
  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([]);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isEditDesignationDialogOpen, setIsEditDesignationDialogOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<any>(null);
  const [userTags, setUserTags] = useState<any[]>([]);
  const [isUserTagDialogOpen, setIsUserTagDialogOpen] = useState(false);
  const [userTagData, setUserTagData] = useState({
    name: "",
    tagValues: [] as string[],
    mandatory: false,
  });
  const [editingUserTag, setEditingUserTag] = useState<any>(null);
  const [createTagWithValue, setCreateTagWithValue] = useState(false);
  const [tagValueInput, setTagValueInput] = useState("");
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [isUserTeamDialogOpen, setIsUserTeamDialogOpen] = useState(false);
  const [userTeamData, setUserTeamData] = useState({
    name: "",
    memberIds: [] as string[],
  });
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    entity: "",
    entityId: "",
    name: "",
    employeeId: "",
    email: "",
    validEmail: false,
    phoneNumber: "",
    countryCode: "+1",
    manager: "",
    designation: "",
    tags: "",
  });
  const [editSelectedTags, setEditSelectedTags] = useState<any>({});
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([...DEFAULT_USER_TABLE_COLUMNS]);
  const [tempVisibleColumns, setTempVisibleColumns] = useState<string[]>([...DEFAULT_USER_TABLE_COLUMNS]);
  const [selectedUserForMapping, setSelectedUserForMapping] = useState<any>(null);
  const [isAdvanceMappingDialogOpen, setIsAdvanceMappingDialogOpen] = useState(false);
  const [advanceMappingMode, setAdvanceMappingMode] = useState<'add' | 'edit'>('add');
  const [advanceMappingUserId, setAdvanceMappingUserId] = useState('');
  const [additionalStores, setAdditionalStores] = useState<string[]>([]);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [selectedDesignationForPermissions, setSelectedDesignationForPermissions] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [designationPermissions, setDesignationPermissions] = useState<any[]>([]);
  const [removedUsers, setRemovedUsers] = useState<any[]>([]);

  const tabs = [
    { key: "Users", label: t('users') },
    { key: "Designation", label: t('designation') },
    { key: "Team", label: t('team') },
    { key: "User Hierarchy", label: t('userHierarchy') },
    { key: "Advance Mapping", label: t('advanceMapping') },
    { key: "Removed User", label: t('removedUser') },
    { key: "User Tags", label: t('userTags') },
    { key: "Hybrid Assignee", label: t('hybridAssignee') },
  ];

  const fetchEntities = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/org/entities?organizationId=default-org');
      const data = await response.json();
      setEntities(data || []);
    } catch (err) {
      console.error('Failed to fetch entities:', err);
    }
  };

  const fetchUserTags = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/user/user-tags?organizationId=default-org');
      const data = await response.json();
      // Transform database response to match frontend structure
      const transformedTags = Array.isArray(data) ? data.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        tagValues: Array.isArray(tag.values) ? tag.values : (typeof tag.values === 'string' ? JSON.parse(tag.values) : []),
        mandatory: tag.isMandatory ? 'YES' : 'NO'
      })) : [];
      setUserTags(transformedTags);
    } catch (err) {
      console.error('Failed to fetch user tags:', err);
      setUserTags([]);
    }
  };

  const fetchUserTeams = async () => {
    try {
      const response = await fetch('http://localhost:3002/user-teams?organizationId=default-org');
      const data = await response.json();
      setUserTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch user teams:', err);
      setUserTeams([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchEntities();
    fetchDesignations();
    fetchUserTags();
    fetchUserTeams();
  }, []);

  useEffect(() => {
    const validTagKeys = new Set(userTags.map((tag) => userTagColumnKey(tag.id)));
    const prune = (columns: string[]) =>
      columns.filter((column) => !isUserTagColumnKey(column) || validTagKeys.has(column));
    setVisibleColumns((prev) => prune(prev));
    setTempVisibleColumns((prev) => prune(prev));
  }, [userTags]);

  const visibleUserTagColumns = useMemo(
    () => userTags.filter((tag) => visibleColumns.includes(userTagColumnKey(tag.id))),
    [userTags, visibleColumns],
  );

  const userTableColumnCount = Math.max(visibleColumns.length, 1);

  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedProcessIds([]);
      setIsProcessAssignmentOpen(false);
      return;
    }
    fetchPublishedProcesses()
      .then(setPublishedProcesses)
      .catch(() => setPublishedProcesses([]));
  }, [isDialogOpen]);

  useEffect(() => {
    if (activeTab === "Designation") {
      fetchDesignations();
      fetchSystemRoles();
    }
    if (activeTab === "Removed User") {
      fetchRemovedUsers();
    }
    if (activeTab === "Team") {
      fetchUserTeams();
    }
  }, [activeTab]);

  const fetchDesignations = async () => {
    try {
      const response = await fetch('http://localhost:3002/designations?organizationId=default-org');
      const data = await response.json();

      const designationsWithDetails = await Promise.all(
        data.map(async (designation: any) => {
          let systemRole = null;
          let reportingDesignationName = null;

          try {
            const mappingResponse = await fetch(`http://localhost:3002/designation-role-mapping/designation/${designation.id}`);
            const mapping = await mappingResponse.json();
            if (mapping && mapping.systemRole) {
              systemRole = mapping.systemRole;
            }
          } catch (err) {
            console.error('Error fetching system role mapping:', err);
          }

          if (designation.reportingDesignationId) {
            try {
              const reportingResponse = await fetch(`http://localhost:3002/designations/${designation.reportingDesignationId}`);
              const reportingDesignation = await reportingResponse.json();
              if (reportingDesignation) {
                reportingDesignationName = reportingDesignation.name;
              }
            } catch (err) {
              console.error('Error fetching reporting designation:', err);
            }
          }

          return {
            ...designation,
            systemRole,
            reportingDesignationName
          };
        })
      );

      setDesignations(sortDesignationsBySystemRole(designationsWithDetails || []));
    } catch (err) {
      console.error('Failed to fetch designations:', err);
    }
  };

  const fetchSystemRoles = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/user/system-roles');
      const data = await response.json();
      setSystemRoles(sortSystemRolesByHierarchy(data || []));
    } catch (err) {
      console.error('Failed to fetch system roles:', err);
    }
  };

  const handleCreateDesignation = async () => {
    try {
      let reportingDesignationId = null;
      if (designationData.reportingDesignation) {
        try {
          const designationsResponse = await fetch('http://localhost:3002/designations?organizationId=default-org');
          const designations = await designationsResponse.json();
          const reportingDesignation = designations.find((d: any) => d.name === designationData.reportingDesignation);
          if (reportingDesignation) {
            reportingDesignationId = reportingDesignation.id;
          }
        } catch (err) {
          console.error('Error finding reporting designation:', err);
        }
      }

      const response = await fetch('http://localhost:3002/designations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designationData.designation,
          description: designationData.designation,
          organizationId: 'default-org',
          reportingDesignationId: reportingDesignationId,
          hasCreatorAccess: designationData.hasCreatorAccess,
        }),
      });

      if (response.ok) {
        const createdDesignation = await response.json();

        if (designationData.systemRole) {
          await fetch('http://localhost:3002/designation-role-mapping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              designationId: createdDesignation.id,
              systemRoleId: designationData.systemRole,
              organizationId: 'default-org',
            }),
          });
        }

        setDesignationData({ designation: "", reportingDesignation: "", systemRole: "", hasCreatorAccess: false });
        setIsDesignationDialogOpen(false);
        fetchDesignations();
      } else {
        console.error('Failed to create designation');
      }
    } catch (err) {
      console.error('Error creating designation:', err);
    }
  };

  const handleEditDesignation = (designation: any) => {
    setEditingDesignation(designation);
    setDesignationData({
      designation: designation.name,
      reportingDesignation: designation.reportingDesignationName || '',
      systemRole: designation.systemRole?.id || '',
      hasCreatorAccess: designation.hasCreatorAccess || false,
    });
    setIsEditDesignationDialogOpen(true);
  };

  const handleUpdateDesignation = async () => {
    if (!editingDesignation) return;

    try {
      let reportingDesignationId = null;
      if (designationData.reportingDesignation) {
        try {
          const designationsResponse = await fetch('http://localhost:3002/designations?organizationId=default-org');
          const designations = await designationsResponse.json();
          const reportingDesignation = designations.find((d: any) => d.name === designationData.reportingDesignation);
          if (reportingDesignation) {
            reportingDesignationId = reportingDesignation.id;
          }
        } catch (err) {
          console.error('Error finding reporting designation:', err);
        }
      }

      const response = await fetch(`http://localhost:3002/designations/${editingDesignation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designationData.designation,
          description: designationData.designation,
          reportingDesignationId: reportingDesignationId,
          hasCreatorAccess: designationData.hasCreatorAccess,
        }),
      });

      if (response.ok) {
        if (designationData.systemRole) {
          await fetch(`http://localhost:3002/designation-role-mapping/designation/${editingDesignation.id}`, {
            method: 'DELETE',
          });

          await fetch('http://localhost:3002/designation-role-mapping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              designationId: editingDesignation.id,
              systemRoleId: designationData.systemRole,
              organizationId: 'default-org',
            }),
          });
        }

        setDesignationData({ designation: "", reportingDesignation: "", systemRole: "", hasCreatorAccess: false });
        setEditingDesignation(null);
        setIsEditDesignationDialogOpen(false);
        fetchDesignations();
      } else {
        console.error('Failed to update designation');
      }
    } catch (err) {
      console.error('Error updating designation:', err);
    }
  };

  const handleDeleteDesignation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this designation?')) return;

    try {
      console.log('Attempting to delete designation with ID:', id);
      const response = await fetch(`http://localhost:3002/designations/${id}`, { method: 'DELETE' });
      console.log('Delete response status:', response.status);
      
      if (response.ok) {
        console.log('Designation deleted successfully');
        fetchDesignations();
      } else {
        console.error('Failed to delete designation');
        console.error('Response text:', await response.text());
      }
    } catch (err) {
      console.error('Error deleting designation:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3002/users?limit=1000');
      const data = await response.json();
      // Parse tags if they come as JSON strings from the database
      const usersWithParsedTags = (data.users || []).map((user: any) => ({
        ...user,
        tags: typeof user.tags === 'string' ? JSON.parse(user.tags) : (user.tags || {}),
        additionalStores: normalizeStoreIds(user.additionalStores),
      }));
      setUsers(usersWithParsedTags);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3002/users/stats/overview');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchRemovedUsers = async () => {
    try {
      const response = await fetch('http://localhost:3002/users/removed');
      if (!response.ok) {
        console.error('Failed to fetch removed users:', response.statusText);
        setRemovedUsers([]);
        return;
      }
      const text = await response.text();
      if (!text) {
        setRemovedUsers([]);
        return;
      }
      const data = JSON.parse(text);
      setRemovedUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch removed users:', err);
      setRemovedUsers([]);
    }
  };

  const handleToggleValidEmail = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/users/${userId}/toggle-valid-email`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchUsers();
        fetchStats();
      } else {
        console.error('Failed to toggle valid email');
      }
    } catch (err) {
      console.error('Error toggling valid email:', err);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/users/${userId}/toggle-status`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchUsers();
        fetchStats();
      } else {
        console.error('Failed to toggle user status');
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.name.trim()) {
      setCreateError("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      setCreateError("Email is required");
      return;
    }
    if (!formData.password.trim()) {
      setCreateError("Password is required");
      return;
    }
    if (!formData.entityId) {
      setCreateError("Please select an entity");
      return;
    }

    const phoneValidationError = validatePhoneNumber(formData.phoneNumber, formData.countryCode);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      setCreateError("");
      return;
    }

    try {
      setPhoneError("");
      setCreateError("");
      const response = await fetch('http://localhost:3002/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: crypto.randomUUID(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          employeeId: formData.employeeId,
          phone: formData.phoneNumber || null,
          countryCode: formData.countryCode,
          entityId: formData.entityId,
          storeName: formData.entity,
          designation: formData.designation,
          manager: formData.manager,
          validEmail: formData.validEmail,
          tags: selectedTags,
          isActive: true,
        }),
      });

      if (response.ok) {
        const userData = await response.json();

        try {
          await fetch('http://localhost:3009/api/auth/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: userData.userId,
              email: formData.email.trim(),
              password: formData.password,
              verificationStatus: 'VERIFIED',
            }),
          });
        } catch (error) {
          console.error('Failed to create user in auth-service:', error);
        }

        if (selectedProcessIds.length > 0) {
          try {
            await assignUserToProcesses(userData.userId, selectedProcessIds);
          } catch (error) {
            console.error('Failed to assign processes to user:', error);
          }
        }

        setFormData({
          entity: "", entityId: "", name: "", employeeId: "", email: "",
          validEmail: false, password: "", phoneNumber: "", countryCode: "+966",
          manager: "", designation: "", tags: "",
        });
        setPhoneError("");
        setCreateError("");
        setSelectedTags({});
        setSelectedProcessIds([]);
        setIsProcessAssignmentOpen(false);
        setIsDialogOpen(false);
        fetchUsers();
        fetchStats();
      } else {
        const errorBody = await response.json().catch(() => null);
        setCreateError(errorBody?.message || 'Failed to create user. Please check all required fields.');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setCreateError('Could not connect to the server. Make sure user-service is running.');
    }
  };

  const handlePhoneNumberChange = (value: string, countryCode: string) => {
    const option = COUNTRY_PHONE_OPTIONS.find((item) => item.code === countryCode);
    const sanitized = sanitizePhoneInput(value).slice(0, option?.maxLength ?? 15);
    setPhoneError("");
    setFormData((prev) => ({ ...prev, phoneNumber: sanitized }));
  };

  const handleCountryCodeChange = (countryCode: string) => {
    const option = COUNTRY_PHONE_OPTIONS.find((item) => item.code === countryCode);
    const sanitized = sanitizePhoneInput(formData.phoneNumber).slice(0, option?.maxLength ?? 15);
    setPhoneError("");
    setFormData((prev) => ({ ...prev, countryCode, phoneNumber: sanitized }));
  };

  const handleCreateUserTag = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/user/user-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userTagData.name,
          values: JSON.stringify(userTagData.tagValues),
          isMandatory: userTagData.mandatory,
          organizationId: 'default-org',
        }),
      });

      if (response.ok) {
        setUserTagData({ name: "", tagValues: [], mandatory: false });
        setCreateTagWithValue(false);
        setTagValueInput("");
        setIsUserTagDialogOpen(false);
        fetchUserTags();
      } else {
        console.error('Failed to create user tag');
      }
    } catch (err) {
      console.error('Error creating user tag:', err);
    }
  };

  const handleEditUserTag = (tag: any) => {
    const values = Array.isArray(tag.tagValues) ? tag.tagValues : [];
    setUserTagData({
      name: tag.tag,
      tagValues: values,
      mandatory: tag.mandatory === 'YES',
    });
    setCreateTagWithValue(values.length > 0);
    setEditingUserTag(tag);
    setIsUserTagDialogOpen(true);
  };

  const handleUpdateUserTag = async () => {
    if (!editingUserTag) return;

    try {
      const response = await fetch(`http://localhost:3009/api/user/user-tags/${editingUserTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userTagData.name,
          values: JSON.stringify(userTagData.tagValues),
          isMandatory: userTagData.mandatory,
        }),
      });

      if (response.ok) {
        setUserTagData({ name: "", tagValues: [], mandatory: false });
        setCreateTagWithValue(false);
        setTagValueInput("");
        setIsUserTagDialogOpen(false);
        setEditingUserTag(null);
        fetchUserTags();
      } else {
        console.error('Failed to update user tag');
      }
    } catch (err) {
      console.error('Error updating user tag:', err);
    }
  };

  const handleDeleteUserTag = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3009/api/user/user-tags/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUserTags();
      } else {
        console.error('Failed to delete user tag');
      }
    } catch (err) {
      console.error('Error deleting user tag:', err);
    }
  };

  const handleCreateUserTeam = async () => {
    if (!userTeamData.name.trim()) {
      alert('Team name is required');
      return;
    }

    try {
      const response = await fetch('http://localhost:3002/user-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userTeamData.name.trim(),
          organizationId: 'default-org',
          memberIds: userTeamData.memberIds,
        }),
      });

      if (response.ok) {
        setUserTeamData({ name: "", memberIds: [] });
        setEditingTeam(null);
        setIsUserTeamDialogOpen(false);
        fetchUserTeams();
      } else {
        console.error('Failed to create user team');
        alert('Failed to create team');
      }
    } catch (err) {
      console.error('Error creating user team:', err);
      alert('Error creating team');
    }
  };

  const handleEditTeam = async (team: any) => {
    try {
      const response = await fetch(`http://localhost:3002/user-teams/${team.id}`);
      const data = await response.json();
      setEditingTeam(data);
      setUserTeamData({
        name: data.name,
        memberIds: data.memberIds || data.members?.map((member: any) => member.userId) || [],
      });
      setIsUserTeamDialogOpen(true);
    } catch (err) {
      console.error('Failed to load team details:', err);
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam) return;

    try {
      const response = await fetch(`http://localhost:3002/user-teams/${editingTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userTeamData.name,
          memberIds: userTeamData.memberIds,
        }),
      });

      if (response.ok) {
        setUserTeamData({ name: "", memberIds: [] });
        setEditingTeam(null);
        setIsUserTeamDialogOpen(false);
        fetchUserTeams();
      } else {
        console.error('Failed to update team');
      }
    } catch (err) {
      console.error('Error updating team:', err);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const response = await fetch(`http://localhost:3002/user-teams/${teamId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUserTeams();
      } else {
        console.error('Failed to delete team');
      }
    } catch (err) {
      console.error('Error deleting team:', err);
    }
  };

  const getDirectReports = (userName: string) =>
    users.filter((u: any) => u.manager === userName);

  const selectedHierarchyUserId = selectedHierarchyUser
    ? String(selectedHierarchyUser.userId || selectedHierarchyUser.id || selectedHierarchyUser.name)
    : null;

  const hierarchyStoresUnderCoverage = useMemo(() => {
    if (!selectedHierarchyUser) return [];
    return getStoresUnderCoverage(selectedHierarchyUser, entities);
  }, [selectedHierarchyUser, entities]);

  const hierarchyDirectReportCount = useMemo(() => {
    if (!selectedHierarchyUser?.name) return 0;
    return countHierarchySubordinates(selectedHierarchyUser.name, getDirectReports);
  }, [selectedHierarchyUser, users]);

  const hierarchyDefaultStoreLabel = useMemo(() => {
    if (!selectedHierarchyUser) return t("notAvailable");
    return resolveHierarchyDefaultStoreName(selectedHierarchyUser, entities, t("notAvailable"));
  }, [selectedHierarchyUser, entities, t]);

  const handleSelectHierarchyUser = (node: HierarchyUser) => {
    setSelectedHierarchyUser(resolveHierarchyUser(node, users));
  };

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user: any) =>
      (user.name || "").toLowerCase().includes(query),
    );
  }, [users, searchTerm]);

  const displayUsers = useMemo(() => {
    let result = [...filteredUsers];

    const emailQuery = appliedEmailFilter.trim().toLowerCase();
    if (emailQuery) {
      result = result.filter((user: any) =>
        (user.email || "").toLowerCase().includes(emailQuery),
      );
    }

    if (appliedValidEmailFilter === "valid") {
      result = result.filter((user: any) => user.validEmail);
    } else if (appliedValidEmailFilter === "invalid") {
      result = result.filter((user: any) => !user.validEmail);
    }

    if (appliedSortBy) {
      result.sort((a: any, b: any) => {
        switch (appliedSortBy) {
          case "nameDesc":
            return (b.name || "").localeCompare(a.name || "", undefined, { sensitivity: "base" });
          case "emailAsc":
            return (a.email || "").localeCompare(b.email || "", undefined, { sensitivity: "base" });
          case "emailDesc":
            return (b.email || "").localeCompare(a.email || "", undefined, { sensitivity: "base" });
          case "nameAsc":
          default:
            return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
        }
      });
    }

    return result;
  }, [filteredUsers, appliedEmailFilter, appliedValidEmailFilter, appliedSortBy]);

  const validEmailFilterLabel =
    validEmailFilter === "valid" ? t("valid") : validEmailFilter === "invalid" ? t("invalid") : t("all");

  const sortByLabel =
    sortBy === "nameDesc"
      ? t("nameDesc")
      : sortBy === "emailAsc"
        ? t("emailAsc")
        : sortBy === "emailDesc"
          ? t("emailDesc")
          : t("nameAsc");

  const handleApplyFilters = () => {
    setAppliedEmailFilter(emailFilter);
    setAppliedValidEmailFilter(validEmailFilter);
    setAppliedSortBy(sortBy);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setEmailFilter("");
    setValidEmailFilter("all");
    setSortBy("nameAsc");
    setAppliedEmailFilter("");
    setAppliedValidEmailFilter("all");
    setAppliedSortBy(null);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      entity: user.storeName || "",
      entityId: user.storeId || "",
      name: user.name || "",
      employeeId: user.employeeId || "",
      email: user.email || "",
      validEmail: user.validEmail || false,
      phoneNumber: user.phone || "",
      countryCode: user.countryCode || "+1",
      manager: user.manager || "",
      designation: user.designation || "",
      tags: user.tags || "",
    });
    setEditSelectedTags(user.tags || {});
    setIsEditUserDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user? They will be moved to the Removed User list.')) {
      return;
    }

    try {
      const userResponse = await fetch(`http://localhost:3002/users/${userId}`, {
        method: 'DELETE',
      });

      if (userResponse.ok) {
        fetchUsers();
        fetchStats();
        if (activeTab === "Removed User") {
          fetchRemovedUsers();
        }
      } else {
        const errorText = await userResponse.text();
        console.error('Failed to remove user:', errorText);
        alert('Failed to remove user');
      }
    } catch (err) {
      console.error('Error removing user:', err);
      alert('Error removing user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editFormData.manager) {
      alert('Manager is required when editing a user');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3002/users/${editingUser.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          employeeId: editFormData.employeeId,
          phone: editFormData.phoneNumber,
          countryCode: editFormData.countryCode,
          entityId: editFormData.entityId,
          designation: editFormData.designation,
          manager: editFormData.manager,
          validEmail: editFormData.validEmail,
          tags: editSelectedTags,
        }),
      });

      if (response.ok) {
        setIsEditUserDialogOpen(false);
        setEditingUser(null);
        setEditSelectedTags({});
        fetchUsers();
      } else {
        console.error('Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const handleToggleColumn = (column: string) => {
    if (tempVisibleColumns.includes(column)) {
      if (tempVisibleColumns.length > 1) {
        setTempVisibleColumns(tempVisibleColumns.filter((col) => col !== column));
      }
    } else {
      setTempVisibleColumns([...tempVisibleColumns, column]);
    }
  };

  const handleSaveColumnSettings = () => {
    setVisibleColumns([...tempVisibleColumns]);
    setIsColumnSettingsOpen(false);
  };

  const handleOpenColumnSettings = () => {
    setTempVisibleColumns([...visibleColumns]);
    setIsColumnSettingsOpen(true);
  };

  const normalizeStoreIds = (stores: unknown): string[] => {
    if (!stores) return [];
    let parsed = stores;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((store) => (typeof store === 'string' ? store : store?.id))
      .filter(Boolean);
  };

  const getStoreNameById = (storeId?: string) => {
    if (!storeId) return '';
    const entity = entities.find(
      (e: any) => e.id === storeId || e.entityId === storeId,
    );
    return entity?.storeName || '';
  };

  const isValidStoreId = (storeId: string) =>
    entities.some((e: any) => e.id === storeId || e.entityId === storeId);

  const getUserDefaultStoreId = (user: any) => user.storeId || user.entityId;

  const getUserDefaultStoreName = (user: any) =>
    user.storeName || getStoreNameById(getUserDefaultStoreId(user)) || 'N/A';

  const getAdditionalStoreDetails = (user: any) =>
    normalizeStoreIds(user.additionalStores)
      .filter((storeId) => isValidStoreId(storeId))
      .map((storeId) => {
        const entity = entities.find(
          (e: any) => e.id === storeId || e.entityId === storeId,
        );
        return {
          id: storeId,
          name: entity?.storeName || 'Unknown store',
          area: entity?.area || '',
        };
      });

  const advanceMappedUsers = useMemo(
    () => users.filter((user) => getAdditionalStoreDetails(user).length > 0),
    [users, entities],
  );

  const handleOpenAddAdvanceMapping = () => {
    setAdvanceMappingMode('add');
    setAdvanceMappingUserId('');
    setSelectedUserForMapping(null);
    setAdditionalStores([]);
    setIsAdvanceMappingDialogOpen(true);
  };

  const handleAdvanceMappingUserChange = (userId: string) => {
    setAdvanceMappingUserId(userId);
    const user = users.find((u: any) => u.userId === userId) || null;
    setSelectedUserForMapping(user);
    setAdditionalStores([]);
  };

  const handleOpenAdvanceMapping = (user: any) => {
    setAdvanceMappingMode('edit');
    setAdvanceMappingUserId(user.userId);
    setSelectedUserForMapping(user);
    setAdditionalStores(
      normalizeStoreIds(user.additionalStores).filter((storeId) => isValidStoreId(storeId)),
    );
    setIsAdvanceMappingDialogOpen(true);
  };

  const handleDeleteAdvanceMapping = async (user: any) => {
    if (!confirm(`Remove all advance mapping for ${user.name}?`)) return;

    try {
      const response = await fetch(`http://localhost:3002/users/${user.userId}/advance-mapping`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          additionalStores: [],
        }),
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json().catch(() => null);
        console.error('Failed to delete advance mapping', error);
      }
    } catch (err) {
      console.error('Error deleting advance mapping:', err);
    }
  };

  const handleSaveAdvanceMapping = async () => {
    const user =
      advanceMappingMode === 'add'
        ? users.find((u: any) => u.userId === advanceMappingUserId)
        : selectedUserForMapping;

    if (!user) return;

    const defaultStoreId = getUserDefaultStoreId(user);
    const selectedStores = additionalStores
      .filter((storeId) => storeId !== defaultStoreId && isValidStoreId(storeId));

    const sanitizedStores =
      advanceMappingMode === 'add'
        ? [
            ...new Set([
              ...normalizeStoreIds(user.additionalStores).filter(
                (storeId) => storeId !== defaultStoreId && isValidStoreId(storeId),
              ),
              ...selectedStores,
            ]),
          ]
        : selectedStores;

    if (sanitizedStores.length === 0) return;

    try {
      const response = await fetch(`http://localhost:3002/users/${user.userId}/advance-mapping`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          additionalStores: sanitizedStores,
        }),
      });

      if (response.ok) {
        setIsAdvanceMappingDialogOpen(false);
        setSelectedUserForMapping(null);
        setAdvanceMappingUserId('');
        setAdditionalStores([]);
        setAdvanceMappingMode('add');
        fetchUsers();
      } else {
        const error = await response.json().catch(() => null);
        console.error('Failed to save advance mapping', error);
      }
    } catch (err) {
      console.error('Error saving advance mapping:', err);
    }
  };

  const selectedUserDefaultStoreId = selectedUserForMapping
    ? getUserDefaultStoreId(selectedUserForMapping)
    : '';
  const advanceMappingStoreOptions = entities;
  const canSaveAdvanceMapping =
    Boolean(advanceMappingMode === 'add' ? advanceMappingUserId : selectedUserForMapping) &&
    additionalStores.some(
      (storeId) => storeId !== selectedUserDefaultStoreId && isValidStoreId(storeId),
    );

  const fetchFeatures = async () => {
    try {
      const response = await fetch('http://localhost:3002/features');
      const data = await response.json();
      setFeatures(data || []);
    } catch (err) {
      console.error('Failed to fetch features:', err);
    }
  };

  const fetchDesignationPermissions = async (designationId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/role-feature-permissions/role/${designationId}`);
      const data = await response.json();
      setDesignationPermissions(data || []);
    } catch (err) {
      console.error('Failed to fetch designation permissions:', err);
    }
  };

  const handleOpenPermissionDialog = async (designation: any) => {
    setSelectedDesignationForPermissions(designation);
    await fetchFeatures();
    await fetchDesignationPermissions(designation.id);
    setIsPermissionDialogOpen(true);
  };

  const handleTogglePermission = async (featureId: string, permissionLevel: string) => {
    if (!selectedDesignationForPermissions) return;

    try {
      console.log('Toggling permission for feature:', featureId, 'designation:', selectedDesignationForPermissions.id);
      
      const existingPermission = designationPermissions.find(
        (p: any) => p.featureId === featureId
      );

      if (existingPermission) {
        // Remove permission
        console.log('Removing existing permission');
        const response = await fetch(`http://localhost:3002/role-feature-permissions/${selectedDesignationForPermissions.id}/${featureId}`, {
          method: 'DELETE',
        });
        console.log('Delete response:', response.status);
      } else {
        // Add permission
        console.log('Adding new permission');
        const response = await fetch('http://localhost:3002/role-feature-permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roleId: selectedDesignationForPermissions.id,
            featureId,
            permissionLevel,
          }),
        });
        console.log('Add response:', response.status);
      }

      await fetchDesignationPermissions(selectedDesignationForPermissions.id);
    } catch (err) {
      console.error('Error toggling permission:', err);
    }
  };

  const handleExport = () => {
    const exportData = users.map((user: any) => {
      const row: Record<string, string> = {};

      if (visibleColumns.includes('name')) row[t('name')] = user.name || t('notAvailable');
      if (visibleColumns.includes('email')) row[t('email')] = user.email || t('notAvailable');
      if (visibleColumns.includes('employeeId')) row[t('employeeId')] = user.employeeId || t('notAvailable');
      if (visibleColumns.includes('designation')) row[t('designation')] = user.designation || t('notAvailable');
      if (visibleColumns.includes('manager')) row[t('manager')] = user.manager || t('notAvailable');
      if (visibleColumns.includes('storeName')) {
        row[t('storeName')] = user.storeName || getStoreNameById(user.entityId) || t('notAvailable');
      }
      if (visibleColumns.includes('createdAt')) row[t('createdAt')] = user.createdAt || t('notAvailable');
      if (visibleColumns.includes('lastLogin')) row[t('lastLogin')] = formatDateTime(user.lastLogin, t('notAvailable'));
      if (visibleColumns.includes('validEmail')) row[t('validEmail')] = user.validEmail ? 'Yes' : 'No';
      if (visibleColumns.includes('status')) row[t('status')] = user.isActive ? 'Active' : 'Inactive';

      visibleUserTagColumns.forEach((tag: any) => {
        row[tag.name] = getUserTagCellValue(user, tag);
      });

      return row;
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    
    // Generate Excel file and download
    XLSX.writeFile(workbook, 'users_export.xlsx');
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      alert('Please select a file to upload');
      return;
    }

    if (!formData.entityId) {
      alert('Please select an entity');
      return;
    }

    try {
      const data = await bulkFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Process each user from the Excel file
      const usersToCreate = jsonData.map((row: any) => ({
        userId: crypto.randomUUID(),
        name: row[t('name')] || row['name'] || row['Name'] || '',
        email: row[t('email')] || row['email'] || row['Email'] || '',
        employeeId: row[t('employeeId')] || row['employeeId'] || row['Employee ID'] || '',
        designation: row[t('designation')] || row['designation'] || row['Designation'] || '',
        manager: row[t('manager')] || row['manager'] || row['Manager'] || '',
        password: row['password'] || row['Password'] || 'ChangeMe123!',
        entityId: formData.entityId,
        storeName: formData.entity,
        validEmail: true,
        isActive: true,
        tags: {},
      }));

      const response = await fetch('http://localhost:3002/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: usersToCreate }),
      });

      const result = await response.json().catch(() => null);

      if (response.ok) {
        const message = result?.failed
          ? `Uploaded ${result.created} user(s). ${result.failed} failed.`
          : `Users uploaded successfully (${result?.created ?? usersToCreate.length})`;
        alert(message);
        setIsBulkDialogOpen(false);
        setBulkFile(null);
        setFormData({ ...formData, entity: '', entityId: '' });
        fetchUsers();
        fetchStats();
      } else {
        alert(result?.message || 'Failed to upload users');
      }
    } catch (err) {
      console.error('Error uploading users:', err);
      alert('Error uploading users');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{t('userManagement')}</h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant="ghost"
                className={`rounded-none border-b-2 px-4 ${
                  activeTab === tab.key
                    ? "border-sky-500 text-sky-700 bg-transparent hover:bg-sky-50/60 font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {activeTab === "Users" ? (
          <>
            {/* Stats Section */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3">
                <UsersIcon className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm font-medium">{t('totalUsers')}: {stats.totalUsers}</p>
              </div>
              <div className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3">
                <p className="text-sm font-medium">{t('active')}: {stats.activeUsers}</p>
              </div>
              <div className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3">
                <p className="text-sm font-medium">{t('inactive')}: {stats.inactiveUsers}</p>
              </div>
              <div className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm font-medium">{t('validEmails')}: {stats.validEmails}</p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchByName')}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[200px] relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('filterByEmail')}
                  className="pl-10"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {validEmailFilterLabel}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setValidEmailFilter("all")}>{t("all")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setValidEmailFilter("valid")}>{t("valid")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setValidEmailFilter("invalid")}>{t("invalid")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {sortByLabel}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy("nameAsc")}>{t("nameAsc")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("nameDesc")}>{t("nameDesc")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("emailAsc")}>{t("emailAsc")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("emailDesc")}>{t("emailDesc")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={handleApplyFilters}>{t("apply")}</Button>
              <Button variant="ghost" onClick={handleResetFilters}>{t("reset")}</Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Bulk User Dialog */}
              <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('bulkUser')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{t('bulkUploadUsers')}</DialogTitle>
                    <DialogDescription>
                      {t('bulkUploadUsersDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="bulkFile">{t('uploadFile')}</Label>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="bulkFile"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Plus className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {bulkFile ? bulkFile.name : t('clickToUploadCsvOrExcelFile')}
                            </p>
                          </div>
                          <input
                            id="bulkFile"
                            type="file"
                            className="hidden"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('requiredColumns')}</Label>
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        <p className="font-medium mb-2">{t('yourFileMustIncludeTheseColumns')}</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>{t('name')}</li>
                          <li>{t('email')}</li>
                          <li>{t('employeeId')}</li>
                          <li>{t('designation')}</li>
                          <li>{t('manager')}</li>
                        </ul>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entity">{t('entity')}</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {formData.entity || t('selectEntity')}
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          {entities.map((entity: any) => (
                            <DropdownMenuItem
                              key={entity.id}
                              onClick={() => setFormData({ ...formData, entity: entity.storeName, entityId: entity.id })}
                            >
                              {entity.storeName}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={handleBulkUpload}>
                      {t('uploadUsers')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* New User Dialog */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('newUser')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('addNewUser')}</DialogTitle>
                    <DialogDescription>
                      {t('fillInTheDetailsToCreateANewUserAccount')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="entity">{t('entity')}</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {formData.entity || t('selectEntity')}
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {entities.map((entity: any) => (
                              <DropdownMenuItem
                                key={entity.id}
                                onClick={() => setFormData({ ...formData, entity: entity.storeName, entityId: entity.id })}
                              >
                                {entity.storeName}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('name')}</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={t('enterName')}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="employeeId">{t('employeeId')}</Label>
                        <Input
                          id="employeeId"
                          value={formData.employeeId}
                          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                          placeholder={t('enterEmployeeId')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder={t('enterEmail')}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="validEmail">{t('validEmail')}</Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="validEmail"
                            checked={formData.validEmail}
                            onCheckedChange={(checked) => setFormData({ ...formData, validEmail: checked })}
                          />
                          <span className="text-sm text-muted-foreground">
                            {formData.validEmail ? t('valid') : t('invalid')}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">{t('password')}</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={t('enterPassword')}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">{t('phoneNumber')}</Label>
                      <div className="flex gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-40 justify-between">
                              {formData.countryCode}
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {COUNTRY_PHONE_OPTIONS.map((option) => (
                              <DropdownMenuItem
                                key={option.code}
                                onClick={() => handleCountryCodeChange(option.code)}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.phoneNumber}
                          onChange={(e) => handlePhoneNumberChange(e.target.value, formData.countryCode)}
                          placeholder={t('enterPhoneNumber')}
                          className="flex-1"
                          maxLength={
                            COUNTRY_PHONE_OPTIONS.find((item) => item.code === formData.countryCode)?.maxLength
                          }
                        />
                      </div>
                      {phoneError && (
                        <p className="text-sm text-destructive">{phoneError}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="manager">{t('manager')}</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {formData.manager || t('selectManager')}
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {users.map((user: any) => (
                              <DropdownMenuItem
                                key={user.userId}
                                onClick={() => setFormData({ ...formData, manager: user.name })}
                              >
                                {user.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="designation">{t('designation')}</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {formData.designation || t('selectDesignation')}
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {designations.map((designation: any) => (
                              <DropdownMenuItem
                                key={designation.id}
                                onClick={() => setFormData({ ...formData, designation: designation.name })}
                              >
                                {designation.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <Collapsible open={isProcessAssignmentOpen} onOpenChange={setIsProcessAssignmentOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {t('processAssignment')}
                          <ChevronRight className={`w-4 h-4 transition-transform ${isProcessAssignmentOpen ? "rotate-90" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>{t('selectProcess')}</Label>
                          {publishedProcesses.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No published processes available. Publish a process first from Process Management.
                            </p>
                          ) : (
                            <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                              {publishedProcesses.map((process: any) => (
                                <label
                                  key={process.id}
                                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50"
                                >
                                  <Checkbox
                                    checked={selectedProcessIds.includes(process.id)}
                                    onCheckedChange={(checked) => {
                                      setSelectedProcessIds((prev) =>
                                        checked
                                          ? [...prev, process.id]
                                          : prev.filter((id) => id !== process.id),
                                      );
                                    }}
                                  />
                                  <span className="text-sm">{process.title}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {selectedProcessIds.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {selectedProcessIds.length} process(es) will be assigned to this user
                            </p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-lg font-semibold">Tags</h3>
                      {userTags.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tags available. Create tags in the User Tags tab first.</p>
                      ) : (
                        <div className="space-y-3">
                          {userTags.map((tag: any) => {
                            const values = Array.isArray(tag.tagValues) ? tag.tagValues : [];
                            return (
                              <div key={tag.id} className="space-y-2">
                                <Label htmlFor={`tag-${tag.id}`}>{tag.name}</Label>
                                {values.length > 0 ? (
                                  <Select
                                    value={selectedTags[tag.name] || ''}
                                    onValueChange={(value) => setSelectedTags({ ...selectedTags, [tag.name]: value })}
                                  >
                                    <SelectTrigger id={`tag-${tag.id}`}>
                                      <SelectValue placeholder={`Select ${tag.name}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {values.map((value: string, index: number) => (
                                        <SelectItem key={index} value={value}>
                                          {value}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    id={`tag-${tag.id}`}
                                    placeholder={`Enter ${tag.name}`}
                                    value={selectedTags[tag.name] || ''}
                                    onChange={(e) => setSelectedTags({ ...selectedTags, [tag.name]: e.target.value })}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {createError && (
                    <p className="text-sm text-destructive px-1">{createError}</p>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={handleCreateUser}>
                      {t('createUser')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit User Dialog */}
              <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('editUser')}</DialogTitle>
                    <DialogDescription>
                      {t('updateUserDetailsManagerIsRequiredWhenEditing')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-entity">{t('entity')}</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {editFormData.entity || t('selectEntity')}
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {entities.map((entity: any) => (
                              <DropdownMenuItem
                                key={entity.id}
                                onClick={() => setEditFormData({ ...editFormData, entity: entity.storeName, entityId: entity.id })}
                              >
                                {entity.storeName}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">{t('name')}</Label>
                        <Input
                          id="edit-name"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          placeholder={t('enterName')}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-employeeId">{t('employeeId')}</Label>
                        <Input
                          id="edit-employeeId"
                          value={editFormData.employeeId}
                          onChange={(e) => setEditFormData({ ...editFormData, employeeId: e.target.value })}
                          placeholder={t('enterEmployeeId')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">{t('email')}</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          placeholder={t('enterEmail')}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-phoneNumber">{t('phoneNumber')}</Label>
                        <div className="flex gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-24">
                                {editFormData.countryCode}
                                <ChevronDown className="w-4 h-4 ml-2" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setEditFormData({ ...editFormData, countryCode: "+1" })}>+1</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditFormData({ ...editFormData, countryCode: "+91" })}>+91</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditFormData({ ...editFormData, countryCode: "+44" })}>+44</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Input
                            id="edit-phoneNumber"
                            value={editFormData.phoneNumber}
                            onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                            placeholder={t('enterPhoneNumber')}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-manager">
                          {t('manager')} <span className="text-destructive">*</span>
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {editFormData.manager || t('selectManager')}
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {users.map((user: any) => (
                              <DropdownMenuItem
                                key={user.userId}
                                onClick={() => setEditFormData({ ...editFormData, manager: user.name })}
                              >
                                {user.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-designation">{t('designation')}</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              {editFormData.designation || t('selectDesignation')}
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {designations.map((designation: any) => (
                              <DropdownMenuItem
                                key={designation.id}
                                onClick={() => setEditFormData({ ...editFormData, designation: designation.name })}
                              >
                                {designation.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-lg font-semibold">Tags</h3>
                      {userTags.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tags available. Create tags in the User Tags tab first.</p>
                      ) : (
                        <div className="space-y-3">
                          {userTags.map((tag: any) => {
                            const values = Array.isArray(tag.tagValues) ? tag.tagValues : [];
                            return (
                              <div key={tag.id} className="space-y-2">
                                <Label htmlFor={`edit-tag-${tag.id}`}>{tag.name}</Label>
                                {values.length > 0 ? (
                                  <Select
                                    value={editSelectedTags[tag.name] || ''}
                                    onValueChange={(value) => setEditSelectedTags({ ...editSelectedTags, [tag.name]: value })}
                                  >
                                    <SelectTrigger id={`edit-tag-${tag.id}`}>
                                      <SelectValue placeholder={`Select ${tag.name}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {values.map((value: string, index: number) => (
                                        <SelectItem key={index} value={value}>
                                          {value}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    id={`edit-tag-${tag.id}`}
                                    placeholder={`Enter ${tag.name}`}
                                    value={editSelectedTags[tag.name] || ''}
                                    onChange={(e) => setEditSelectedTags({ ...editSelectedTags, [tag.name]: e.target.value })}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={handleUpdateUser}>
                      {t('updateUser')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Column Settings & More Actions */}
              <Dialog open={isColumnSettingsOpen} onOpenChange={setIsColumnSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleOpenColumnSettings}>
                    <Settings className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('customizeTableColumns')}</DialogTitle>
                    <DialogDescription>
                      {t('selectFieldsToDisplayInTheUserTable')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {USER_TABLE_STANDARD_COLUMNS.map((column) => (
                      <div key={column.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`column-${column.key}`}
                          checked={tempVisibleColumns.includes(column.key)}
                          onChange={() => handleToggleColumn(column.key)}
                        />
                        <label htmlFor={`column-${column.key}`} className="text-sm">
                          {t(column.labelKey)}
                        </label>
                      </div>
                    ))}
                    {userTags.length > 0 && (
                      <>
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium mb-2">{t('userTags')}</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            {t('selectUserTagColumnsToDisplay')}
                          </p>
                        </div>
                        {userTags.map((tag: any) => {
                          const columnKey = userTagColumnKey(tag.id);
                          return (
                            <div key={tag.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`column-${columnKey}`}
                                checked={tempVisibleColumns.includes(columnKey)}
                                onChange={() => handleToggleColumn(columnKey)}
                              />
                              <label htmlFor={`column-${columnKey}`} className="text-sm">
                                {tag.name}
                              </label>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsColumnSettingsOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={handleSaveColumnSettings}>
                      {t('save')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExport}>{t('export')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>{/* END Action Buttons */}

            {/* Users Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.includes('name') && <TableHead>{t('name')}</TableHead>}
                      {visibleColumns.includes('email') && <TableHead>{t('email')}</TableHead>}
                      {visibleColumns.includes('employeeId') && <TableHead>{t('employeeId')}</TableHead>}
                      {visibleColumns.includes('designation') && <TableHead>{t('designation')}</TableHead>}
                      {visibleColumns.includes('manager') && <TableHead>{t('manager')}</TableHead>}
                      {visibleColumns.includes('storeName') && <TableHead>{t('storeName')}</TableHead>}
                      {visibleColumns.includes('createdAt') && <TableHead>{t('createdAt')}</TableHead>}
                      {visibleColumns.includes('lastLogin') && <TableHead>{t('lastLogin')}</TableHead>}
                      {visibleColumns.includes('validEmail') && <TableHead>{t('validEmail')}</TableHead>}
                      {visibleColumns.includes('status') && <TableHead>{t('status')}</TableHead>}
                      {visibleUserTagColumns.map((tag: any) => (
                        <TableHead key={tag.id}>{tag.name}</TableHead>
                      ))}
                      {visibleColumns.includes('action') && <TableHead>{t('action')}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={userTableColumnCount} className="text-center py-12">
                          {t('loadingUsers')}
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={userTableColumnCount} className="text-center py-12 text-muted-foreground">
                          {t('noUsersAvailable')}
                        </TableCell>
                      </TableRow>
                    ) : displayUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={userTableColumnCount} className="text-center py-12 text-muted-foreground">
                          {searchTerm.trim()
                            ? `No users match "${searchTerm.trim()}"`
                            : appliedEmailFilter.trim() || appliedValidEmailFilter !== "all"
                              ? "No users match the selected filters"
                              : t("noUsersAvailable")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayUsers.map((user: any) => (
                        <TableRow key={user.id}>
                          {visibleColumns.includes('name') && <TableCell className="font-medium">{user.name || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('email') && <TableCell>{user.email || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('employeeId') && <TableCell>{user.employeeId || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('designation') && <TableCell>{user.designation || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('manager') && <TableCell>{user.manager || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('storeName') && <TableCell>{user.entityId ? entities.find((e: any) => e.id === user.entityId || e.entityId === user.entityId)?.storeName || t('notAvailable') : t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('createdAt') && <TableCell>{user.createdAt || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('lastLogin') && (
                            <TableCell>{formatDateTime(user.lastLogin, t('notAvailable'))}</TableCell>
                          )}
                          {visibleColumns.includes('validEmail') && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={user.validEmail || false}
                                  onCheckedChange={() => handleToggleValidEmail(user.id)}
                                />
                                <span className="text-sm">{user.validEmail ? 'Valid' : 'Invalid'}</span>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.includes('status') && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={user.isActive || false}
                                  onCheckedChange={() => handleToggleUserStatus(user.userId || user.id)}
                                />
                                <span className="text-sm">{user.isActive ? 'Active' : 'Inactive'}</span>
                              </div>
                            </TableCell>
                          )}
                          {visibleUserTagColumns.map((tag: any) => (
                            <TableCell key={tag.id}>
                              {getUserTagCellValue(user, tag)}
                            </TableCell>
                          ))}
                          {visibleColumns.includes('action') && (
                            <TableCell>
                              <TableActionsMenu>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  {t('edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    const userId = user.userId || user.id;
                                    handleDeleteUser(userId);
                                  }}
                                >
                                  {t('delete')}
                                </DropdownMenuItem>
                              </TableActionsMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : activeTab === "Designation" ? (
          <>
            {/* Designation Tab Content */}
            <div className="flex items-center justify-between mb-6">
              <Dialog open={isDesignationDialogOpen} onOpenChange={setIsDesignationDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('addDesignation')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('createDesignation')}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="designation">
                        {t('designation')} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="designation"
                        placeholder={t('designation')}
                        value={designationData.designation}
                        onChange={(e) => setDesignationData({ ...designationData, designation: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reportingDesignation">{t('reportingDesignation')}</Label>
                      <Select
                        value={designationData.reportingDesignation}
                        onValueChange={(value) => setDesignationData({ ...designationData, reportingDesignation: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger id="reportingDesignation">
                          <SelectValue placeholder={t('selectReportingDesignation')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('none')}</SelectItem>
                          {designations.map((d: any) => (
                            <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="systemRole">
                        {t('systemRole')} <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={designationData.systemRole}
                        onValueChange={(value) => setDesignationData({ ...designationData, systemRole: value })}
                      >
                        <SelectTrigger id="systemRole">
                          <SelectValue placeholder={t('selectSystemRole')} />
                        </SelectTrigger>
                        <SelectContent>
                          {systemRoles.map((role: any) => (
                            <SelectItem key={role.id} value={role.id}>{role.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hasCreatorAccess">{t('creatorAccess')}</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="hasCreatorAccess"
                          checked={designationData.hasCreatorAccess}
                          onCheckedChange={(checked) => setDesignationData({ ...designationData, hasCreatorAccess: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {designationData.hasCreatorAccess ? t('canCreateWorkflows') : t('cannotCreateWorkflows')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDesignationDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={handleCreateDesignation}>
                      {t('createDesignation')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Designation Dialog */}
              <Dialog open={isEditDesignationDialogOpen} onOpenChange={setIsEditDesignationDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('editUser')} {t('designation')}</DialogTitle>
                    <DialogDescription>
                      {t('updateUserDetailsManagerIsRequiredWhenEditing')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-designation">{t('designation')}</Label>
                      <Input
                        id="edit-designation"
                        placeholder={t('designation')}
                        value={designationData.designation}
                        onChange={(e) => setDesignationData({ ...designationData, designation: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-reportingDesignation">{t('reportingDesignation')}</Label>
                      <Select
                        value={designationData.reportingDesignation}
                        onValueChange={(value) => setDesignationData({ ...designationData, reportingDesignation: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger id="edit-reportingDesignation">
                          <SelectValue placeholder={t('selectReportingDesignation')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('none')}</SelectItem>
                          {designations.map((d: any) => (
                            <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-systemRole">
                        {t('systemRole')} <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={designationData.systemRole}
                        onValueChange={(value) => setDesignationData({ ...designationData, systemRole: value })}
                      >
                        <SelectTrigger id="edit-systemRole">
                          <SelectValue placeholder={t('selectSystemRole')} />
                        </SelectTrigger>
                        <SelectContent>
                          {systemRoles.map((role: any) => (
                            <SelectItem key={role.id} value={role.id}>{role.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-hasCreatorAccess">{t('creatorAccess')}</Label>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="edit-hasCreatorAccess"
                          checked={designationData.hasCreatorAccess}
                          onCheckedChange={(checked) => setDesignationData({ ...designationData, hasCreatorAccess: checked })}
                        />
                        <span className="text-sm text-muted-foreground">
                          {designationData.hasCreatorAccess ? t('canCreateWorkflows') : t('cannotCreateWorkflows')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDesignationDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={handleUpdateDesignation}>
                      {t('updateUser')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex items-center gap-3 ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExport}>{t('export')}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Designation Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('designation')}</TableHead>
                      <TableHead>{t('reportingDesignation')}</TableHead>
                      <TableHead>{t('systemRole')}</TableHead>
                      <TableHead>{t('creatorAccess')}</TableHead>
                      <TableHead>{t('action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          {t('noDesignationsAvailable')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      designations.map((designation: any) => (
                        <TableRow key={designation.id}>
                          <TableCell className="font-medium">{designation.name}</TableCell>
                          <TableCell>{designation.reportingDesignationName || t('notAvailable')}</TableCell>
                          <TableCell>{designation.systemRole?.displayName || t('notAvailable')}</TableCell>
                          <TableCell>
                            <Badge variant={designation.hasCreatorAccess ? 'default' : 'secondary'}>
                              {designation.hasCreatorAccess ? t('yes') : t('no')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <TableActionsMenu>
                              <DropdownMenuItem onClick={() => handleEditDesignation(designation)}>
                                {t('edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenPermissionDialog(designation)}>
                                {t('permissions')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteDesignation(designation.id)}
                                className="text-destructive"
                              >
                                {t('delete')}
                              </DropdownMenuItem>
                            </TableActionsMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Feature Permissions Dialog */}
            <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manage Feature Permissions</DialogTitle>
                  <DialogDescription>
                    Configure feature access for {selectedDesignationForPermissions?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-4">
                    {features.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No features available
                      </div>
                    ) : (
                      features.map((feature: any) => (
                        <div key={feature.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{feature.displayName}</h4>
                              <p className="text-sm text-muted-foreground">{feature.category}</p>
                            </div>
                            <button
                              onClick={() => {
                                console.log('Button clicked for feature:', feature.id);
                                handleTogglePermission(feature.id, 'read');
                              }}
                              className={`px-3 py-1 rounded text-sm ${
                                Array.isArray(designationPermissions) && designationPermissions.some((p: any) => p.featureId === feature.id)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {Array.isArray(designationPermissions) && designationPermissions.some((p: any) => p.featureId === feature.id) ? 'Enabled' : 'Disabled'}
                            </button>
                          </div>
                          {feature.description && (
                            <p className="text-xs text-muted-foreground mt-2">{feature.description}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsPermissionDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : activeTab === "User Hierarchy" ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <UserHierarchyTree
              users={users}
              getDirectReports={getDirectReports}
              selectedUserId={selectedHierarchyUserId}
              onSelectUser={handleSelectHierarchyUser}
              searchPlaceholder={t("searchByName")}
              expandAllLabel={t("expandAll")}
              collapseAllLabel={t("collapseAll")}
            />
            <UserHierarchyDetails
              user={selectedHierarchyUser}
              defaultStoreLabel={hierarchyDefaultStoreLabel}
              storesUnderCoverage={hierarchyStoresUnderCoverage}
              directReportCount={hierarchyDirectReportCount}
              labels={{
                userDetails: t("userDetails") || "User Details",
                name: t("name"),
                phoneNumber: t("phoneNumber") || "Phone Number",
                email: t("email"),
                store: t("storeName"),
                designation: t("designation"),
                users: t("users") || "Users",
                storesUnderCoverage: t("storesUnderCoverage") || "Stores under coverage",
                storeName: t("storeName"),
                storeId: t("entityId") || "Store ID",
                selectUserPrompt: t("selectHierarchyUser") || "Select a user from the hierarchy to view details",
                notAvailable: t("notAvailable"),
              }}
            />
          </div>
        ) : activeTab === "Advance Mapping" ? (
          <>
            {/* Advance Mapping Tab Content */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Advance Mapping - Report Access</h2>
                <p className="text-sm text-muted-foreground">
                  Give users report access to additional stores beyond their default mapped stores.
                </p>
              </div>
              <Button className="gap-2 shrink-0" onClick={handleOpenAddAdvanceMapping}>
                <Plus className="w-4 h-4" />
                Add Advance Mapping
              </Button>
            </div>

            {/* Users Table for Advance Mapping */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Default Stores</TableHead>
                      <TableHead>Additional Stores</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advanceMappedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          No advance mapped users yet. Click &quot;Add Advance Mapping&quot; to assign report access.
                        </TableCell>
                      </TableRow>
                    ) : (
                      advanceMappedUsers.map((user: any) => (
                        <TableRow key={user.userId}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.designation}</TableCell>
                          <TableCell>{getUserDefaultStoreName(user)}</TableCell>
                          <TableCell>
                            {(() => {
                              const additionalStores = getAdditionalStoreDetails(user);
                              if (additionalStores.length === 0) {
                                return (
                                  <span className="text-sm text-muted-foreground">None</span>
                                );
                              }

                              return (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                      <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                                        {additionalStores.length} store{additionalStores.length === 1 ? '' : 's'}
                                      </Badge>
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent align="start" className="w-72">
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium">Additional stores</p>
                                      <ul className="space-y-2">
                                        {additionalStores.map((store) => (
                                          <li key={store.id} className="text-sm">
                                            <p className="font-medium">{store.name}</p>
                                            {store.area ? (
                                              <p className="text-xs text-muted-foreground">{store.area}</p>
                                            ) : null}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <TableActionsMenu>
                              <DropdownMenuItem onClick={() => handleOpenAdvanceMapping(user)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteAdvanceMapping(user)}
                                disabled={getAdditionalStoreDetails(user).length === 0}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </TableActionsMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Advance Mapping Dialog */}
            <Dialog
              open={isAdvanceMappingDialogOpen}
              onOpenChange={(open) => {
                setIsAdvanceMappingDialogOpen(open);
                if (!open) {
                  setSelectedUserForMapping(null);
                  setAdvanceMappingUserId('');
                  setAdditionalStores([]);
                  setAdvanceMappingMode('add');
                }
              }}
            >
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {advanceMappingMode === 'add' ? 'Add Advance Mapping' : 'Edit Report Access'}
                  </DialogTitle>
                  <DialogDescription>
                    {advanceMappingMode === 'add'
                      ? 'Select a user and choose additional stores for report access.'
                      : `Update additional stores ${selectedUserForMapping?.name} can access for reporting.`}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {advanceMappingMode === 'add' ? (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="advance-mapping-user">
                          User Name <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={advanceMappingUserId}
                          onValueChange={handleAdvanceMappingUserChange}
                        >
                          <SelectTrigger id="advance-mapping-user">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user: any) => (
                              <SelectItem key={user.userId} value={user.userId}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="advance-mapping-designation">Designation</Label>
                        <Input
                          id="advance-mapping-designation"
                          value={selectedUserForMapping?.designation || ''}
                          placeholder="Select a user to view designation"
                          readOnly
                        />
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>User Name</Label>
                        <Input value={selectedUserForMapping?.name || ''} readOnly />
                      </div>
                      <div className="grid gap-2">
                        <Label>Designation</Label>
                        <Input value={selectedUserForMapping?.designation || ''} readOnly />
                      </div>
                    </div>
                  )}

                  {selectedUserForMapping ? (
                    <div className="rounded-md border bg-muted/40 p-3 text-sm">
                      <p className="text-muted-foreground">Default store</p>
                      <p className="font-medium">{getUserDefaultStoreName(selectedUserForMapping)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Default store cannot be added as an additional mapping.
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label>Stores for Report Access</Label>
                    <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                      {advanceMappingStoreOptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No stores available</p>
                      ) : (
                        advanceMappingStoreOptions.map((entity: any) => {
                          const isDefaultStore =
                            selectedUserDefaultStoreId &&
                            (entity.id === selectedUserDefaultStoreId ||
                              entity.entityId === selectedUserDefaultStoreId);

                          return (
                            <div key={entity.id} className="flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                id={`advance-store-${entity.id}`}
                                checked={additionalStores.includes(entity.id)}
                                disabled={!selectedUserForMapping || Boolean(isDefaultStore)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAdditionalStores([...additionalStores, entity.id]);
                                  } else {
                                    setAdditionalStores(
                                      additionalStores.filter((id) => id !== entity.id),
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`advance-store-${entity.id}`}
                                className={`text-sm ${isDefaultStore ? 'text-muted-foreground' : ''}`}
                              >
                                {entity.storeName}
                                {entity.area ? ` (${entity.area})` : ''}
                                {isDefaultStore ? ' — default store' : ''}
                              </label>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {!selectedUserForMapping && advanceMappingMode === 'add' ? (
                      <p className="text-xs text-muted-foreground">
                        Select a user first to enable store selection.
                      </p>
                    ) : null}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAdvanceMappingDialogOpen(false);
                      setSelectedUserForMapping(null);
                      setAdvanceMappingUserId('');
                      setAdditionalStores([]);
                      setAdvanceMappingMode('add');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAdvanceMapping} disabled={!canSaveAdvanceMapping}>
                    {advanceMappingMode === 'add' ? 'Create' : 'Update Mapping'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : activeTab === "Team" ? (
          <>
            {/* User Teams Tab Content */}
            <Dialog open={isUserTeamDialogOpen} onOpenChange={setIsUserTeamDialogOpen}>
              <div className="flex items-center justify-between mb-6">
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('createNewTeam')}
                  </Button>
                </DialogTrigger>
              </div>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingTeam ? t('editUserTeam') : t('createUserTeam')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="teamName">
                      {t('teamName')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="teamName"
                      placeholder={t('teamNamePlaceholder')}
                      value={userTeamData.name}
                      onChange={(e) => setUserTeamData({ ...userTeamData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teamMembers">{t('selectUsers')}</Label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      {users.map((user: any) => {
                        const memberId = user.userId || user.id;
                        return (
                        <div key={memberId} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`user-${memberId}`}
                            checked={userTeamData.memberIds.includes(memberId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUserTeamData({
                                  ...userTeamData,
                                  memberIds: [...userTeamData.memberIds, memberId],
                                });
                              } else {
                                setUserTeamData({
                                  ...userTeamData,
                                  memberIds: userTeamData.memberIds.filter((id) => id !== memberId),
                                });
                              }
                            }}
                          />
                          <label htmlFor={`user-${memberId}`} className="text-sm">
                            {user.name}
                          </label>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsUserTeamDialogOpen(false);
                    setEditingTeam(null);
                    setUserTeamData({ name: "", memberIds: [] });
                  }}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={editingTeam ? handleUpdateTeam : handleCreateUserTeam}>
                    {editingTeam ? t('updateTeam') : t('createTeam')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* User Teams Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('teamName')}</TableHead>
                      <TableHead>{t('members')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTeams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          {t('noUserTeamsAvailable')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      userTeams.map((team: any) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>
                            {team.memberCount ?? team.members?.length ?? 0}{' '}
                            {(team.memberCount ?? team.members?.length ?? 0) === 1
                              ? t('member')
                              : t('membersPlural')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={team.isActive ? 'default' : 'secondary'}>
                              {team.isActive ? t('active') : t('inactive')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <TableActionsMenu>
                              <DropdownMenuItem onClick={() => handleEditTeam(team)}>{t('edit')}</DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteTeam(team.id)}
                                className="text-destructive"
                              >
                                {t('delete')}
                              </DropdownMenuItem>
                            </TableActionsMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : activeTab === "User Tags" ? (
          <>
            {/* User Tags Tab Content */}
            <Dialog open={isUserTagDialogOpen} onOpenChange={setIsUserTagDialogOpen}>
              <div className="flex items-center justify-between mb-6">
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Tag
                  </Button>
                </DialogTrigger>
              </div>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingUserTag ? 'Edit User Tag' : 'Create User Tag'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createTagWithValue"
                      checked={createTagWithValue}
                      onCheckedChange={(checked) => setCreateTagWithValue(checked as boolean)}
                    />
                    <Label htmlFor="createTagWithValue">
                      Create Tag With Value
                    </Label>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tagName">
                      Tag Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tagName"
                      placeholder="e.g., Trained, Zone, Certified"
                      value={userTagData.name}
                      onChange={(e) => setUserTagData({ ...userTagData, name: e.target.value })}
                    />
                  </div>
                  {createTagWithValue && (
                    <div className="grid gap-2">
                      <Label htmlFor="tagValue">Tag Values</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tagValue"
                          placeholder="Enter value and press Enter or click Add"
                          value={tagValueInput}
                          onChange={(e) => setTagValueInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagValueInput.trim()) {
                              setUserTagData({ ...userTagData, tagValues: [...userTagData.tagValues, tagValueInput.trim()] });
                              setTagValueInput('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (tagValueInput.trim()) {
                              setUserTagData({ ...userTagData, tagValues: [...userTagData.tagValues, tagValueInput.trim()] });
                              setTagValueInput('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      {userTagData.tagValues.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {userTagData.tagValues.map((value, index) => (
                            <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                              <span className="text-sm">{value}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setUserTagData({
                                    ...userTagData,
                                    tagValues: userTagData.tagValues.filter((_, i) => i !== index)
                                  });
                                }}
                                className="text-destructive hover:text-destructive/80"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mandatory"
                      checked={userTagData.mandatory}
                      onCheckedChange={(checked) => setUserTagData({ ...userTagData, mandatory: checked as boolean })}
                    />
                    <Label htmlFor="mandatory">
                      Mandatory During User Creation
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsUserTagDialogOpen(false);
                    setEditingUserTag(null);
                    setUserTagData({ name: "", tagValues: [], mandatory: false });
                    setCreateTagWithValue(false);
                    setTagValueInput("");
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={editingUserTag ? handleUpdateUserTag : handleCreateUserTag}>
                    {editingUserTag ? 'Update Tag' : 'Create Tag'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* User Tags Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag Name</TableHead>
                      <TableHead>Values</TableHead>
                      <TableHead>Mandatory</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTags.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          No user tags available
                        </TableCell>
                      </TableRow>
                    ) : (
                      userTags.map((tag: any) => {
                        const values = Array.isArray(tag.tagValues) ? tag.tagValues : [];
                        return (
                          <TableRow key={tag.id}>
                            <TableCell className="font-medium">{tag.name}</TableCell>
                            <TableCell>{values.length > 0 ? values.join(', ') : 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={tag.mandatory === 'YES' ? 'default' : 'secondary'}>
                                {tag.mandatory === 'YES' ? 'Yes' : 'No'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <TableActionsMenu>
                                <DropdownMenuItem onClick={() => handleEditUserTag(tag)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteUserTag(tag.id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </TableActionsMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : activeTab === "Hybrid Assignee" ? (
          <HybridAssigneePanel users={users} entities={entities} />
        ) : activeTab === "Removed User" ? (
          <>
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('email')}</TableHead>
                    <TableHead>{t('designation')}</TableHead>
                    <TableHead>{t('entityId')}</TableHead>
                    <TableHead>{t('removedAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {removedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        {t('noRemovedUsers')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    removedUsers.map((user: any) => (
                      <TableRow key={user.userId}>
                        <TableCell className="font-medium">{user.name || t('notAvailable')}</TableCell>
                        <TableCell>{user.email || t('notAvailable')}</TableCell>
                        <TableCell>{user.designation || t('notAvailable')}</TableCell>
                        <TableCell>{user.entityId ? entities.find((e: any) => e.id === user.entityId)?.storeName || user.storeName || user.entityId : user.storeName || t('notAvailable')}</TableCell>
                        <TableCell>{user.updatedAt || t('notAvailable')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>{activeTab} tab content coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}