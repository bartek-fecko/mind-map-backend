import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { DrawingGateway } from './drawing.gateway';

@Module({
  imports: [DatabaseModule],
  providers: [DrawingGateway],
})
export class DrawingModule {}
