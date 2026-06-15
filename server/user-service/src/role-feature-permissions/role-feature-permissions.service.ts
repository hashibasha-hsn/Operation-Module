import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleFeaturePermission } from './role-feature-permission.entity';

@Injectable()
export class RoleFeaturePermissionsService {
  constructor(
    @InjectRepository(RoleFeaturePermission)
    private roleFeaturePermissionsRepository: Repository<RoleFeaturePermission>,
  ) {}

  async create(permissionData: Partial<RoleFeaturePermission>): Promise<RoleFeaturePermission> {
    const permission = this.roleFeaturePermissionsRepository.create(permissionData);
    return await this.roleFeaturePermissionsRepository.save(permission);
  }

  async findAll(): Promise<RoleFeaturePermission[]> {
    return await this.roleFeaturePermissionsRepository.find({
      relations: ['role', 'feature'],
    });
  }

  async findByRoleId(roleId: string): Promise<RoleFeaturePermission[]> {
    return await this.roleFeaturePermissionsRepository.find({
      where: { roleId },
      relations: ['feature'],
    });
  }

  async findByFeatureId(featureId: string): Promise<RoleFeaturePermission[]> {
    return await this.roleFeaturePermissionsRepository.find({
      where: { featureId },
      relations: ['role'],
    });
  }

  async findOne(roleId: string, featureId: string): Promise<RoleFeaturePermission> {
    return await this.roleFeaturePermissionsRepository.findOne({
      where: { roleId, featureId },
      relations: ['role', 'feature'],
    });
  }

  async update(roleId: string, featureId: string, permissionData: Partial<RoleFeaturePermission>): Promise<RoleFeaturePermission> {
    const permission = await this.findOne(roleId, featureId);
    if (permission) {
      await this.roleFeaturePermissionsRepository.update(permission.id, permissionData);
      return await this.findOne(roleId, featureId);
    }
    return null;
  }

  async remove(roleId: string, featureId: string): Promise<void> {
    const permission = await this.findOne(roleId, featureId);
    if (permission) {
      await this.roleFeaturePermissionsRepository.delete(permission.id);
    }
  }

  async checkPermission(roleId: string, featureName: string, requiredLevel: string): Promise<boolean> {
    const permission = await this.roleFeaturePermissionsRepository.findOne({
      where: { roleId },
      relations: ['feature'],
    });
    
    if (!permission) return false;
    
    const permissionLevels = ['read', 'write', 'delete', 'admin'];
    const requiredIndex = permissionLevels.indexOf(requiredLevel);
    const currentLevel = permissionLevels.indexOf(permission.permissionLevel);
    
    return currentLevel >= requiredIndex;
  }
}
