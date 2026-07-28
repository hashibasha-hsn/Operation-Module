import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceConfig } from './attendance-config.entity';
import { AttendanceRecord } from './attendance-record.entity';

const DEFAULT_CONFIG: Partial<AttendanceConfig> = {
  status: true,
  geolocation: true,
  checkInImage: false,
  checkOutImage: false,
  operatingHoursStart: '09:00',
  operatingHoursEnd: '18:00',
  dailyWorkingHours: 9,
  calculateOvertime: true,
  designation: true,
  users: true,
  usersOutsideEntity: true,
  removeInactiveUsers: false,
  primaryAssignee: false,
  notify: false,
  autoCheckInOnLogin: true,
  autoCheckOutOnLogout: true,
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 8);
}

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map((part) => parseInt(part, 10));
  return (hours || 0) * 60 + (minutes || 0);
}

function calcTotalHours(checkInTime?: string, checkOutTime?: string): string {
  if (!checkInTime || !checkOutTime) return '0.00';
  const diffMinutes = parseTimeToMinutes(checkOutTime) - parseTimeToMinutes(checkInTime);
  if (diffMinutes <= 0) return '0.00';
  return (diffMinutes / 60).toFixed(2);
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceConfig, 'org')
    private readonly configRepository: Repository<AttendanceConfig>,
    @InjectRepository(AttendanceRecord, 'org')
    private readonly recordRepository: Repository<AttendanceRecord>,
  ) {}

  async getConfig(organizationId = 'default-org'): Promise<AttendanceConfig> {
    let config = await this.configRepository.findOne({ where: { organizationId } });
    if (!config) {
      config = this.configRepository.create({
        organizationId,
        ...DEFAULT_CONFIG,
      });
      config = await this.configRepository.save(config);
    }
    return config;
  }

  async saveConfig(
    organizationId: string,
    payload: Partial<AttendanceConfig>,
  ): Promise<AttendanceConfig> {
    const existing = await this.getConfig(organizationId);
    Object.assign(existing, payload, { organizationId });
    return this.configRepository.save(existing);
  }

  async findRecords(filters: {
    organizationId?: string;
    userId?: string;
    store?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceRecord[]> {
    const qb = this.recordRepository.createQueryBuilder('record');

    if (filters.organizationId) {
      qb.andWhere('record.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      });
    }
    if (filters.userId && filters.userId !== 'all') {
      qb.andWhere('record.userId = :userId', { userId: filters.userId });
    }
    if (filters.store && filters.store !== 'all') {
      qb.andWhere('record.store = :store', { store: filters.store });
    }
    if (filters.startDate) {
      qb.andWhere('record.date >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      qb.andWhere('record.date <= :endDate', { endDate: filters.endDate });
    }

    qb.orderBy('record.date', 'DESC').addOrderBy('record.checkInTime', 'DESC');
    return qb.getMany();
  }

  async getTodayRecord(userId: string): Promise<AttendanceRecord | null> {
    return this.recordRepository.findOne({
      where: { userId, date: todayDateString() },
    });
  }

  private resolveCheckInStatus(checkInTime: string, config: AttendanceConfig): string {
    const startMinutes = parseTimeToMinutes(config.operatingHoursStart || '09:00');
    const checkInMinutes = parseTimeToMinutes(checkInTime);
    return checkInMinutes > startMinutes + 15 ? 'late' : 'checked-in';
  }

  async checkIn(input: {
    userId: string;
    userName?: string;
    employeeId?: string;
    email?: string;
    store?: string;
    storeId?: string;
    organizationId?: string;
    deviceInfo?: string;
  }): Promise<AttendanceRecord | null> {
    const organizationId = input.organizationId || 'default-org';
    const config = await this.getConfig(organizationId);
    if (!config.status || !config.autoCheckInOnLogin) {
      return this.getTodayRecord(input.userId);
    }

    const today = todayDateString();
    let record = await this.getTodayRecord(input.userId);
    if (record?.checkInTime) {
      return record;
    }

    const now = new Date();
    const checkInTime = formatTime(now);

    if (!record) {
      record = this.recordRepository.create({
        userId: input.userId,
        userName: input.userName,
        employeeId: input.employeeId,
        email: input.email,
        store: input.store || 'Unassigned',
        storeId: input.storeId,
        date: today,
        organizationId,
        expectedHours: config.dailyWorkingHours || 9,
        source: 'login',
      });
    }

    record.checkInTime = checkInTime;
    record.status = this.resolveCheckInStatus(checkInTime, config);
    record.deviceInfo = input.deviceInfo || record.deviceInfo;
    record.userName = input.userName || record.userName;
    record.employeeId = input.employeeId || record.employeeId;
    record.email = input.email || record.email;
    record.store = input.store || record.store || 'Unassigned';
    record.storeId = input.storeId || record.storeId;

    return this.recordRepository.save(record);
  }

  async checkOut(input: {
    userId: string;
    organizationId?: string;
    deviceInfo?: string;
  }): Promise<AttendanceRecord | null> {
    const organizationId = input.organizationId || 'default-org';
    const config = await this.getConfig(organizationId);
    if (!config.status || !config.autoCheckOutOnLogout) {
      return this.getTodayRecord(input.userId);
    }

    let record = await this.getTodayRecord(input.userId);
    if (!record) {
      return null;
    }
    if (record.checkOutTime) {
      return record;
    }

    const checkOutTime = formatTime(new Date());
    record.checkOutTime = checkOutTime;
    record.totalHours = calcTotalHours(record.checkInTime, checkOutTime);
    const expected = record.expectedHours || config.dailyWorkingHours || 9;
    record.deviation = parseFloat(record.totalHours) - expected;
    record.status = 'present';
    record.source = 'logout';
    if (input.deviceInfo) {
      record.deviceInfo = input.deviceInfo;
    }

    return this.recordRepository.save(record);
  }
}
