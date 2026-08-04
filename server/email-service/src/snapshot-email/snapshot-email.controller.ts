import { Controller, Get, Put, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SnapshotEmailService, SnapshotEmailConfigInput } from './snapshot-email.service';
import { AdminGuard } from '../guards/admin.guard';

@Controller('email/snapshot')
export class SnapshotEmailController {
  constructor(private readonly snapshotEmailService: SnapshotEmailService) {}

  @Get('config')
  getConfig(@Query('organizationId') organizationId: string) {
    return this.snapshotEmailService.getSettings(organizationId);
  }

  @UseGuards(AdminGuard)
  @Put('config')
  updateConfig(
    @Query('organizationId') organizationId: string,
    @Body() body: SnapshotEmailConfigInput,
  ) {
    return this.snapshotEmailService.updateSettings(organizationId, body);
  }

  @UseGuards(AdminGuard)
  @Post('send')
  sendNow(
    @Query('organizationId') organizationId: string,
    @Body() body: { date?: string },
  ) {
    return this.snapshotEmailService.sendSnapshotEmail(organizationId, body?.date);
  }

  @UseGuards(AdminGuard)
  @Post('test')
  sendTest(
    @Query('organizationId') organizationId: string,
    @Body() body: { to?: string },
  ) {
    const to = body?.to?.trim();
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }
    return this.snapshotEmailService.sendTestEmail(organizationId, to);
  }
}
