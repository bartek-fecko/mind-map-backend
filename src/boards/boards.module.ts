import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { DatabaseModule } from 'src/database/database.module';
import { JwtService } from '@nestjs/jwt';
import { BoardsAccessService } from './board-access.service';
import { BoardCleanupService } from './board-cleanup.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BoardsController],
  providers: [
    BoardsService,
    BoardsAccessService,
    BoardCleanupService,
    JwtService,
  ],
  exports: [BoardsService, BoardsAccessService, BoardCleanupService],
})
export class BoardsModule {}
