import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { DrawingGateway } from './drawing.gateway';
import { DrawingService } from './drawing.service';

@Module({
  imports: [DatabaseModule],
  providers: [DrawingGateway, DrawingService],
})
export class DrawingModule {}
