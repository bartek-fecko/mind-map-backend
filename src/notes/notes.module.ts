import { Module } from '@nestjs/common';
import { NotesController } from './rest/notes.controller';
import { NotesService } from './notes.service';
import { NotesGateway } from './notes.gateway';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [NotesController],
  providers: [NotesGateway, NotesService],
})
export class NotesModule {}
