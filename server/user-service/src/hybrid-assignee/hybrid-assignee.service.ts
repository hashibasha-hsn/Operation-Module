import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { HybridAssigneeProfile } from './hybrid-assignee-profile.entity';
import {
  HYBRID_ASSIGNMENT_TYPES,
  HybridAssigneeAssignment,
} from './hybrid-assignee-assignment.entity';
import { HybridAssigneeStore } from './hybrid-assignee-store.entity';
import { UserProfile } from '../profiles/user-profile.entity';

export const MAX_HYBRID_PROFILES = 15;

export interface HybridAssignmentDto {
  userId: string;
  storeId: string;
  assignmentType: string;
  designation?: string | null;
}

export interface HybridAssigneeProfileDto {
  name: string;
  description?: string;
  organizationId: string;
}

export interface SaveHybridProfileDto {
  name?: string;
  description?: string;
  assignments?: HybridAssignmentDto[];
}

@Injectable()
export class HybridAssigneeService {
  constructor(
    @InjectRepository(HybridAssigneeProfile)
    private readonly profileRepository: Repository<HybridAssigneeProfile>,
    @InjectRepository(HybridAssigneeAssignment)
    private readonly assignmentRepository: Repository<HybridAssigneeAssignment>,
    @InjectRepository(HybridAssigneeStore)
    private readonly storeRepository: Repository<HybridAssigneeStore>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
  ) {}

  private summarizeAssignments(assignments: HybridAssigneeAssignment[]) {
    const userIds = [...new Set(assignments.map((row) => row.userId).filter(Boolean))];
    const storeIds = [...new Set(assignments.map((row) => row.storeId).filter(Boolean))];

    return {
      userIds,
      storeIds,
      userCount: userIds.length,
      storeCount: storeIds.length,
      bulkAssignments: assignments.filter((row) => row.assignmentType === HYBRID_ASSIGNMENT_TYPES.BULK).length,
      designationAssignments: assignments.filter(
        (row) => row.assignmentType === HYBRID_ASSIGNMENT_TYPES.DESIGNATION,
      ).length,
      commonAssignments: assignments.filter(
        (row) => row.assignmentType === HYBRID_ASSIGNMENT_TYPES.COMMON,
      ).length,
      individualAssignments: assignments.filter(
        (row) => row.assignmentType === HYBRID_ASSIGNMENT_TYPES.INDIVIDUAL,
      ).length,
    };
  }

  private async attachProfileDetails(profile: HybridAssigneeProfile) {
    const assignments = await this.assignmentRepository.find({
      where: { profileId: profile.id },
      order: { createdAt: 'ASC' },
    });
    const summary = this.summarizeAssignments(assignments);

    return {
      ...profile,
      ...summary,
      assignments,
    };
  }

  private async syncUserHybridFlags(userIds: string[]) {
    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueUserIds.length === 0) {
      return;
    }

