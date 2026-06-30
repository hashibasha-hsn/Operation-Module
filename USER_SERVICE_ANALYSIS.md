# User Service System Analysis

## Overview
Comprehensive analysis of the user service system including frontend, backend, and database components.

## Frontend Analysis (Users.tsx - 2694 lines)

### Current Features Implemented

#### 1. Users Tab
- **User CRUD Operations**: Create, Read, Update, Delete users
- **Stats Display**: Total users, active users, inactive users, valid emails count
- **Search & Filter**: Search by name/email, filter by valid email status, sorting options
- **Bulk Upload**: Excel/CSV file upload for bulk user creation
- **Column Customization**: Toggle visibility of table columns
- **Toggle Features**: 
  - Toggle user status (active/inactive)
  - Toggle valid email status
- **Export**: Export user data to Excel
- **User Fields**: name, email, designation, manager, entityId, storeName, createdAt, lastLogin, validEmail, status

#### 2. Designation Tab
- **Designation CRUD**: Create, Edit, Delete designations
- **Reporting Hierarchy**: Set reporting designation (parent-child relationship)
- **System Role Mapping**: Map designations to system roles
- **Creator Access**: Toggle creator access for workflow creation
- **Feature Permissions**: Configure feature access per designation
- **Designation Fields**: name, reportingDesignation, systemRole, hasCreatorAccess

#### 3. Team Tab
- **Team CRUD**: Create user teams
- **Member Management**: Add/remove users from teams
- **Team Fields**: name, members, status

#### 4. User Hierarchy Tab
- **Hierarchy Display**: Show user reporting structure
- **User Details**: Display selected user information
- **Store Coverage**: Show stores under user's coverage

#### 5. Advance Mapping Tab
- **Additional Stores**: Give users report access to additional stores
- **Mapping Interface**: Select additional stores for report access
- **User Fields**: name, email, designation, default stores, additional stores

#### 6. Removed User Tab
- **View Removed Users**: Display soft-deleted users
- **Restore Function**: Restore removed users back to active state
- **User Fields**: name, email, designation, entityId, removedAt

#### 7. User Tags Tab
- **Tag CRUD**: Create, Edit, Delete user tags
- **Tag Values**: Define predefined values for tags
- **Mandatory Tags**: Set tags as mandatory during user creation
- **Tag Fields**: name, values, mandatory

#### 8. Hybrid Assignee Tab
- **Hybrid Profile**: Enable hybrid users who work across multiple stores
- **Hybrid Stores**: Select multiple stores for hybrid users
- **User Fields**: name, email, designation, default store, hybrid status, hybrid stores

### Frontend API Endpoints Used

