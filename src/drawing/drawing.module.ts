import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { DrawingGateway } from './drawing.gateway';
import { DrawingService } from './drawing.service';
import { BoardsModule } from 'src/boards/boards.module';

@Module({
  imports: [DatabaseModule, BoardsModule],
  providers: [DrawingGateway, DrawingService],
})
export class DrawingModule {}