    for (const userId of uniqueUserIds) {
      const assignments = await this.assignmentRepository.find({ where: { userId } });
      const storeIds = [...new Set(assignments.map((row) => row.storeId).filter(Boolean))];

      await this.userProfileRepository.update(
        { userId },
        {
          isHybrid: assignments.length > 0,
          hybridStores: storeIds,
        },
      );
    }
  }

  private async replaceAssignments(
    profileId: string,
    assignments: HybridAssignmentDto[] = [],
    previousUserIds: string[] = [],
  ) {
    const uniqueRows = new Map<string, HybridAssignmentDto>();

    for (const row of assignments) {
      if (!row.userId || !row.storeId || !row.assignmentType) {
        continue;
      }

      const key = `${row.userId}:${row.storeId}:${row.assignmentType}`;
      uniqueRows.set(key, {
        userId: row.userId,
        storeId: row.storeId,
        assignmentType: row.assignmentType,
        designation: row.designation || null,
      });
    }

    await this.assignmentRepository.delete({ profileId });

    if (uniqueRows.size > 0) {
      await this.assignmentRepository.save(
        [...uniqueRows.values()].map((row) =>
          this.assignmentRepository.create({
            profileId,
            ...row,
          }),
        ),
      );
    }

    const nextUserIds = [...uniqueRows.values()].map((row) => row.userId);
    await this.syncUserHybridFlags([...new Set([...previousUserIds, ...nextUserIds])]);
  }

  private buildCellKey(storeId: string, profileId: string) {
    return `${storeId}:${profileId}`;
  }

  async getDashboard(organizationId: string) {
    const profiles = await this.profileRepository.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });
    const storeRows = await this.storeRepository.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });
    const profileIds = profiles.map((profile) => profile.id);

    const assignments =
      profileIds.length === 0
        ? []
        : await this.assignmentRepository.find({
            where: { profileId: In(profileIds) },
          });

    const cells: Record<string, string[]> = {};
    const assignedUserIds = new Set<string>();

    for (const assignment of assignments) {
      if (
        !assignment.storeId ||
        !assignment.userId ||
        assignment.assignmentType !== HYBRID_ASSIGNMENT_TYPES.INDIVIDUAL
      ) {
        continue;
      }

      const key = this.buildCellKey(assignment.storeId, assignment.profileId);
      if (!cells[key]) {
        cells[key] = [];
      }
      if (!cells[key].includes(assignment.userId)) {
        cells[key].push(assignment.userId);
        assignedUserIds.add(assignment.userId);
      }
    }

    return {
      stats: {
        activeStores: storeRows.length,
        profileCount: profiles.length,
        maxProfiles: MAX_HYBRID_PROFILES,
        totalAssignments: assignedUserIds.size,
      },
      stores: storeRows.map((row) => ({ storeId: row.storeId })),
      profiles: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        isPublished: profile.isPublished,
      })),
      cells,
    };
  }

  async addStores(organizationId: string, storeIds: string[]) {
    const uniqueStoreIds = [...new Set(storeIds.filter(Boolean))];
    if (uniqueStoreIds.length === 0) {
      return this.getDashboard(organizationId);
    }

    const existing = await this.storeRepository.find({ where: { organizationId } });
    const existingIds = new Set(existing.map((row) => row.storeId));
    const toAdd = uniqueStoreIds.filter((storeId) => !existingIds.has(storeId));

    if (toAdd.length > 0) {
      await this.storeRepository.save(
        toAdd.map((storeId) =>
          this.storeRepository.create({
            organizationId,
            storeId,
          }),
        ),
      );
    }

    return this.getDashboard(organizationId);
  }

  async removeStore(organizationId: string, storeId: string) {
    await this.storeRepository.delete({ organizationId, storeId });

    const profiles = await this.profileRepository.find({ where: { organizationId } });
    const profileIds = profiles.map((profile) => profile.id);
    if (profileIds.length > 0) {
      const affectedAssignments = await this.assignmentRepository.find({
        where: { profileId: In(profileIds), storeId },
      });
      const affectedUserIds = affectedAssignments.map((row) => row.userId).filter(Boolean);
      await this.assignmentRepository.delete({ storeId, profileId: In(profileIds) });
      await this.syncUserHybridFlags(affectedUserIds);
    }

    return this.getDashboard(organizationId);
  }

  async updateCell(profileId: string, storeId: string, userIds: string[]) {
    const existing = await this.findOne(profileId);
    if (!existing) {
      return null;
    }

    const previousUserIds = (existing.assignments || [])
      .filter(
        (row) =>
          row.storeId === storeId && row.assignmentType === HYBRID_ASSIGNMENT_TYPES.INDIVIDUAL,
      )
      .map((row) => row.userId)
      .filter(Boolean);

    await this.assignmentRepository.delete({
      profileId,
      storeId,
      assignmentType: HYBRID_ASSIGNMENT_TYPES.INDIVIDUAL,
    });

    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueUserIds.length > 0) {
      await this.assignmentRepository.save(
        uniqueUserIds.map((userId) =>
          this.assignmentRepository.create({
            profileId,
            storeId,
            userId,
            assignmentType: HYBRID_ASSIGNMENT_TYPES.INDIVIDUAL,
          }),
        ),
      );
    }

    await this.syncUserHybridFlags([...new Set([...previousUserIds, ...uniqueUserIds])]);
    return this.getDashboard(existing.organizationId);
  }

  async renameProfile(id: string, name: string) {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }

    await this.profileRepository.update(id, { name: name.trim() });
    return this.findOne(id);
  }

  async findAll(organizationId: string) {
    const profiles = await this.profileRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(profiles.map((profile) => this.attachProfileDetails(profile)));
  }

  async findOne(id: string) {
    const profile = await this.profileRepository.findOne({ where: { id } });
    if (!profile) {
      return null;
    }

    return this.attachProfileDetails(profile);
  }

  async create(dto: HybridAssigneeProfileDto) {
    const existingCount = await this.profileRepository.count({
      where: { organizationId: dto.organizationId },
    });
    if (existingCount >= MAX_HYBRID_PROFILES) {
      throw new BadRequestException(`Maximum of ${MAX_HYBRID_PROFILES} hybrid profiles allowed`);
    }

    const profile = await this.profileRepository.save(
      this.profileRepository.create({
        name: dto.name.trim(),
        description: dto.description || null,
        organizationId: dto.organizationId,
        isActive: true,
        isPublished: false,
      }),
    );

    return this.findOne(profile.id);
  }

  async saveProfile(id: string, dto: SaveHybridProfileDto) {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }

    if (dto.name?.trim()) {
      await this.profileRepository.update(id, {
        name: dto.name.trim(),
        description: dto.description ?? existing.description,
      });
    }

    if (dto.assignments !== undefined) {
      await this.replaceAssignments(id, dto.assignments, existing.userIds || []);
    }
    return this.findOne(id);
  }

  async publish(id: string) {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }

    await this.profileRepository.update(id, {
      isPublished: true,
      isActive: true,
    });

    return this.findOne(id);
  }

  async copy(id: string) {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }

    const existingCount = await this.profileRepository.count({
      where: { organizationId: existing.organizationId },
    });
    if (existingCount >= MAX_HYBRID_PROFILES) {
      throw new BadRequestException(`Maximum of ${MAX_HYBRID_PROFILES} hybrid profiles allowed`);
    }

    const copiedProfile = await this.profileRepository.save(
      this.profileRepository.create({
        name: `${existing.name} (Copy)`,
        description: existing.description,
        organizationId: existing.organizationId,
        isActive: true,
        isPublished: false,
      }),
    );

    const copiedAssignments = (existing.assignments || []).map((row) => ({
      userId: row.userId,
      storeId: row.storeId,
      assignmentType: row.assignmentType,
      designation: row.designation,
    }));

    await this.replaceAssignments(copiedProfile.id, copiedAssignments, []);
    return this.findOne(copiedProfile.id);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    if (!existing) {
      return { message: 'Profile not found' };
    }

    const affectedUserIds = existing.userIds || [];
    await this.assignmentRepository.delete({ profileId: id });
    await this.profileRepository.delete(id);
    await this.syncUserHybridFlags(affectedUserIds);

    return { message: 'Hybrid assignee profile deleted successfully' };
  }

  async findUsersForStoreAndType(
    storeId: string,
    assignmentType: string,
    organizationId: string,
  ) {
    const profiles = await this.profileRepository.find({
      where: { organizationId, isActive: true, isPublished: true },
    });
    const profileIds = profiles.map((profile) => profile.id);

    if (profileIds.length === 0) {
      return [];
    }

    const assignments = await this.assignmentRepository.find({
      where: {
        profileId: In(profileIds),
        storeId,
        assignmentType,
      },
    });

    const userIds = [...new Set(assignments.map((row) => row.userId).filter(Boolean))];
    if (userIds.length === 0) {
      return [];
    }

    return this.userProfileRepository.find({
      where: { userId: In(userIds), isRemoved: false, isActive: true },
    });
  }
}
