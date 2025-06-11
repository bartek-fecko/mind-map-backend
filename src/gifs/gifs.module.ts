import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { GifsService } from './gifs.service';
import { GifsGateway } from './gifs.gateway';

@Module({
  imports: [DatabaseModule],
  providers: [GifsGateway, GifsService],
})
export class GifsModule {}
