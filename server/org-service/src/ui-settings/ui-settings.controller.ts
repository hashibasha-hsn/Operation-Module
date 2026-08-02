import { Controller, Get, Put, Body, Headers } from '@nestjs/common';
import { UiSettingsService } from './ui-settings.service';

@Controller('ui-settings')
export class UiSettingsController {
  constructor(private readonly uiSettingsService: UiSettingsService) {}

  @Get()
  async get(
    @Headers('x-organization-id') organizationId?: string,
  ) {
    return this.uiSettingsService.get(organizationId || 'default-org');
  }

  @Put()
  async update(
    @Body() body: { theme: Record<string, unknown> },
    @Headers('x-organization-id') organizationId?: string,
    @Headers('x-user-email') email?: string,
  ) {
    return this.uiSettingsService.update(
      organizationId || 'default-org',
      body.theme ?? {},
      email || 'system',
    );
  }
}
