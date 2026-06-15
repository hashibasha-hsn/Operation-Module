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
    return await this.systemRolesRepository.find({
      where: { isActive: true },
      order: { scopeLevel: 'ASC' },
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
