import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthItem, getStoredUser, getOrganizationId } from '@/lib/authStorage';

interface PermissionContextType {
  hasPermission: (featureName: string) => boolean;
  hasCreatorAccess: boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
  userRole: string | null;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: ReactNode;
}

const USER_API = import.meta.env.VITE_USER_API || '/api/user';

/** Fallback Taqtics permissions when DB role-feature rows are empty. */
const TAQTICS_ROLE_PERMISSIONS: Record<string, string[]> = {
  company_admin: [
    'user_create', 'user_edit', 'user_delete', 'user_view',
    'designation_create', 'designation_edit',
    'workflow_create', 'workflow_edit', 'workflow_view', 'workflow_execute',
    'reporting_dashboard', 'reporting_export',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view',
  ],
  area_manager: [
    'workflow_create', 'workflow_edit', 'workflow_view', 'workflow_execute',
    'reporting_dashboard', 'reporting_export',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view',
  ],
  process_manager: [
    'workflow_view', 'workflow_execute',
    'reporting_dashboard',
    'ticket_resolve',
    'learning_view',
  ],
  user_manager: [
    'user_create', 'user_edit', 'user_delete', 'user_view',
    'designation_create', 'designation_edit',
    'reporting_dashboard',
  ],
  store_manager: [
    'workflow_create', 'workflow_edit', 'workflow_view', 'workflow_execute',
    'reporting_dashboard',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view',
  ],
  store_employee: ['workflow_execute', 'learning_view'],
  non_creator_store_employee: ['workflow_execute', 'learning_view'],
  non_creator_company_admin: [
    'user_create', 'user_edit', 'user_delete', 'user_view',
    'designation_create', 'designation_edit',
    'workflow_view', 'workflow_execute',
    'reporting_dashboard', 'reporting_export',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view',
  ],
  non_creator_area_manager: [
    'workflow_view', 'workflow_execute',
    'reporting_dashboard', 'reporting_export',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view',
  ],
  non_creator_store_manager: [
    'workflow_view', 'workflow_execute',
    'reporting_dashboard',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view',
  ],
};

const ADMIN_EMAILS = new Set(['admin@gmail.com', 'admin@hashibasha.com']);

function applyMinimalAccess(
  setPermissions: (v: string[]) => void,
  setUserRole: (v: string | null) => void,
  setHasCreatorAccess: (v: boolean) => void,
) {
  setPermissions(['workflow_execute', 'learning_view']);
  setUserRole('store_employee');
  setHasCreatorAccess(false);
}

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasCreatorAccess, setHasCreatorAccess] = useState(false);

  const fetchUserPermissions = async () => {
    try {
      const user = getStoredUser();
      const email = String(user.email || '').trim().toLowerCase();
      if (!email && !getAuthItem('accessToken')) {
        setPermissions([]);
        setUserRole(null);
        setHasCreatorAccess(false);
        setLoading(false);
        return;
      }

      // Platform admins get all feature names
      if (ADMIN_EMAILS.has(email)) {
        const featuresResponse = await fetch(`${USER_API}/features`);
        if (featuresResponse.ok) {
          const features = await featuresResponse.json();
          const list = Array.isArray(features) ? features : features?.features || [];
          setPermissions(list.map((f: any) => f.name).filter(Boolean));
        } else {
          setPermissions(TAQTICS_ROLE_PERMISSIONS.company_admin);
        }
        setUserRole('company_admin');
        setHasCreatorAccess(true);
        setLoading(false);
        return;
      }

      // Load profile (prefer stored userId)
      let userProfile: any = null;
      const userId = user.userId || user.id;
      if (userId) {
        const byIdRes = await fetch(`${USER_API}/users/${userId}`);
        if (byIdRes.ok) {
          userProfile = await byIdRes.json();
        }
      }
      if (!userProfile && email) {
        const searchRes = await fetch(
          `${USER_API}/users?search=${encodeURIComponent(email)}&limit=50`,
        );
        if (searchRes.ok) {
          const data = await searchRes.json();
          userProfile = (data.users || []).find(
            (u: any) => String(u.email || '').toLowerCase() === email,
          );
        }
      }

      const designationName = String(
        userProfile?.designation || user.designation || '',
      ).trim();

      if (!designationName) {
        applyMinimalAccess(setPermissions, setUserRole, setHasCreatorAccess);
        return;
      }

      // Resolve designation catalog entry by exact name + org
      const designationRes = await fetch(
        `${USER_API}/designations?organizationId=${encodeURIComponent(getOrganizationId())}&name=${encodeURIComponent(designationName)}`,
      );
      const designationList = designationRes.ok ? await designationRes.json() : [];
      const designation = Array.isArray(designationList) ? designationList[0] : null;

      if (!designation?.id) {
        applyMinimalAccess(setPermissions, setUserRole, setHasCreatorAccess);
        return;
      }

      // Designation → Taqtics/system role mapping
      const mappingRes = await fetch(
        `${USER_API}/designation-role-mapping/designation/${designation.id}`,
      );
      const mapping = mappingRes.ok ? await mappingRes.json() : null;
      const systemRole = mapping?.systemRole;

      if (!systemRole?.id) {
        applyMinimalAccess(setPermissions, setUserRole, setHasCreatorAccess);
        setHasCreatorAccess(Boolean(designation.hasCreatorAccess));
        return;
      }

      const finalRole = systemRole.name || 'store_employee';
      const hasCreator = Boolean(
        systemRole.hasCreatorAccess || designation.hasCreatorAccess,
      );
      setUserRole(finalRole);
      setHasCreatorAccess(hasCreator);

      // Permissions from role_feature_permissions (feature names)
      const permissionsRes = await fetch(
        `${USER_API}/role-feature-permissions/role/${systemRole.id}`,
      );
      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json();
        const featureNames = (permissionsData || [])
          .map((p: any) => p.feature?.name || p.featureName)
          .filter(Boolean);
        if (featureNames.length > 0) {
          setPermissions(featureNames);
          return;
        }
      }

      setPermissions(TAQTICS_ROLE_PERMISSIONS[finalRole] || TAQTICS_ROLE_PERMISSIONS.store_employee);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      applyMinimalAccess(setPermissions, setUserRole, setHasCreatorAccess);
    } finally {
      setLoading(false);
    }
  };

  const refreshPermissions = async () => {
    setLoading(true);
    await fetchUserPermissions();
  };

  const hasPermission = (featureName: string): boolean => {
    if (!featureName) return false;
    if (permissions.length === 0) return false;
    return permissions.includes(featureName);
  };

  useEffect(() => {
    void fetchUserPermissions();
  }, []);

  return (
    <PermissionContext.Provider
      value={{ hasPermission, hasCreatorAccess, loading, refreshPermissions, userRole }}
    >
      {children}
    </PermissionContext.Provider>
  );
};
