import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class BoardsService {
  constructor(private readonly db: DatabaseService) {}

  getAllBoards(userId: string) {
    return this.db.board.findMany({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        users: true,
      },
    });
  }

  async createBoard(title: string, userId: string) {
    return this.db.board.create({
      data: {
        title,
        users: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });
  }

  async getBoardById(boardId: number, userId: string) {
    const board = await this.db.board.findUnique({
      where: { id: boardId },
      include: { users: true },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const hasAccess = board.users.some((user) => user.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return board;
  }

  async shareBoard(
    boardId: number,
    targetUserEmail: string,
    role: 'editor' | 'viewer',
    ownerId: string,
  ) {
    const targetUser = await this.db.user.findUnique({
      where: { email: targetUserEmail },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const ownership = await this.db.boardUser.findFirst({
      where: {
        boardId,
        userId: ownerId,
        role: 'owner',
      },
    });

    if (!ownership) {
      throw new ForbiddenException('Only owner can share this board');
    }

    return this.db.boardUser.create({
      data: {
        boardId,
        userId: targetUser.id,
        role,
      },
    });
  }
}
