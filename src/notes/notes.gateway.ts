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
  async handleRequestAllNotes(@ConnectedSocket() client: Socket) {
    const notes = await this.notesService.getAllNotes();
    client.emit(NotesSocketEvents.GET_ALL, notes);
  }

  @SubscribeMessage(NotesSocketEvents.ADD)
  async handleAddNote(
    @MessageBody() note: Prisma.NoteUncheckedCreateInput,
    @ConnectedSocket() client: Socket,
  ) {
    const newNote = await this.notesService.addNote(note);
    client.broadcast.emit(NotesSocketEvents.ADD, newNote);
    return newNote;
  }

  @SubscribeMessage(NotesSocketEvents.UPDATE)
  handleUpdateNote(
    @MessageBody()
    note: Prisma.NoteUncheckedUpdateInput,
    @ConnectedSocket() client: Socket,
  ) {
    this.notesService.updateNote(note);
    client.broadcast.emit(NotesSocketEvents.UPDATE, note);
  }

  @SubscribeMessage(NotesSocketEvents.REMOVE)
  handleRemoveNote(
    @MessageBody() id: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.notesService.removeNote(id);
    client.broadcast.emit(NotesSocketEvents.REMOVE, id);
  }

  @SubscribeMessage(NotesSocketEvents.REMOVE_ALL)
  handleRemoveAllNotes(@ConnectedSocket() client: Socket) {
    this.notesService.removeAllNotes();
    client.broadcast.emit(NotesSocketEvents.REMOVE_ALL);
  }
}
