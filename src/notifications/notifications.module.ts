import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, JwtService],
})
export class NotificationsModule {}
