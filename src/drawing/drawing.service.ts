import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class DrawingService {
  constructor(private readonly db: DatabaseService) {}

  async createDrawing(createDrawingDto: Prisma.DrawingUncheckedCreateInput) {
    return this.db.drawing.create({
      data: createDrawingDto,
    });
  }

  async saveDrawing(data: Prisma.DrawingUncheckedCreateInput) {
    const existing = await this.getDrawing(data.id);

    if (existing) {
      return this.db.drawing.update({
        where: { id: data.id },
        data,
      });
    } else {
      return this.db.drawing.create({ data });
    }
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
 