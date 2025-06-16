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
import { BoardAccessService } from 'src/boards/board-access.service';
import { ForbiddenException } from '@nestjs/common';
import { getBoardRoom } from 'src/utils/utils';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class NotesGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly notesService: NotesService,
    private readonly boardAccessService: BoardAccessService,
  ) {}

  @SubscribeMessage(NotesSocketEvents.GET_ALL)
  async handleRequestAllNotes(
    @MessageBody() boardId: number,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(boardId, client.data.userId);
      const notes = await this.notesService.getAllNotes(boardId);

      client.join(getBoardRoom(boardId));

      client.emit(NotesSocketEvents.GET_ALL, notes);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
        client.disconnect(true);
      }
    }
  }

  @SubscribeMessage(NotesSocketEvents.ADD)
  async handleAddNote(
    @MessageBody()
    payload: { note: Prisma.NoteUncheckedCreateInput; boardId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(
        payload.boardId,
        client.data.userId,
      );
      const newNote = await this.notesService.addNote({
        ...payload.note,
        boardId: payload.boardId,
      });

      client
        .to(getBoardRoom(payload.boardId))
        .emit(NotesSocketEvents.ADD, newNote);
      return newNote;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
      }
    }
  }

  @SubscribeMessage(NotesSocketEvents.UPDATE)
  async handleUpdateNote(
    @MessageBody()
    payload: {
      id: string;
      note: Prisma.NoteUncheckedUpdateInput;
      boardId: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(
        payload.boardId,
        client.data.userId,
      );
      const updatedNote = await this.notesService.updateNote(
        payload.id,
        payload.note,
      );

      client
        .to(getBoardRoom(payload.boardId))
        .emit(NotesSocketEvents.UPDATE, updatedNote);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
      }
    }
  }

  @SubscribeMessage(NotesSocketEvents.REMOVE)
  async handleRemoveNote(
    @MessageBody() payload: { id: string; boardId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(
        payload.boardId,
        client.data.userId,
      );
      await this.notesService.removeNote(payload.id, payload.boardId);

      client
        .to(getBoardRoom(payload.boardId))
        .emit(NotesSocketEvents.REMOVE, payload.id);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
      }
    }
  }

  @SubscribeMessage(NotesSocketEvents.REMOVE_ALL)
  async handleRemoveAllNotes(
    @MessageBody() boardId: number,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(boardId, client.data.userId);
      await this.notesService.removeAllNotes(boardId);

      client.to(getBoardRoom(boardId)).emit(NotesSocketEvents.REMOVE_ALL);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
      }
    }
  }
}
