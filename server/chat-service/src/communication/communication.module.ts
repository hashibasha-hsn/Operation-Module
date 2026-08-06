import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { Conversation } from './conversation.entity';
import { ConversationMember } from './conversation-member.entity';
import { Message } from './message.entity';
import { SupabaseStorageService } from '../shared/supabase-storage.service';
import { chatUploadOptions } from './chat-upload.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationMember, Message], 'chat'),
    MulterModule.register(chatUploadOptions),
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService, SupabaseStorageService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
