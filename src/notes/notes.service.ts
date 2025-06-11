import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotesService {
  constructor(private readonly db: DatabaseService) {}

  async getAllNotes(boardId: number) {
    return this.db.note.findMany({ where: { boardId } });
  }

  async addNote(note: Prisma.NoteUncheckedCreateInput & { boardId: number }) {
    return this.db.note.create({
      data: {
        id: note.id,
        x: note.x,
        y: note.y,
        width: note.width,
        height: note.height,
        content: note.content,
        boardId: note.boardId,
      },
    });
  }

  async updateNote(id: string, note: Prisma.NoteUncheckedUpdateInput) {
    return this.db.note.update({
      where: { id },
      data: note,
    });
  }

  async removeNote(id: string, boardId: number) {
    return this.db.note.delete({ where: { id, boardId } });
  }

  async removeAllNotes(boardId: number) {
    return this.db.note.deleteMany({ where: { boardId } });
  }
}
