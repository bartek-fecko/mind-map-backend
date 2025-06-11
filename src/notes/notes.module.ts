import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesGateway } from './notes.gateway';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [NotesGateway, NotesService],
})
export class NotesModule {}
