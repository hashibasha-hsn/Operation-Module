// Shared DTOs for Microservices

// User DTOs
export interface UserDTO {
  id: string;
  email: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'DUMMY';
  isActive: boolean;
  createdAt: string;
}

export interface UserProfileDTO {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

// Role DTOs (Taqtics-style)
export enum RoleName {
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  AREA_MANAGER = 'AREA_MANAGER',
  PROCESS_MANAGER = 'PROCESS_MANAGER',
  USER_MANAGER = 'USER_MANAGER',
  STORE_MANAGER = 'STORE_MANAGER',
  STORE_EMPLOYEE = 'STORE_EMPLOYEE'
}

export enum ScopeLevel {
  ORG_WIDE = 'ORG_WIDE',
  REGIONAL = 'REGIONAL',
  PROCESS_SPECIFIC = 'PROCESS_SPECIFIC',
  USER_OVERSIGHT = 'USER_OVERSIGHT',
  STORE_LEVEL = 'STORE_LEVEL',
  TASK_LEVEL = 'TASK_LEVEL'
}

export interface RoleDTO {
  id: string;
  name: RoleName;
  displayName: string;
  hierarchyLevel: number;
  scopeLevel: ScopeLevel;
  isCreator: boolean;
  parentRoleId?: string;
  description?: string;
}

export interface PermissionDTO {
  id: string;
  name: string;
  category: string;
  description?: string;
}

// Organization DTOs
export interface OrganizationDTO {
  id: string;
  name: string;
  subdomain: string;
  logoUrl?: string;
  settings: any;
  isActive: boolean;
}

export interface RegionDTO {
  id: string;
  orgId: string;
  name: string;
  code?: string;
  parentRegionId?: string;
}

export interface LocationDTO {
  id: string;
  orgId: string;
  regionId?: string;
  name: string;
  code?: string;
  address?: string;
  locationType: string;
}

// Auth DTOs
export interface LoginRequestDTO {
  email: string;
  password?: string;
  organizationSubdomain?: string;
}

export interface LoginResponseDTO {
  success: boolean;
  user?: UserDTO;
  token?: string;
  refreshToken?: string;
  requiresPasswordSetup?: boolean;
  message?: string;
}

export interface EmailVerificationRequestDTO {
  email: string;
  organizationSubdomain?: string;
}

export interface EmailVerificationResponseDTO {
  success: boolean;
  requiresVerification: boolean;
  message?: string;
}

// Notification DTOs
export interface NotificationDTO {
  id: string;
  userId: string;
  type: string;
  title: string;
  content?: string;
  data?: any;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
}
