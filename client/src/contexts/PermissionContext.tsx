import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PermissionContextType {
  hasPermission: (featureId: string) => boolean;
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

// Taqtics role hierarchy with default permissions
const TAQTICS_ROLE_PERMISSIONS: Record<string, string[]> = {
  'company_admin': [
    'user_create', 'user_edit', 'user_delete', 'user_view',
    'designation_create', 'designation_edit',
    'workflow_create', 'workflow_edit', 'workflow_view', 'workflow_execute',
    'reporting_dashboard', 'reporting_export',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view'
  ],
  'area_manager': [
    'workflow_create', 'workflow_edit', 'workflow_view', 'workflow_execute',
    'reporting_dashboard', 'reporting_export',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view'
  ],
  'process_manager': [
    'workflow_view', 'workflow_execute',
    'reporting_dashboard',
    'ticket_resolve',
    'learning_view'
  ],
  'user_manager': [
    'user_create', 'user_edit', 'user_delete', 'user_view',
    'designation_create', 'designation_edit',
    'reporting_dashboard'
  ],
  'store_manager': [
    'workflow_create', 'workflow_edit', 'workflow_view', 'workflow_execute',
    'reporting_dashboard',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view'
  ],
  'store_employee': [
    'workflow_execute',
    'learning_view'
  ],
  'non_creator_store_employee': [
    'workflow_execute',
    'learning_view'
  ],
  'non_creator_company_admin': [
    'user_create', 'user_edit', 'user_delete', 'user_view',
    'designation_create', 'designation_edit',
    'workflow_view', 'workflow_execute',
    'reporting_dashboard', 'reporting_export',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view'
  ],
  'non_creator_area_manager': [
    'workflow_view', 'workflow_execute',
    'reporting_dashboard', 'reporting_export',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view'
  ],
  'non_creator_store_manager': [
    'workflow_view', 'workflow_execute',
    'reporting_dashboard',
    'ticket_create', 'ticket_resolve',
    'asset_create', 'asset_edit',
    'learning_view'
  ]
};

// Map designation names to Taqtics roles
const DESIGNATION_TO_ROLE_MAP: Record<string, string> = {
  'ops manager': 'area_manager',
  'process manager': 'process_manager',
  'manager': 'store_manager',
  'non creator store manager': 'non_creator_store_manager',
  'user manager': 'user_manager',
  'employee': 'store_employee',
  'store employee': 'store_employee',
  'staff': 'store_employee'
};

export const PermissionProvider = ({ children }: PermissionProviderProps) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasCreatorAccess, setHasCreatorAccess] = useState(false);

  const fetchUserPermissions = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      console.log('Fetching permissions for user:', user.email);
      
      // ADMIN ALWAYS HAS FULL ACCESS - DO NOT CHANGE THIS
      if (user.email === 'admin@gmail.com') {
        console.log('User is admin, giving full access to ALL features');
        // Fetch all features to give admin full access
        const featuresResponse = await fetch('http://localhost:3002/features');
        const features = await featuresResponse.json();
        const allFeatureIds = features.map((f: any) => f.name);
        setPermissions(allFeatureIds);
        setUserRole('company_admin');
        setHasCreatorAccess(true);
        setLoading(false);
        return;
      }
      
      // Get user's designation
      const response = await fetch(`http://localhost:3002/users?email=${user.email}`);
      const data = await response.json();
      
      console.log('User data:', data);
      
      if (data.users && data.users.length > 0) {
        const userProfile = data.users[0];
        console.log('User profile:', userProfile);
        
        if (userProfile.designation) {
          console.log('User designation:', userProfile.designation);
          
          // Get designation details to find the system role mapping
          const designationResponse = await fetch(`http://localhost:3002/designations?name=${userProfile.designation}`);
          const designationData = await designationResponse.json();
          
          console.log('Designation data:', designationData);
          
          if (designationData && designationData.length > 0) {
            const designation = designationData[0];
            console.log('Designation:', designation);
            
            // Get system role mapping
            const mappingResponse = await fetch(`http://localhost:3002/designation-role-mapping/designation/${designation.id}`);
            const mapping = await mappingResponse.json();
            
            console.log('System role mapping:', mapping);
            
            let finalRole = 'store_employee'; // Default role
            let hasCreator = designation.hasCreatorAccess || false;
            
            if (mapping && mapping.systemRole) {
              finalRole = mapping.systemRole.name; // Use the system role name directly
              hasCreator = mapping.systemRole.hasCreatorAccess || hasCreator;
              console.log('Using system role from mapping:', finalRole);
              console.log('System role has creator access:', hasCreator);
            } else {
              console.log('No system role mapping found, using default role');
            }
            
            console.log('Final role:', finalRole);
            setUserRole(finalRole);
            setHasCreatorAccess(hasCreator);
            
            // Fetch permissions from database based on system role
            const permissionsResponse = await fetch(`http://localhost:3002/role-feature-permissions/role/${mapping.systemRole.id}`);
            const permissionsData = await permissionsResponse.json();
            
            console.log('Permissions from database:', permissionsData);
            
            // Extract feature IDs from permissions
            const featureIds = permissionsData.map((p: any) => p.featureId);
            console.log('Feature IDs:', featureIds);
            
            setPermissions(featureIds);
          } else {
            // No designation found - give minimal permissions
            console.log('No designation found, using minimal permissions');
            setPermissions(['workflow_execute', 'learning_view']);
            setUserRole('store_employee');
            setHasCreatorAccess(false);
          }
        } else {
          // No designation - give minimal permissions
          console.log('No designation found, using minimal permissions');
          setPermissions(['workflow_execute', 'learning_view']);
          setUserRole('store_employee');
          setHasCreatorAccess(false);
        }
      } else {
        // User not found - give minimal permissions
        console.log('User not found, using minimal permissions');
        setPermissions(['workflow_execute', 'learning_view']);
        setUserRole('store_employee');
        setHasCreatorAccess(false);
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setPermissions(['workflow_execute', 'learning_view']);
      setUserRole('store_employee');
      setHasCreatorAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshPermissions = async () => {
    setLoading(true);
    await fetchUserPermissions();
  };

  const hasPermission = (featureId: string): boolean => {
    // If no permissions are set, deny access (default deny)
    if (permissions.length === 0) return false;
    return permissions.includes(featureId);
  };

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  return (
    <PermissionContext.Provider value={{ hasPermission, hasCreatorAccess, loading, refreshPermissions, userRole }}>
      {children}
    </PermissionContext.Provider>
  );
};
