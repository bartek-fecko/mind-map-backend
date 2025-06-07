import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAllNotes() {
    return this.databaseService.note.findMany();
  }

  async addNote(createNoteDto: Prisma.NoteUncheckedCreateInput) {
    return this.databaseService.note.create({
      data: createNoteDto,
    });
  }

  async updateNote(updateNoteDto: Prisma.NoteUncheckedUpdateInput) {
    if (typeof updateNoteDto.id !== 'string') return null;

    return this.databaseService.note.update({
      where: { id: updateNoteDto.id },
      data: updateNoteDto,
    });
  }

  async removeNote(id: string) {
    await this.databaseService.note.delete({ where: { id } });
  }

  async removeAllNotes() {
    await this.databaseService.note.deleteMany({});
  }
}