#### User Service (localhost:3002)
- `GET /users` - Fetch all users
- `GET /users/:id` - Fetch single user
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /users/stats/overview` - Get user statistics
- `POST /users/:id/toggle-status` - Toggle user active status
- `POST /users/:id/toggle-valid-email` - Toggle valid email status
- `POST /users/bulk` - Bulk user creation
- `PUT /users/:id/advance-mapping` - Update additional stores
- `PUT /users/:id/hybrid` - Update hybrid settings
- `GET /users/removed` - Fetch removed users
- `POST /users/removed/:userId/restore` - Restore removed user
- `GET /designations` - Fetch designations
- `POST /designations` - Create designation
- `PUT /designations/:id` - Update designation
- `DELETE /designations/:id` - Delete designation
- `GET /designation-role-mapping/designation/:id` - Get role mapping
- `POST /designation-role-mapping` - Create role mapping
- `DELETE /designation-role-mapping/designation/:id` - Delete role mapping
- `GET /features` - Fetch features
- `GET /role-feature-permissions/role/:id` - Get role permissions
- `POST /role-feature-permissions` - Create permission
- `DELETE /role-feature-permissions/:roleId/:featureId` - Delete permission
- `GET /user-teams` - Fetch user teams
- `POST /user-teams` - Create user team
- `GET /user-tags` - Fetch user tags
- `POST /user-tags` - Create user tag
- `PUT /user-tags/:id` - Update user tag
- `DELETE /user-tags/:id` - Delete user tag

#### API Gateway (localhost:3009)
- `GET /api/org/entities` - Fetch entities/stores
- `GET /api/user/user-tags` - Fetch user tags
- `GET /api/user/system-roles` - Fetch system roles
- `POST /api/user/user-tags` - Create user tag
- `PUT /api/user/user-tags/:id` - Update user tag
- `DELETE /api/user/user-tags/:id` - Delete user tag
- `POST /api/auth/users` - Create user in auth service
- `DELETE /api/auth/users/:id` - Delete user from auth service

## Backend Analysis

### Controllers Implemented

#### 1. UsersController
- GET /users - Find all users with pagination and search
- GET /users/:id - Find single user
- POST /users - Create user
- PUT /users/:id - Update user
- DELETE /users/:id - Delete user
- GET /users/stats/overview - Get statistics
- POST /users/:id/toggle-status - Toggle user status

#### 2. ProfilesController
- POST /profiles - Create profile
- GET /profiles/user/:userId - Find by user ID
- PUT /profiles/user/:userId - Update profile
- DELETE /profiles/user/:userId - Delete profile

#### 3. DesignationsController
- POST /designations - Create designation
- GET /designations - Find all by organization
- GET /designations/:id - Find single designation
- PUT /designations/:id - Update designation
- DELETE /designations/:id - Delete designation
- GET /designations/reporting/:id - Find by reporting designation

#### 4. UserTeamsController
- GET /user-teams - Find all teams
- GET /user-teams/:id - Find single team
- POST /user-teams - Create team
- PUT /user-teams/:id - Update team
- DELETE /user-teams/:id - Delete team
- POST /user-teams/:id/members - Add member
- DELETE /user-teams/:id/members/:userId - Remove member

#### 5. UserTagsController
- GET /user-tags - Find all tags
- GET /user-tags/:id - Find single tag
- POST /user-tags - Create tag
- PUT /user-tags/:id - Update tag
- DELETE /user-tags/:id - Delete tag

#### 6. FeaturesController
- POST /features - Create feature
- GET /features - Find all features
- GET /features/:id - Find single feature
- GET /features/category/:category - Find by category
- PUT /features/:id - Update feature
- DELETE /features/:id - Delete feature

### Entities Implemented

#### 1. UserProfile Entity
- **Table**: user_profiles
- **Fields**: 
  - id (UUID, primary)
  - userId (UUID, unique, NOT NULL)
  - name (string, NOT NULL)
  - email (string, nullable)
  - password (string, nullable)
  - employeeId (string, nullable)
  - phone (string, nullable)
  - countryCode (string, nullable)
  - entityId (UUID, nullable)
  - designation (string, nullable)
  - manager (string, nullable)
  - validEmail (boolean, default false)
  - isActive (boolean, default true)
  - isRemoved (boolean, default false)
  - storeName (string, nullable)
  - storeId (UUID, nullable)
  - additionalStores (JSONB, nullable)
  - isHybrid (boolean, default false)
  - hybridStores (JSONB, nullable)
  - tags (JSONB, nullable)
  - processAssignments (JSONB, nullable)
  - lastLogin (timestamp, nullable)
  - createdAt (timestamp, nullable)
  - updatedAt (timestamp, nullable)

#### 2. Designation Entity
- **Table**: designations
- **Fields**:
  - id (UUID, primary)
  - name (string, NOT NULL)
  - description (text, nullable)
  - reportingDesignationId (UUID, nullable, self-reference)
  - organizationId (UUID, NOT NULL)
  - isActive (boolean, default true)
  - hasCreatorAccess (boolean, default false)
  - createdAt (timestamp)
  - updatedAt (timestamp)
  - **Relations**: Many-to-one self-reference for reporting hierarchy

#### 3. UserTeam Entity
- **Table**: user_teams
- **Fields**:
  - id (UUID, primary)
  - name (string, NOT NULL)
  - isActive (boolean, default true)
  - organizationId (UUID, NOT NULL)
  - createdAt (timestamp)
  - updatedAt (timestamp)
  - **Note**: Many-to-many relationship with UserProfile is commented out

#### 4. UserTag Entity
- **Table**: user_tags
- **Fields**:
  - id (UUID, primary)
  - name (string, NOT NULL)
  - values (text, nullable)
  - isMandatory (boolean, default false)
  - isActive (boolean, default true)
  - organizationId (UUID, NOT NULL)
  - createdAt (timestamp)
  - updatedAt (timestamp)

### Database Schema Analysis

#### Current Database Schema (user-schema.sql)
- **user_profiles table**: Basic user profile fields (first_name, last_name, phone, avatar_url, etc.)
- **roles table**: Taqtics-style hierarchy with hierarchy_level, scope_level, is_creator
- **permissions table**: Granular permissions with category
- **role_permissions table**: Many-to-many mapping between roles and permissions
- **org_memberships table**: User-organization-role memberships

#### Designation Schema (designation-schema.sql)
- **designations table**: Custom job titles with reporting hierarchy
- **system_roles table**: Pre-defined roles (company_admin, area_manager, store_manager, etc.)
- **features table**: System features (workflow_create, user_edit, reporting_dashboard, etc.)
- **role_feature_permissions table**: Map system roles to features with permission levels
- **designation_role_mapping table**: Map custom designations to system roles
- **user_designations table**: Assign users to designations

#### Default Data Seeded
- **System Roles**: company_admin, area_manager, process_manager, user_manager, store_manager, store_employee
- **Features**: workflow_create, user_edit, reporting_dashboard, asset_create, ticket_create, etc.
- **Default Permissions**: Pre-configured permissions for each role type

## Issues Identified

### 1. Schema Mismatch
- **Problem**: Database schema uses snake_case (user_id, employee_id, created_at) but entities use camelCase (userId, employeeId, createdAt)
- **Impact**: TypeORM synchronization issues, column name mismatches
- **Current Fix**: Added `name` parameter to column decorators, disabled synchronization

### 2. Missing Backend Endpoints
- **Problem**: Frontend expects endpoints that don't exist in backend
- **Missing Endpoints**:
  - `POST /users/:id/toggle-valid-email` - Toggle valid email
  - `POST /users/bulk` - Bulk user creation
  - `PUT /users/:id/advance-mapping` - Update additional stores
  - `PUT /users/:id/hybrid` - Update hybrid settings
  - `GET /users/removed` - Fetch removed users
  - `POST /users/removed/:userId/restore` - Restore removed user
  - `DELETE /role-feature-permissions/:roleId/:featureId` - Delete permission

### 3. Entity-Database Mismatch
- **Problem**: UserProfile entity has fields that don't exist in database schema
- **Missing Database Columns**: storeName, storeId, additionalStores, isHybrid, hybridStores, tags, processAssignments, lastLogin
- **Database Columns Not in Entity**: first_name, last_name, avatar_url, date_of_birth, address, city, country, timezone, language

### 4. Team Members Relationship
- **Problem**: Many-to-many relationship between UserTeam and UserProfile is commented out
- **Impact**: Cannot properly manage team members
- **Reason**: Schema synchronization issues with team_members table

### 5. User Tags Location
- **Problem**: Frontend calls user tags from API Gateway (localhost:3009) but backend has user-tags controller
- **Impact**: Inconsistent API routing
- **Current State**: Frontend uses API gateway for user tags, backend has separate controller

## Current System Status

### Working Features
- ✅ User CRUD operations
- ✅ Designation CRUD operations
- ✅ User statistics with correct active/inactive counts
- ✅ Toggle user status
- ✅ Store name display (fixed to show actual entity name)
- ✅ Column customization
- ✅ Export functionality
- ✅ Frontend UI for all 8 tabs

### Partially Working Features
- ⚠️ User tags (frontend calls API gateway, backend exists separately)
- ⚠️ Team management (relationship commented out)
- ⚠️ Advance mapping (endpoint missing)
- ⚠️ Hybrid assignee (endpoint missing)
- ⚠️ Removed users (endpoints missing)

### Missing Features
- ❌ Toggle valid email endpoint
- ❌ Bulk user upload endpoint
- ❌ Advance mapping endpoints
- ❌ Hybrid assignee endpoints
- ❌ Removed users endpoints
- ❌ Team member management endpoints
- ❌ Proper database schema alignment

## Recommendations for Rebuild

### Priority 1: Database Schema Alignment
1. Decide on naming convention (snake_case vs camelCase)
2. Update database schema to match entity fields
3. Add missing columns to user_profiles table
4. Enable TypeORM synchronization with proper schema

### Priority 2: Missing Backend Endpoints
1. Implement toggle valid email endpoint
2. Implement bulk user creation endpoint
3. Implement advance mapping endpoints
4. Implement hybrid assignee endpoints
5. Implement removed users endpoints
6. Fix team member relationship and endpoints

### Priority 3: API Consistency
1. Decide on API routing (direct to services vs through gateway)
2. Standardize endpoint patterns
3. Update frontend to use consistent API calls

### Priority 4: Data Model Consistency
1. Align entity fields with database columns
2. Remove unused fields or add missing columns
3. Ensure proper relationships between entities
4. Add proper indexes and constraints

## Conclusion

The user service system has a comprehensive frontend implementation with 8 major tabs covering user management, designations, teams, hierarchy, advance mapping, removed users, user tags, and hybrid assignees. The backend has basic CRUD operations but is missing several endpoints that the frontend expects. The database schema has significant mismatches with the entity definitions, causing synchronization issues.

The system is partially functional but needs database schema alignment and missing endpoint implementation to be fully operational.
