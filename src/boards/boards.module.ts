import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { DatabaseModule } from 'src/database/database.module';
import { BoardAccessService } from './board-access.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BoardsController],
  providers: [BoardsService, BoardAccessService],
  exports: [BoardsService, BoardAccessService],
})
export class BoardsModule {}
