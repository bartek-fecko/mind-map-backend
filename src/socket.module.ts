import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { BoardsModule } from './boards/boards.module';

@Module({
  imports: [BoardsModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class SocketModule {}
