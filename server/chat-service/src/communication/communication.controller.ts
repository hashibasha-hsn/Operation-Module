import { Controller, Get, Post, Put, Delete, Param, Body, Query, UploadedFile, UseInterceptors, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommunicationService } from './communication.service';
import { chatUploadOptions, buildChatFilename, MAX_CHAT_FILE_SIZE } from './chat-upload.config';

@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('conversations/direct')
  createDirect(
    @Body() body: { meId: string; otherUserId: string; organizationId?: string },
  ) {
    return this.communicationService.createDirectConversation(
      body.meId,
      body.otherUserId,
      body.organizationId ?? 'default-org',
    );
  }

  @Post('conversations/channel')
  createChannel(
    @Body() body: {
      meId: string;
      organizationId?: string;
      name?: string;
      description?: string;
      memberUserIds?: string[];
    },
  ) {
    return this.communicationService.createChannel(
      body.meId,
      body.organizationId ?? 'default-org',
      {
        name: body.name,
        description: body.description,
        memberUserIds: body.memberUserIds,
      },
    );
  }

  @Get('conversations')
  list(@Query('meId') meId: string, @Query('organizationId') organizationId?: string) {
    return this.communicationService.listConversations(meId, organizationId ?? 'default-org');
  }

  @Post('conversations/:id/read')
  markRead(@Param('id') id: string, @Body() body: { meId: string }) {
    return this.communicationService.markRead(id, body.meId);
  }

  @Post('conversations/:id/join')
  joinChannel(@Param('id') id: string, @Body() body: { meId: string }) {
    return this.communicationService.joinChannel(id, body.meId);
  }

  @Post('conversations/:id/decline')
  declineChannel(@Param('id') id: string, @Body() body: { meId: string }) {
    return this.communicationService.declineChannelInvite(id, body.meId);
  }

  @Post('conversations/:id/members')
  addMembers(
    @Param('id') id: string,
    @Body() body: { meId: string; userIds: string[] },
  ) {
    return this.communicationService.addMembers(id, body.meId, body.userIds ?? []);
  }

  @Delete('conversations/:id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Query('meId') meId: string,
  ) {
    return this.communicationService.removeMember(id, meId, userId);
  }

  @Put('conversations/:id/notification')
  setNotificationPreference(
    @Param('id') id: string,
    @Body() body: { meId: string; preference: string },
  ) {
    return this.communicationService.setNotificationPreference(id, body.meId, body.preference);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() body: { meId: string; body?: string; attachment?: any; parentId?: string },
  ) {
    return this.communicationService.sendMessage(
      id,
      body.meId,
      body?.body ?? '',
      body?.attachment ?? null,
      body?.parentId ?? null,
    );
  }

  @Get('conversations/:id/messages')
  listMessages(
    @Param('id') id: string,
    @Query('meId') meId: string,
    @Query('after') after?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communicationService.listMessages(id, meId, after, limit ? Number(limit) : 50);
  }

  @Put('conversations/:id/messages/:messageId')
  editMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() body: { meId: string; body: string },
  ) {
    return this.communicationService.editMessage(id, messageId, body.meId, body.body);
  }

  @Delete('conversations/:id/messages/:messageId')
  deleteMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Query('meId') meId: string,
  ) {
    return this.communicationService.deleteMessage(id, messageId, meId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', chatUploadOptions))
  async upload(@UploadedFile() file?: any) {
    try {
      if (!file) return { error: 'No file provided' };
      const attachment = await this.communicationService.uploadChatFile(file);
      return attachment;
    } catch (err: any) {
      throw new HttpException(err?.message || 'Upload failed', HttpStatus.BAD_REQUEST);
    }
  }
}
