import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceConfig } from './attendance-config.entity';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('config')
  getConfig(@Query('organizationId') organizationId?: string) {
    return this.attendanceService.getConfig(organizationId || 'default-org');
  }

  @Post('config')
  saveConfig(
    @Body() body: Partial<AttendanceConfig> & { organizationId?: string },
  ) {
    return this.attendanceService.saveConfig(
      body.organizationId || 'default-org',
      body,
    );
  }

  @Get('records')
  findRecords(
    @Query('organizationId') organizationId?: string,
    @Query('userId') userId?: string,
    @Query('store') store?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.findRecords({
      organizationId: organizationId || 'default-org',
      userId,
      store,
      startDate,
      endDate,
    });
  }

  @Get('today')
  getToday(@Query('userId') userId: string) {
    return this.attendanceService.getTodayRecord(userId);
  }

  @Post('check-in')
  checkIn(
    @Body()
    body: {
      userId: string;
      userName?: string;
      employeeId?: string;
      email?: string;
      store?: string;
      storeId?: string;
      organizationId?: string;
      deviceInfo?: string;
    },
  ) {
    return this.attendanceService.checkIn(body);
  }

  @Post('check-out')
  checkOut(
    @Body()
    body: {
      userId: string;
      organizationId?: string;
      deviceInfo?: string;
    },
  ) {
    return this.attendanceService.checkOut(body);
  }
}
