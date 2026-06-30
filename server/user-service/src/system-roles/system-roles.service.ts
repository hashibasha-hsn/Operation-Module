import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemRole, ScopeLevel } from './system-role.entity';

@Injectable()
export class SystemRolesService {
  constructor(
    @InjectRepository(SystemRole)
    private systemRolesRepository: Repository<SystemRole>,
  ) {}

  async create(roleData: Partial<SystemRole>): Promise<SystemRole> {
    const role = this.systemRolesRepository.create(roleData);
    return await this.systemRolesRepository.save(role);
  }

  async findAll(): Promise<SystemRole[]> {
    const roles = await this.systemRolesRepository.find({
      where: { isActive: true },
    });

    const hierarchyOrder = [
      'company_admin',
      'non_creator_company_admin',
      'area_manager',
      'non_creator_area_manager',
      'process_manager',
      'user_manager',
      'store_manager',
      'non_creator_store_manager',
      'store_employee',
    ];

    return roles.sort((a, b) => {
      const aIndex = hierarchyOrder.indexOf(a.name);
      const bIndex = hierarchyOrder.indexOf(b.name);
      const aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      if (aRank !== bRank) return aRank - bRank;
      return a.displayName.localeCompare(b.displayName);
    });
  }

  async findOne(id: string): Promise<SystemRole> {
    return await this.systemRolesRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<SystemRole> {
    return await this.systemRolesRepository.findOne({ where: { name } });
  }

  async findByScopeLevel(scopeLevel: ScopeLevel): Promise<SystemRole[]> {
    return await this.systemRolesRepository.find({
      where: { scopeLevel, isActive: true },
    });
  }

  async update(id: string, roleData: Partial<SystemRole>): Promise<SystemRole> {
    await this.systemRolesRepository.update(id, roleData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.systemRolesRepository.update(id, { isActive: false });
  }
}
