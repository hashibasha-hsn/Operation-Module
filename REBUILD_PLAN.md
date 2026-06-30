# User Service Rebuild Plan

## Executive Summary
The user service system has a comprehensive frontend implementation but requires significant backend and database alignment to be fully functional. This plan outlines the steps needed to rebuild and complete the system.

## Current State Assessment

### Frontend Status: ✅ COMPLETE
- 8 comprehensive tabs implemented
- All UI components functional
- API integration points defined
- User experience fully designed

### Backend Status: ⚠️ PARTIAL
- Basic CRUD operations working
- Missing 7+ critical endpoints
- Entity-database schema misalignment
- Some relationships commented out

### Database Status: ❌ INCONSISTENT
- Schema uses snake_case naming
- Entities use camelCase naming
- Missing columns for new features
- TypeORM synchronization disabled

## Rebuild Priority Levels

### Priority 1: Database Schema Foundation (CRITICAL)
**Impact**: Without this, nothing else works reliably
**Estimated Time**: 2-3 hours

#### Tasks:
1. **Decide on Naming Convention**
   - Option A: Convert database to camelCase (recommended)
   - Option B: Convert entities to snake_case
   - **Recommendation**: Convert database to camelCase to match modern TypeScript/TypeORM patterns

2. **Update Database Schema**
   ```sql
   -- Add missing columns to user_profiles table
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS userid VARCHAR(255) UNIQUE;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password VARCHAR(255);
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS employeeid VARCHAR(255);
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS countrycode VARCHAR(10);
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS entityid UUID;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS designation VARCHAR(255);
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS manager VARCHAR(255);
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS validemail BOOLEAN DEFAULT false;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS isactive BOOLEAN DEFAULT true;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS isremoved BOOLEAN DEFAULT false;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS storename VARCHAR(255);
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS storeid UUID;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS additionalstores JSONB;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ishybrid BOOLEAN DEFAULT false;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hybridstores JSONB;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tags JSONB;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS processassignments JSONB;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS lastlogin TIMESTAMP;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS createdat TIMESTAMP;
   ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updatedat TIMESTAMP;
   ```

3. **Create Missing Tables**
   ```sql
   -- User tags table
   CREATE TABLE IF NOT EXISTS user_tags (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name VARCHAR(255) NOT NULL,
       values TEXT,
       ismandatory BOOLEAN DEFAULT false,
       isactive BOOLEAN DEFAULT true,
       organizationid UUID NOT NULL,
       createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- User teams table
   CREATE TABLE IF NOT EXISTS user_teams (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name VARCHAR(255) NOT NULL,
       isactive BOOLEAN DEFAULT true,
       organizationid UUID NOT NULL,
       createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Team members junction table
   CREATE TABLE IF NOT EXISTS team_members (
       teamid UUID NOT NULL,
       userid UUID NOT NULL,
       PRIMARY KEY (teamid, userid),
       FOREIGN KEY (teamid) REFERENCES user_teams(id) ON DELETE CASCADE,
       FOREIGN KEY (userid) REFERENCES user_profiles(id) ON DELETE CASCADE
   );

   -- Designation role mapping table
   CREATE TABLE IF NOT EXISTS designation_role_mapping (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       designationid UUID NOT NULL,
       systemroleid UUID NOT NULL,
       organizationid UUID NOT NULL,
       mappedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       UNIQUE(designationid, organizationid)
   );

   -- Role feature permissions table
   CREATE TABLE IF NOT EXISTS role_feature_permissions (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       roleid UUID NOT NULL,
       featureid UUID NOT NULL,
       permissionlevel VARCHAR(20) NOT NULL,
       grantedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       UNIQUE(roleid, featureid)
   );
   ```

4. **Enable TypeORM Synchronization**
   - Set `synchronize: true` in app.module.ts
   - Test synchronization
   - Monitor for conflicts

### Priority 2: Missing Backend Endpoints (HIGH)
**Impact**: Frontend features will not work without these
**Estimated Time**: 3-4 hours

#### Tasks:

