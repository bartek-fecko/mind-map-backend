import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotesService } from './notes.service';
import { NotesSocketEvents } from './socketEvents';
import { Prisma } from '@prisma/client';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly notesService: NotesService) {}

  @SubscribeMessage(NotesSocketEvents.GET_ALL)
  async handleRequestAllNotes(
    @MessageBody() boardId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const notes = await this.notesService.getAllNotes(boardId);
    client.emit(NotesSocketEvents.GET_ALL, notes);
  }

  @SubscribeMessage(NotesSocketEvents.ADD)
  async handleAddNote(
    @MessageBody()
    payload: { note: Prisma.NoteUncheckedCreateInput; boardId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const newNote = await this.notesService.addNote({
      ...payload.note,
      boardId: payload.boardId,
    });
    client.broadcast.emit(NotesSocketEvents.ADD, newNote);
    return newNote;
  }

  @SubscribeMessage(NotesSocketEvents.UPDATE)
  async handleUpdateNote(
    @MessageBody()
    payload: { id: string; note: Prisma.NoteUncheckedUpdateInput },
    @ConnectedSocket() client: Socket,
  ) {
    const { id, note } = payload;
    const updatedNote = await this.notesService.updateNote(id, note);
    client.broadcast.emit(NotesSocketEvents.UPDATE, updatedNote);
  }

  @SubscribeMessage(NotesSocketEvents.REMOVE)
  async handleRemoveNote(
    @MessageBody() payload: { id: string; boardId: number },
    @ConnectedSocket() client: Socket,
  ) {
    await this.notesService.removeNote(payload.id, payload.boardId);
    client.broadcast.emit(NotesSocketEvents.REMOVE, payload.id);
  }

  @SubscribeMessage(NotesSocketEvents.REMOVE_ALL)
  async handleRemoveAllNotes(
    @MessageBody() boardId: number,
    @ConnectedSocket() client: Socket,
  ) {
    await this.notesService.removeAllNotes(boardId);
    client.broadcast.emit(NotesSocketEvents.REMOVE_ALL);
  }
}
