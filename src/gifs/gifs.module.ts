import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { GifsService } from './gifs.service';
import { GifsGateway } from './gifs.gateway';
import { BoardsModule } from 'src/boards/boards.module';

@Module({
  imports: [DatabaseModule, BoardsModule],
  providers: [GifsGateway, GifsService],
})
export class GifsModule {}
