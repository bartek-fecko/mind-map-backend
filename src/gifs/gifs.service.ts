import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class GifsService {
  constructor(private readonly db: DatabaseService) {}

  async getGifsForBoard(boardId: number) {
    return this.db.gif.findMany({
      where: { boardId },
    });
  }

  async createGif(boardId: number, gif: Prisma.GifUncheckedCreateInput) {
    return this.db.gif.create({
      data: {
        boardId,
        ...gif,
      },
    });
  }

  async updateGif(gif: Prisma.GifUncheckedUpdateInput) {
    return this.db.gif.update({
      where: { id: gif.id?.toString() },
      data: gif,
    });
  }

  async deleteGif(gifId: string) {
    return this.db.gif.delete({
      where: { id: gifId },
    });
  }
}
