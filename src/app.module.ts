import { Module } from '@nestjs/common';
import { NotesModule } from './notes/notes.module';
import { DatabaseModule } from './database/database.module';
import { GifsModule } from './gifs/gifs.module';
import { BoardsModule } from './boards/boards.module';
import { DrawingModule } from './drawing/drawing.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SocketModule } from './socket.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    NotesModule,
    GifsModule,
    DrawingModule,
    BoardsModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    NotificationsModule,
    SocketModule,
  ],
})
export class AppModule {}
