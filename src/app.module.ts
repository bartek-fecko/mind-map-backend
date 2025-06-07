import { Module } from '@nestjs/common';
import { NotesModule } from './notes/notes.module';
import { AppGateway } from './app.gateway';
import { DatabaseModule } from './database/database.module';
import { DrawingModule } from './drawing/drawing.module';

@Module({
  imports: [NotesModule, DrawingModule, DatabaseModule],
  providers: [AppGateway],
})
export class AppModule {}
