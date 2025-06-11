import { Module } from '@nestjs/common';
import { NotesModule } from './notes/notes.module';
import { AppGateway } from './app.gateway';
import { DatabaseModule } from './database/database.module';
import { GifsModule } from './gifs/gifs.module';
import { BoardsModule } from './boards/boards.module';
import { DrawingModule } from './drawing/drawing.module';

@Module({
  imports: [
    NotesModule,
    GifsModule,
    DrawingModule,
    BoardsModule,
    DatabaseModule,
  ],
  providers: [AppGateway],
})
export class AppModule {}
