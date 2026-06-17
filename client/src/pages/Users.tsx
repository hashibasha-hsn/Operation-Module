import { useState, useEffect } from "react";
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

export default function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0, validEmails: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Users");
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    countryCode: "+1",
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
  const [visibleColumns, setVisibleColumns] = useState([
    'name', 'email', 'designation', 'manager', 'entityId', 'storeName', 'createdAt', 'lastLogin', 'validEmail', 'status', 'action'
  ]);
  const [tempVisibleColumns, setTempVisibleColumns] = useState([
    'name', 'email', 'designation', 'manager', 'entityId', 'storeName', 'createdAt', 'lastLogin', 'validEmail', 'status', 'action'
  ]);
  const [selectedUserForMapping, setSelectedUserForMapping] = useState<any>(null);
  const [isAdvanceMappingDialogOpen, setIsAdvanceMappingDialogOpen] = useState(false);
  const [additionalStores, setAdditionalStores] = useState<string[]>([]);
  const [isHybridDialogOpen, setIsHybridDialogOpen] = useState(false);
  const [hybridData, setHybridData] = useState({ userId: '', isHybrid: false, hybridStores: [] as string[] });
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
        tag: tag.tagName,
        tagValues: Array.isArray(tag.tagValues) ? tag.tagValues : (typeof tag.tagValues === 'string' ? JSON.parse(tag.tagValues) : []),
        mandatory: tag.mandatory
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
      setUserTeams(data || []);
    } catch (err) {
      console.error('Failed to fetch user teams:', err);
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
    if (activeTab === "Designation") {
      fetchDesignations();
      fetchSystemRoles();
    }
    if (activeTab === "Removed User") {
      fetchRemovedUsers();
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

      setDesignations(designationsWithDetails || []);
    } catch (err) {
      console.error('Failed to fetch designations:', err);
    }
  };

  const fetchSystemRoles = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/user/system-roles');
      const data = await response.json();
      setSystemRoles(data || []);
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
      const response = await fetch('http://localhost:3002/users');
      const data = await response.json();
      // Parse tags if they come as JSON strings from the database
      const usersWithParsedTags = (data.users || []).map((user: any) => ({
        ...user,
        tags: typeof user.tags === 'string' ? JSON.parse(user.tags) : (user.tags || {})
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

  const handleRestoreUser = async (userId: string) => {
    if (!confirm('Are you sure you want to restore this user?')) return;

    try {
      const response = await fetch(`http://localhost:3002/users/removed/${userId}/restore`, {
        method: 'POST',
      });
      if (response.ok) {
        alert('User restored successfully');
        fetchRemovedUsers();
        fetchUsers();
        fetchStats();
      } else {
        alert('Failed to restore user');
      }
    } catch (err) {
      console.error('Error restoring user:', err);
      alert('Error restoring user');
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
    try {
      // Create user in user-service database
      const response = await fetch('http://localhost:3002/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: crypto.randomUUID(),
          name: formData.name,
          email: formData.email,
          password: formData.password,
          employeeId: formData.employeeId,
          phone: formData.phoneNumber,
          countryCode: formData.countryCode,
          entityId: formData.entityId,
          designation: formData.designation,
          manager: formData.manager,
          validEmail: formData.validEmail,
          tags: selectedTags,
          isActive: true,
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Also create user in auth-service database
        try {
          await fetch('http://localhost:3009/api/auth/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: userData.userId,
              email: formData.email,
              password: formData.password,
              verificationStatus: 'VERIFIED',
            }),
          });
        } catch (error) {
          console.error('Failed to create user in auth-service:', error);
        }

        setFormData({
          entity: "", entityId: "", name: "", employeeId: "", email: "",
          validEmail: false, password: "", phoneNumber: "", countryCode: "+1",
          manager: "", designation: "", tags: "",
        });
        setSelectedTags({});
        setIsDialogOpen(false);
        fetchUsers();
      } else {
        console.error('Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const handleCreateUserTag = async () => {
    try {
      const response = await fetch('http://localhost:3009/api/user/user-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagName: userTagData.name,
          tagValues: userTagData.tagValues,
          mandatory: userTagData.mandatory ? 'YES' : 'NO',
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
          tagName: userTagData.name,
          tagValues: userTagData.tagValues,
          mandatory: userTagData.mandatory ? 'YES' : 'NO',
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
    try {
      const response = await fetch('http://localhost:3002/user-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userTeamData.name,
          organizationId: 'default-org',
        }),
      });

      if (response.ok) {
        setUserTeamData({ name: "", memberIds: [] });
        setIsUserTeamDialogOpen(false);
        fetchUserTeams();
      } else {
        console.error('Failed to create user team');
      }
    } catch (err) {
      console.error('Error creating user team:', err);
    }
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
    if (!confirm('Are you sure you want to delete this user? This will delete the user from both databases.')) {
      return;
    }

    try {
      console.log('Attempting to delete user with ID:', userId);
      
      // Delete from user-service database
      const userResponse = await fetch(`http://localhost:3002/users/${userId}`, {
        method: 'DELETE',
      });
      
      console.log('User-service delete response:', userResponse.status);

      // Delete from auth-service database
      const authResponse = await fetch(`http://localhost:3009/api/auth/users/${userId}`, {
        method: 'DELETE',
      });
      
      console.log('Auth-service delete response:', authResponse.status);

      if (userResponse.ok || authResponse.ok) {
        console.log('Delete successful, refreshing users');
        fetchUsers();
      } else {
        console.error('Failed to delete user');
        console.error('User-service response:', await userResponse.text());
        console.error('Auth-service response:', await authResponse.text());
      }
    } catch (err) {
      console.error('Error deleting user:', err);
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

  const handleOpenAdvanceMapping = (user: any) => {
    setSelectedUserForMapping(user);
    setAdditionalStores(user.additionalStores || []);
    setIsAdvanceMappingDialogOpen(true);
  };

  const handleSaveAdvanceMapping = async () => {
    if (!selectedUserForMapping) return;

    try {
      const response = await fetch(`http://localhost:3002/users/${selectedUserForMapping.userId}/advance-mapping`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          additionalStores,
        }),
      });

      if (response.ok) {
        setIsAdvanceMappingDialogOpen(false);
        setSelectedUserForMapping(null);
        setAdditionalStores([]);
        fetchUsers();
      } else {
        console.error('Failed to save advance mapping');
      }
    } catch (err) {
      console.error('Error saving advance mapping:', err);
    }
  };

  const handleOpenHybridDialog = (user: any) => {
    setHybridData({
      userId: user.userId,
      isHybrid: user.isHybrid || false,
      hybridStores: user.hybridStores || [],
    });
    setIsHybridDialogOpen(true);
  };

  const handleSaveHybrid = async () => {
    try {
      const response = await fetch(`http://localhost:3002/users/${hybridData.userId}/hybrid`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isHybrid: hybridData.isHybrid,
          hybridStores: hybridData.hybridStores,
        }),
      });

      if (response.ok) {
        setIsHybridDialogOpen(false);
        setHybridData({ userId: '', isHybrid: false, hybridStores: [] });
        fetchUsers();
      } else {
        console.error('Failed to save hybrid settings');
      }
    } catch (err) {
      console.error('Error saving hybrid settings:', err);
    }
  };

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
    // Prepare data for export
    const exportData = users.map((user: any) => ({
      [t('name')]: user.name || t('notAvailable'),
      [t('email')]: user.email || t('notAvailable'),
      [t('designation')]: user.designation || t('notAvailable'),
      [t('manager')]: user.manager || t('notAvailable'),
      [t('entityId')]: user.entityId || t('notAvailable'),
      [t('storeName')]: user.storeName || t('notAvailable'),
      [t('createdAt')]: user.createdAt || t('notAvailable'),
      [t('lastLogin')]: user.lastLogin || t('notAvailable'),
      [t('validEmail')]: user.validEmail ? 'Yes' : 'No',
      [t('status')]: user.isActive ? 'Active' : 'Inactive',
    }));

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
        entityId: formData.entityId,
        validEmail: true,
        isActive: true,
      }));

      // Send users to backend
      const response = await fetch('http://localhost:3002/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: usersToCreate }),
      });

      if (response.ok) {
        alert('Users uploaded successfully');
        setIsBulkDialogOpen(false);
        setBulkFile(null);
        setFormData({ ...formData, entity: '', entityId: '' });
        fetchUsers();
        fetchStats();
      } else {
        alert('Failed to upload users');
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
                variant={activeTab === tab.key ? "default" : "ghost"}
                className={`rounded-t-lg border-b-2 ${
                  activeTab === tab.key
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
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
                  placeholder={t('searchUsers')}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {t('validEmail')}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>{t('all')}</DropdownMenuItem>
                  <DropdownMenuItem>{t('valid')}</DropdownMenuItem>
                  <DropdownMenuItem>{t('invalid')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {t('nameAsc')}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>{t('nameAsc')}</DropdownMenuItem>
                  <DropdownMenuItem>{t('nameDesc')}</DropdownMenuItem>
                  <DropdownMenuItem>{t('emailAsc')}</DropdownMenuItem>
                  <DropdownMenuItem>{t('emailDesc')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline">{t('apply')}</Button>
              <Button variant="ghost">{t('reset')}</Button>
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
                            <Button variant="outline" className="w-32 justify-between">
                              {formData.countryCode}
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setFormData({ ...formData, countryCode: "+1" })}>
                              +1 (US)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFormData({ ...formData, countryCode: "+91" })}>
                              +91 (IN)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFormData({ ...formData, countryCode: "+44" })}>
                              +44 (UK)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          placeholder={t('enterPhoneNumber')}
                          className="flex-1"
                        />
                      </div>
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
                          <Label htmlFor="process">{t('selectProcess')}</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between">
                                {t('selectProcess')}
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-full">
                              <DropdownMenuItem>{t('process1')}</DropdownMenuItem>
                              <DropdownMenuItem>{t('process2')}</DropdownMenuItem>
                              <DropdownMenuItem>{t('process3')}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                                <Label htmlFor={`tag-${tag.id}`}>{tag.tag}</Label>
                                {values.length > 0 ? (
                                  <Select
                                    value={selectedTags[tag.tag] || ''}
                                    onValueChange={(value) => setSelectedTags({ ...selectedTags, [tag.tag]: value })}
                                  >
                                    <SelectTrigger id={`tag-${tag.id}`}>
                                      <SelectValue placeholder={`Select ${tag.tag}`} />
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
                                    placeholder={`Enter ${tag.tag}`}
                                    value={selectedTags[tag.tag] || ''}
                                    onChange={(e) => setSelectedTags({ ...selectedTags, [tag.tag]: e.target.value })}
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
                                <Label htmlFor={`edit-tag-${tag.id}`}>{tag.tag}</Label>
                                {values.length > 0 ? (
                                  <Select
                                    value={editSelectedTags[tag.tag] || ''}
                                    onValueChange={(value) => setEditSelectedTags({ ...editSelectedTags, [tag.tag]: value })}
                                  >
                                    <SelectTrigger id={`edit-tag-${tag.id}`}>
                                      <SelectValue placeholder={`Select ${tag.tag}`} />
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
                                    placeholder={`Enter ${tag.tag}`}
                                    value={editSelectedTags[tag.tag] || ''}
                                    onChange={(e) => setEditSelectedTags({ ...editSelectedTags, [tag.tag]: e.target.value })}
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
                    {[
                      { key: 'name', label: t('name') },
                      { key: 'email', label: t('email') },
                      { key: 'designation', label: t('designation') },
                      { key: 'manager', label: t('manager') },
                      { key: 'entityId', label: t('entityId') },
                      { key: 'storeName', label: t('storeName') },
                      { key: 'createdAt', label: t('createdAt') },
                      { key: 'lastLogin', label: t('lastLogin') },
                      { key: 'validEmail', label: t('validEmail') },
                      { key: 'status', label: t('status') },
                      { key: 'action', label: t('action') }
                    ].map((column) => (
                      <div key={column.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`column-${column.key}`}
                          checked={tempVisibleColumns.includes(column.key)}
                          onChange={() => handleToggleColumn(column.key)}
                        />
                        <label htmlFor={`column-${column.key}`} className="text-sm">
                          {column.label}
                        </label>
                      </div>
                    ))}
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
                      {visibleColumns.includes('designation') && <TableHead>{t('designation')}</TableHead>}
                      {visibleColumns.includes('manager') && <TableHead>{t('manager')}</TableHead>}
                      {visibleColumns.includes('entityId') && <TableHead>{t('entityId')}</TableHead>}
                      {visibleColumns.includes('storeName') && <TableHead>{t('storeName')}</TableHead>}
                      {visibleColumns.includes('createdAt') && <TableHead>{t('createdAt')}</TableHead>}
                      {visibleColumns.includes('lastLogin') && <TableHead>{t('lastLogin')}</TableHead>}
                      {visibleColumns.includes('validEmail') && <TableHead>{t('validEmail')}</TableHead>}
                      {visibleColumns.includes('status') && <TableHead>{t('status')}</TableHead>}
                      {userTags.map((tag: any) => (
                        <TableHead key={tag.id}>{tag.tag}</TableHead>
                      ))}
                      <TableHead>{t('action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={visibleColumns.length + userTags.length + 1} className="text-center py-12">
                          {t('loadingUsers')}
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={visibleColumns.length + userTags.length + 1} className="text-center py-12 text-muted-foreground">
                          {t('noUsersAvailable')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: any) => (
                        <TableRow key={user.id}>
                          {visibleColumns.includes('name') && <TableCell className="font-medium">{user.name || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('email') && <TableCell>{user.email || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('designation') && <TableCell>{user.designation || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('manager') && <TableCell>{user.manager || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('entityId') && <TableCell>{user.entityId || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('storeName') && <TableCell>{user.storeName || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('createdAt') && <TableCell>{user.createdAt || t('notAvailable')}</TableCell>}
                          {visibleColumns.includes('lastLogin') && <TableCell>{user.lastLogin || t('notAvailable')}</TableCell>}
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
                          {userTags.map((tag: any) => (
                            <TableCell key={tag.id}>
                              {user.tags && user.tags[tag.tag] ? String(user.tags[tag.tag]) : '-'}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                                {t('edit')}
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => {
                                const userId = user.userId || user.id;
                                console.log('Delete button clicked for user:', user.name, 'with ID:', userId);
                                handleDeleteUser(userId);
                              }}>
                                {t('delete')}
                              </Button>
                            </div>
                          </TableCell>
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

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchUsers')}
                    className="pl-10 w-64"
                  />
                </div>
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
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditDesignation(designation)}>
                                {t('edit')}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenPermissionDialog(designation)}>
                                {t('permissions')}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteDesignation(designation.id)}>
                                {t('delete')}
                              </Button>
                            </div>
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
          <>
            {/* User Hierarchy Tab Content */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 bg-card border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">User Hierarchy</h3>
                <div className="space-y-2">
                  {users.filter((u: any) => !u.manager).map((user: any) => (
                    <div key={user.userId} className="cursor-pointer hover:bg-muted p-2 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {user.designation || 'N/A'}
                        </Badge>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2 bg-card border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">User Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">Select a user</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">--</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Designation</p>
                    <p className="font-medium">--</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Store</p>
                    <p className="font-medium">--</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Users (Direct Reports)</p>
                    <p className="font-medium">--</p>
                  </div>
                </div>

                <h4 className="text-md font-semibold mt-6 mb-4">Stores Under Coverage</h4>
                <div className="bg-muted rounded p-4 text-center text-muted-foreground">
                  Select a user to view stores under coverage
                </div>
              </div>
            </div>
          </>
        ) : activeTab === "Advance Mapping" ? (
          <>
            {/* Advance Mapping Tab Content */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Advance Mapping - Report Access</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Give users report access to additional stores beyond their default mapped stores.
              </p>
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
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          No users available
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: any) => (
                        <TableRow key={user.userId}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.designation}</TableCell>
                          <TableCell>{user.storeName || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.additionalStores?.length || 0} stores
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenAdvanceMapping(user)}>
                              Map Stores
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Advance Mapping Dialog */}
            <Dialog open={isAdvanceMappingDialogOpen} onOpenChange={setIsAdvanceMappingDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Give Report Access</DialogTitle>
                  <DialogDescription>
                    Select additional stores {selectedUserForMapping?.name} should have report access to.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Stores</Label>
                    <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                      {entities.map((entity: any) => (
                        <div key={entity.id} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`store-${entity.id}`}
                            checked={additionalStores.includes(entity.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAdditionalStores([...additionalStores, entity.id]);
                              } else {
                                setAdditionalStores(additionalStores.filter((id) => id !== entity.id));
                              }
                            }}
                          />
                          <label htmlFor={`store-${entity.id}`} className="text-sm">
                            {entity.storeName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAdvanceMappingDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAdvanceMapping}>
                    Save Mapping
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : activeTab === "Team" ? (
          <>
            {/* User Teams Tab Content */}
            <div className="flex items-center justify-between mb-6">
              <Dialog open={isUserTeamDialogOpen} onOpenChange={setIsUserTeamDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create User Team</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="teamName">
                        Team Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="teamName"
                        placeholder="e.g., East Zonal Team, Store Ops Leads"
                        value={userTeamData.name}
                        onChange={(e) => setUserTeamData({ ...userTeamData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="teamMembers">Select Users</Label>
                      <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                        {users.map((user: any) => (
                          <div key={user.userId} className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id={`user-${user.userId}`}
                              checked={userTeamData.memberIds.includes(user.userId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setUserTeamData({
                                    ...userTeamData,
                                    memberIds: [...userTeamData.memberIds, user.userId],
                                  });
                                } else {
                                  setUserTeamData({
                                    ...userTeamData,
                                    memberIds: userTeamData.memberIds.filter((id) => id !== user.userId),
                                  });
                                }
                              }}
                            />
                            <label htmlFor={`user-${user.userId}`} className="text-sm">
                              {user.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsUserTeamDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUserTeam}>
                      Create Team
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* User Teams Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTeams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          No user teams available
                        </TableCell>
                      </TableRow>
                    ) : (
                      userTeams.map((team: any) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>{team.members?.length || 0} members</TableCell>
                          <TableCell>
                            <Badge variant={team.isActive ? 'default' : 'secondary'}>
                              {team.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">Edit</Button>
                              <Button variant="ghost" size="sm">Delete</Button>
                            </div>
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
            <div className="flex items-center justify-between mb-6">
              <Dialog open={isUserTagDialogOpen} onOpenChange={setIsUserTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Tag
                  </Button>
                </DialogTrigger>
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
            </div>

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
                            <TableCell className="font-medium">{tag.tag}</TableCell>
                            <TableCell>{values.length > 0 ? values.join(', ') : 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={tag.mandatory === 'YES' ? 'default' : 'secondary'}>
                                {tag.mandatory === 'YES' ? 'Yes' : 'No'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditUserTag(tag)}>Edit</Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteUserTag(tag.id)}>Delete</Button>
                              </div>
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
          <>
            {/* Hybrid Assignee Tab Content */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Hybrid Assignee Profile</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Configure users to work across multiple stores or entities with flexible reporting structures.
              </p>
            </div>

            {/* Users Table for Hybrid Assignee */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Default Store</TableHead>
                      <TableHead>Hybrid Status</TableHead>
                      <TableHead>Hybrid Stores</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No users available
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: any) => (
                        <TableRow key={user.userId}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.designation}</TableCell>
                          <TableCell>{user.storeName || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={user.isHybrid ? "default" : "outline"}>
                              {user.isHybrid ? "Hybrid" : "Standard"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.hybridStores?.length || 0} stores
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenHybridDialog(user)}>
                              Configure
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Hybrid Assignee Dialog */}
            <Dialog open={isHybridDialogOpen} onOpenChange={setIsHybridDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Configure Hybrid Assignee</DialogTitle>
                  <DialogDescription>
                    Set up hybrid profile for this user to work across multiple stores.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="isHybrid">Enable Hybrid Profile</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isHybrid"
                        checked={hybridData.isHybrid}
                        onCheckedChange={(checked) => setHybridData({ ...hybridData, isHybrid: checked })}
                      />
                      <span className="text-sm text-muted-foreground">
                        {hybridData.isHybrid ? "Hybrid enabled" : "Standard profile"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Hybrid users can be assigned to multiple stores and have flexible reporting structures.
                    </p>
                  </div>
                  {hybridData.isHybrid && (
                    <div className="space-y-2">
                      <Label>Select Hybrid Stores</Label>
                      <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                        {entities.map((entity: any) => (
                          <div key={entity.id} className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id={`hybrid-store-${entity.id}`}
                              checked={hybridData.hybridStores.includes(entity.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setHybridData({
                                    ...hybridData,
                                    hybridStores: [...hybridData.hybridStores, entity.id],
                                  });
                                } else {
                                  setHybridData({
                                    ...hybridData,
                                    hybridStores: hybridData.hybridStores.filter((id) => id !== entity.id),
                                  });
                                }
                              }}
                            />
                            <label htmlFor={`hybrid-store-${entity.id}`} className="text-sm">
                              {entity.storeName}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsHybridDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveHybrid}>
                    Save Configuration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
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
                    <TableHead>{t('action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {removedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        {t('noRemovedUsers')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    removedUsers.map((user: any) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">{user.name || t('notAvailable')}</TableCell>
                        <TableCell>{user.email || t('notAvailable')}</TableCell>
                        <TableCell>{user.designation || t('notAvailable')}</TableCell>
                        <TableCell>{user.entity_id || t('notAvailable')}</TableCell>
                        <TableCell>{user.removed_at || t('notAvailable')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleRestoreUser(user.user_id)}>
                            {t('restore')}
                          </Button>
                        </TableCell>
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