import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class BoardCleanupService {
  constructor(private db: DatabaseService) {}

  async clearBoardData(boardId: number): Promise<void> {
    await this.db.$transaction([
      this.db.note.deleteMany({ where: { boardId } }),
      this.db.drawing.deleteMany({ where: { boardId } }),
      this.db.gif.deleteMany({ where: { boardId } }),
    ]);
  }
}