1. **Toggle Valid Email Endpoint**
   ```typescript
   // users.controller.ts
   @Post(':id/toggle-valid-email')
   async toggleValidEmail(@Param('id') id: string) {
     return this.usersService.toggleValidEmail(id);
   }

   // users.service.ts
   async toggleValidEmail(id: string) {
     const user = await this.userProfileRepository.findOne({ where: { userId: id } });
     if (!user) {
       throw new Error('User not found');
     }
     user.validEmail = !user.validEmail;
     await this.userProfileRepository.save(user);
     return user;
   }
   ```

2. **Bulk User Creation Endpoint**
   ```typescript
   // users.controller.ts
   @Post('bulk')
   async bulkCreate(@Body() bulkData: { users: any[] }) {
     return this.usersService.bulkCreate(bulkData.users);
   }

   // users.service.ts
   async bulkCreate(usersData: any[]) {
     const users = this.userProfileRepository.create(usersData);
     const savedUsers = await this.userProfileRepository.save(users);
     return savedUsers;
   }
   ```

3. **Advance Mapping Endpoints**
   ```typescript
   // users.controller.ts
   @Put(':id/advance-mapping')
   async updateAdvanceMapping(@Param('id') id: string, @Body() data: { additionalStores: string[] }) {
     return this.usersService.updateAdvanceMapping(id, data.additionalStores);
   }

   // users.service.ts
   async updateAdvanceMapping(id: string, additionalStores: string[]) {
     await this.userProfileRepository.update({ userId: id }, { additionalStores });
     return this.findOne(id);
   }
   ```

4. **Hybrid Assignee Endpoints**
   ```typescript
   // users.controller.ts
   @Put(':id/hybrid')
   async updateHybrid(@Param('id') id: string, @Body() data: { isHybrid: boolean; hybridStores: string[] }) {
     return this.usersService.updateHybrid(id, data);
   }

   // users.service.ts
   async updateHybrid(id: string, data: { isHybrid: boolean; hybridStores: string[] }) {
     await this.userProfileRepository.update({ userId: id }, data);
     return this.findOne(id);
   }
   ```

5. **Removed Users Endpoints**
   ```typescript
   // users.controller.ts
   @Get('removed')
   async getRemovedUsers() {
     return this.usersService.getRemovedUsers();
   }

   @Post('removed/:userId/restore')
   async restoreUser(@Param('userId') userId: string) {
     return this.usersService.restoreUser(userId);
   }

   // users.service.ts
   async getRemovedUsers() {
     return this.userProfileRepository.find({ where: { isRemoved: true } });
   }

   async restoreUser(userId: string) {
     await this.userProfileRepository.update({ userId }, { isRemoved: false, isActive: true });
     return this.findOne(userId);
   }
   ```

6. **Delete Permission Endpoint**
   ```typescript
   // role-feature-permissions.controller.ts
   @Delete(':roleId/:featureId')
   async removePermission(@Param('roleId') roleId: string, @Param('featureId') featureId: string) {
     return this.roleFeaturePermissionsService.remove(roleId, featureId);
   }
   ```

### Priority 3: Team Members Relationship (MEDIUM)
**Impact**: Team management will not work properly
**Estimated Time**: 1-2 hours

#### Tasks:

1. **Uncomment and Fix Relationship**
   ```typescript
   // user-team.entity.ts
   @ManyToMany(() => UserProfile)
   @JoinTable({
     name: 'team_members',
     joinColumn: { name: 'teamid', referencedColumnName: 'id' },
     inverseJoinColumn: { name: 'userid', referencedColumnName: 'id' },
   })
   members: UserProfile[];
   ```

2. **Implement Team Member Endpoints**
   ```typescript
   // user-teams.controller.ts
   @Post(':id/members')
   async addMember(@Param('id') id: string, @Body('userId') userId: string) {
     return this.userTeamsService.addMember(id, userId);
   }

   @Delete(':id/members/:userId')
   async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
     return this.userTeamsService.removeMember(id, userId);
   }
   ```

