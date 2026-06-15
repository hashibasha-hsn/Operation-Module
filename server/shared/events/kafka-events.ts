// Kafka Event Types for Inter-Service Communication

export enum KafkaEventType {
  // Auth Events
  USER_LOGIN = 'auth.user.login',
  USER_VERIFIED = 'auth.user.verified',
  USER_CREATED = 'auth.user.created',
  PASSWORD_SET = 'auth.password.set',
  TOKEN_REFRESHED = 'auth.token.refreshed',
  
  // User Events
  PROFILE_UPDATED = 'user.profile.updated',
  ROLE_ASSIGNED = 'user.role.assigned',
  ROLE_CHANGED = 'user.role.changed',
  SCOPE_CHANGED = 'user.scope.changed',
  
  // Organization Events
  USER_JOINED_ORG = 'org.user.joined',
  USER_LEFT_ORG = 'org.user.left',
  ORG_CREATED = 'org.created',
  REGION_CREATED = 'org.region.created',
  LOCATION_CREATED = 'org.location.created',
  
  // Permission Events
  PERMISSION_GRANTED = 'permission.role.granted',
  PERMISSION_REVOKED = 'permission.role.revoked',
  PERMISSION_CACHE_INVALIDATE = 'permission.cache.invalidate',
  
  // Notification Events
  EMAIL_SEND = 'notification.email.send',
  NOTIFICATION_CREATED = 'notification.created',
}

export interface KafkaEvent {
  eventType: KafkaEventType;
  timestamp: string;
  correlationId?: string;
  data: any;
}

// Auth Events
export interface UserLoginEvent {
  userId: string;
  email: string;
  loginTime: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserVerifiedEvent {
  userId: string;
  email: string;
  verifiedAt: string;
}

export interface UserCreatedEvent {
  userId: string;
  email: string;
  organizationId: string;
}

export interface PasswordSetEvent {
  userId: string;
  email: string;
  setPasswordAt: string;
}

// User Events
export interface RoleAssignedEvent {
  userId: string;
  roleId: string;
  organizationId: string;
  assignedBy: string;
}

export interface ProfileUpdatedEvent {
  userId: string;
  updatedFields: string[];
}

// Organization Events
export interface UserJoinedOrgEvent {
  userId: string;
  organizationId: string;
  roleId: string;
  joinedAt: string;
}

// Notification Events
export interface EmailSendEvent {
  to: string;
  subject: string;
  template: string;
  data: any;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
}
