import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class DrawingService {
  constructor(private readonly db: DatabaseService) {}

  async createDrawing(createDrawingDto: Prisma.DrawingUncheckedCreateInput) {
    return this.db.drawing.create({
      data: {
        id: createDrawingDto.id,
        title: createDrawingDto.title,
        boardId: createDrawingDto.boardId,
        strokes: createDrawingDto.strokes,
      },
    });
  }

  async saveDrawing(data: { id: string; strokes: any; version: number }) {
    const existing = await this.getDrawing(data.id);

    if (existing) {
      return this.db.drawing.update({
        where: { id: data.id },
        data: {
          strokes: data.strokes,
          version: data.version,
        },
      });
    } else {
      throw new Error(
        'Cannot create new Drawing without boardId. Use createDrawing().',
      );
    }
  }

  async getDrawingByBoardId(boardId: number) {
    return this.db.drawing.findFirst({ where: { boardId } });
  }

  async getDrawing(id: string) {
    return this.db.drawing.findUnique({ where: { id } });
  }

  async deleteDrawing(id: string) {
    return this.db.drawing.delete({ where: { id } });
  }

  async deleteAllDrawings() {
    return this.db.drawing.deleteMany();
  }
}