3. **Implement Service Methods**
   ```typescript
   // user-teams.service.ts
   async addMember(teamId: string, userId: string) {
     const team = await this.userTeamRepository.findOne({ 
       where: { id: teamId },
       relations: ['members']
     });
     const user = await this.userProfileRepository.findOne({ where: { userId } });
     if (team && user) {
       team.members = team.members || [];
       team.members.push(user);
       return this.userTeamRepository.save(team);
     }
   }

   async removeMember(teamId: string, userId: string) {
     const team = await this.userTeamRepository.findOne({ 
       where: { id: teamId },
       relations: ['members']
     });
     if (team) {
       team.members = team.members.filter(m => m.userId !== userId);
       return this.userTeamRepository.save(team);
     }
   }
   ```

### Priority 4: API Consistency (LOW)
**Impact**: Inconsistent API routing
**Estimated Time**: 1 hour

#### Tasks:

1. **Decide on API Routing Strategy**
   - Option A: All calls go through API Gateway (recommended for microservices)
   - Option B: Direct service calls
   - **Recommendation**: Use API Gateway for external calls, direct for internal

2. **Update Frontend API Calls**
   - Standardize on API Gateway for user tags
   - Update endpoint URLs to be consistent
   - Add error handling for API failures

### Priority 5: Data Model Cleanup (LOW)
**Impact**: Cleaner code, better performance
**Estimated Time**: 1-2 hours

#### Tasks:

1. **Remove Unused Entity Fields**
   - Remove fields that don't exist in database
   - Or add missing columns to database
   - Ensure consistency

2. **Add Proper Indexes**
   ```sql
   CREATE INDEX idx_user_profiles_userid ON user_profiles(userid);
   CREATE INDEX idx_user_profiles_entityid ON user_profiles(entityid);
   CREATE INDEX idx_user_profiles_isactive ON user_profiles(isactive);
   CREATE INDEX idx_user_profiles_isremoved ON user_profiles(isremoved);
   ```

3. **Add Foreign Key Constraints**
   ```sql
   ALTER TABLE user_profiles ADD CONSTRAINT fk_entity 
   FOREIGN KEY (entityid) REFERENCES entities(id) ON DELETE SET NULL;
   ```

## Implementation Order

### Phase 1: Foundation (Day 1)
1. Database schema updates
2. Enable TypeORM synchronization
3. Test basic CRUD operations

### Phase 2: Core Features (Day 2)
1. Toggle valid email endpoint
2. Bulk user creation endpoint
3. Advance mapping endpoints
4. Hybrid assignee endpoints

### Phase 3: Advanced Features (Day 3)
1. Removed users endpoints
2. Team members relationship
3. Permission management endpoints

### Phase 4: Polish (Day 4)
1. API consistency
2. Data model cleanup
3. Testing and validation

## Testing Strategy

### Unit Tests
- Test each new endpoint
- Test database operations
- Test entity relationships

### Integration Tests
- Test frontend-backend integration
- Test API gateway routing
- Test end-to-end user flows

### Manual Testing Checklist
- [ ] Create user
- [ ] Edit user
- [ ] Delete user
- [ ] Toggle user status
- [ ] Toggle valid email
- [ ] Bulk upload users
- [ ] Create designation
- [ ] Edit designation
- [ ] Delete designation
- [ ] Create team
- [ ] Add team members
- [ ] Remove team members
- [ ] Create user tag
- [ ] Edit user tag
- [ ] Delete user tag
- [ ] Configure advance mapping
- [ ] Configure hybrid assignee
- [ ] Remove user
- [ ] Restore user

## Rollback Plan

If anything goes wrong:
1. Disable TypeORM synchronization
2. Revert database changes using backup
3. Revert code changes using git
4. Restore previous working state

## Success Criteria

- [ ] All 8 frontend tabs fully functional
- [ ] All backend endpoints implemented and tested
- [ ] Database schema aligned with entities
- [ ] TypeORM synchronization enabled without errors
- [ ] No console errors in frontend or backend
- [ ] All user flows working end-to-end

## Estimated Total Time: 8-12 hours

## Next Steps

1. Review this plan with stakeholders
2. Get approval for database changes
3. Create database backup
4. Start with Priority 1 tasks
5. Test after each phase
6. Deploy to staging environment
7. Final testing and validation
