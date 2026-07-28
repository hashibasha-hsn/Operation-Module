import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './ticket.entity';
import { TicketTag } from './ticket-tag.entity';
import { AutoTicketCategory } from './auto-ticket-category.entity';
import { TicketRule } from './ticket-rule.entity';
import { TicketSettings } from './ticket-settings.entity';
import { TicketClosureQuestion } from './ticket-closure-question.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      TicketTag,
      AutoTicketCategory,
      TicketRule,
      TicketSettings,
      TicketClosureQuestion,
    ], 'org'),
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
