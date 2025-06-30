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
    const maxZIndex = await this.db.note.aggregate({
      _max: { zIndex: true },
      where: { boardId: note.boardId },
    });

    let newZIndex = (maxZIndex._max.zIndex || 0) + 1;

    if (newZIndex > 100) {
      const reindexed = await this.reindexNotes(note.boardId);
      newZIndex = reindexed.length + 1;
    }

    return this.db.note.create({
      data: {
        id: note.id,
        x: note.x,
        y: note.y,
        width: note.width,
        height: note.height,
        content: note.content,
        boardId: note.boardId,
        zIndex: newZIndex,
      },
    });
  }

  async updateNote(id: string, note: Prisma.NoteUncheckedUpdateInput) {
    return this.db.note.update({
      where: { id },
      data: note,
    });
  }

  async moveNoteZIndexUp(noteId: string, boardId: number) {
    const note = await this.db.note.findUnique({ where: { id: noteId } });
    if (!note) return null;

    const maxZIndex = await this.db.note.aggregate({
      _max: { zIndex: true },
      where: { boardId },
    });

    if (note.zIndex >= (maxZIndex._max.zIndex || 0)) {
      return [note, null];
    }

    const aboveNote = await this.db.note.findFirst({
      where: {
        boardId,
        zIndex: note.zIndex + 1,
      },
    });

    const updates = [];

    if (aboveNote) {
      updates.push(
        this.db.note.update({
          where: { id: aboveNote.id },
          data: { zIndex: note.zIndex },
        }),
      );
    }

    updates.push(
      this.db.note.update({
        where: { id: noteId },
        data: { zIndex: note.zIndex + 1 },
      }),
    );

    const results = await this.db.$transaction(updates);

    return aboveNote
      ? [results[results.length - 1], results[0]]
      : [results[results.length - 1], null];
  }

  async moveNoteZIndexDown(noteId: string, boardId: number) {
    const note = await this.db.note.findUnique({ where: { id: noteId } });
    if (!note) return null;

    if (note.zIndex <= 1) return [note, null];

    const belowNote = await this.db.note.findFirst({
      where: {
        boardId,
        zIndex: note.zIndex - 1,
      },
    });

    const updates = [];
    if (belowNote) {
      updates.push(
        this.db.note.update({
          where: { id: belowNote.id },
          data: { zIndex: note.zIndex },
        }),
      );
    }

    updates.push(
      this.db.note.update({
        where: { id: noteId },
        data: { zIndex: note.zIndex - 1 },
      }),
    );

    const results = await this.db.$transaction(updates);
    return belowNote
      ? [results[results.length - 1], results[0]]
      : [results[results.length - 1], null];
  }

  async removeNote(id: string, boardId: number) {
    await this.db.note.delete({ where: { id, boardId } });
    await this.reindexNotes(boardId);
  }

  async removeAllNotes(boardId: number) {
    return this.db.note.deleteMany({ where: { boardId } });
  }

  private async reindexNotes(boardId: number) {
    const notes = await this.db.note.findMany({
      where: { boardId },
      orderBy: { zIndex: 'asc' },
    });

    const updates = notes.map((note, index) =>
      this.db.note.update({
        where: { id: note.id },
        data: { zIndex: index + 1 },
      }),
    );

    await this.db.$transaction(updates);
    return updates;
  }
}
