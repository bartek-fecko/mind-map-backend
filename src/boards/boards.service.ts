import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { boardCardColorIds } from './contants';

const BOARD_USER_LIMIT = 5;

@Injectable()
export class BoardsService {
  constructor(private readonly db: DatabaseService) {}

  getBoards(userId: string) {
    return this.db.board.findMany({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        users: {
          select: {
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  getOwnedBoards(userId: string) {
    return this.db.board.findMany({
      where: {
        users: {
          some: {
            userId: userId,
            role: 'owner',
          },
        },
      },
      include: {
        users: {
          select: {
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createBoard(
    title: string,
    description: string,
    userId: string,
    imagePath: string,
  ) {
    const existingBoards = await this.db.board.findMany({
      where: {
        users: {
          some: { userId },
        },
      },
      select: {
        cardColorTheme: true,
      },
    });

    const usedColors = existingBoards.map((b) => b.cardColorTheme);

    const availableColors = boardCardColorIds.filter(
      (id) => !usedColors.includes(id),
    );

    let selectedColor: string;

    if (availableColors.length > 0) {
      selectedColor =
        availableColors[Math.floor(Math.random() * availableColors.length)];
    } else {
      selectedColor =
        boardCardColorIds[Math.floor(Math.random() * boardCardColorIds.length)];
    }

    const baseUrl = process.env.API_URL || 'http://localhost:3001';
    const fullImageUrl = imagePath ? `${baseUrl}/uploads/${imagePath}` : null;

    return this.db.board.create({
      data: {
        title,
        description,
        cardColorTheme: selectedColor,
        imageUrl: fullImageUrl,
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
    boardTitle: string,
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

    const userCount = await this.db.boardUser.count({
      where: {
        boardId,
      },
    });

    if (userCount >= BOARD_USER_LIMIT) {
      throw new ForbiddenException(
        `Nie można udostępnić tablicy więcej niż ${BOARD_USER_LIMIT} użytkownikom`,
      );
    }

    await this.db.notification.create({
      data: {
        userId: targetUser.id,
        fromUserId: ownerId,
        message: '',
        boardId,
        type: 'board-shared',
        boardTitle,
        url: `/boards/${boardId}`,
      },
    });

    return this.db.boardUser.create({
      data: {
        boardId,
        userId: targetUser.id,
        role,
      },
    });
  }

  async deleteBoard(boardId: number, userId: string) {
    const board = await this.db.board.findFirst({
      where: {
        id: boardId,
        users: {
          some: {
            userId,
          },
        },
      },
    });

    if (!board) {
      throw new Error('Nie znaleziono tablicy lub brak dostępu');
    }

    await this.db.boardUser.deleteMany({ where: { boardId } });
    await this.db.drawing.deleteMany({ where: { boardId } });
    await this.db.note.deleteMany({ where: { boardId } });
    await this.db.gif.deleteMany({ where: { boardId } });

    this.db.notification.create({
      data: {
        userId: userId,
        message: '',
        boardId,
        type: 'board-deleted',
        boardTitle: board.title,
        url: `/boards/${boardId}`,
      },
    });

    return await this.db.board.delete({
      where: { id: boardId },
    });
  }
}
