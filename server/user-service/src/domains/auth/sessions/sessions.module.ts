import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { RefreshToken } from './refresh-token.entity';
import { SessionsService } from './sessions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Session, RefreshToken], 'auth')],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
