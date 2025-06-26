import { ForbiddenException, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class BoardsAccessService {
  constructor(private readonly db: DatabaseService) {}

  async checkBoardAccess(boardId: number, client: Socket) {
    if (!client.data.boardAccess[boardId]) {
      const board = await this.db.board.findFirst({
        where: {
          id: boardId,
          users: { some: { userId: client.data.userId } },
        },
        select: { id: true },
      });

      if (!board) {
        throw new ForbiddenException('You do not have access to this board');
      }

      client.data.boardAccess[boardId] = true;
    }
  }
}
