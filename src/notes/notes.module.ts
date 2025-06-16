import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesGateway } from './notes.gateway';
import { DatabaseModule } from 'src/database/database.module';
import { BoardsModule } from 'src/boards/boards.module';

@Module({
  imports: [DatabaseModule, BoardsModule],
  providers: [NotesGateway, NotesService],
})
export class NotesModule {}
