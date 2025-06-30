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
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { getBoardRoom } from 'src/utils/utils';
import { BoardsAccessService } from 'src/boards/board-access.service';
import { BoardAccessGuard } from 'src/guards/BoardAccessGuard';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class NotesGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly notesService: NotesService,
    private readonly boardAccessService: BoardsAccessService,
  ) {}

  @SubscribeMessage(NotesSocketEvents.GET_ALL)
  async handleRequestAllNotes(
    @MessageBody() data: { payload: { boardId: number } },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { boardId } = data.payload;

      await this.boardAccessService.checkBoardAccess(boardId, client);

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

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(NotesSocketEvents.ADD)
  async handleAddNote(
    @MessageBody()
    data: {
      payload: { note: Prisma.NoteUncheckedCreateInput; boardId: number };
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { payload } = data;

    const newNote = await this.notesService.addNote({
      ...payload.note,
      boardId: payload.boardId,
    });

    client
      .to(getBoardRoom(payload.boardId))
      .emit(NotesSocketEvents.ADD, newNote);
    return newNote;
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(NotesSocketEvents.UPDATE)
  async handleUpdateNote(
    @MessageBody()
    data: {
      payload: {
        id: string;
        note: Prisma.NoteUncheckedUpdateInput;
        boardId: number;
      };
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { payload } = data;

    const updatedNote = await this.notesService.updateNote(
      payload.id,
      payload.note,
    );

    client
      .to(getBoardRoom(payload.boardId))
      .emit(NotesSocketEvents.UPDATE, updatedNote);
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(NotesSocketEvents.INCREASE_Z_INDEX)
  async handleIncreaseZIndex(
    @MessageBody()
    data: {
      payload: { id: string; boardId: number; callback?: Function };
    },
  ) {
    const { id, boardId } = data.payload;

    const result = await this.notesService.moveNoteZIndexUp(id, boardId);

    const [movedNote, swappedNote] = result;
    this.server
      .to(getBoardRoom(boardId))
      .emit(NotesSocketEvents.UPDATE, movedNote);
    if (swappedNote) {
      this.server
        .to(getBoardRoom(boardId))
        .emit(NotesSocketEvents.UPDATE, swappedNote);
    }

    return { swappedNote };
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(NotesSocketEvents.DECREASE_Z_INDEX)
  async handleDecreaseZIndex(
    @MessageBody()
    data: {
      payload: { id: string; boardId: number };
    },
  ) {
    const { id, boardId } = data.payload;

    const result = await this.notesService.moveNoteZIndexDown(id, boardId);

    const [movedNote, swappedNote] = result;
    this.server
      .to(getBoardRoom(boardId))
      .emit(NotesSocketEvents.UPDATE, movedNote);
    if (swappedNote) {
      this.server
        .to(getBoardRoom(boardId))
        .emit(NotesSocketEvents.UPDATE, swappedNote);
    }
    return { swappedNote };
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(NotesSocketEvents.REMOVE)
  async handleRemoveNote(
    @MessageBody() data: { payload: { id: string; boardId: number } },
    @ConnectedSocket() client: Socket,
  ) {
    const { payload } = data;

    await this.notesService.removeNote(payload.id, payload.boardId);

    client
      .to(getBoardRoom(payload.boardId))
      .emit(NotesSocketEvents.REMOVE, payload.id);
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(NotesSocketEvents.REMOVE_ALL)
  async handleRemoveAllNotes(
    @MessageBody() data: { payload: number },
    @ConnectedSocket() client: Socket,
  ) {
    const boardId = data.payload;

    await this.notesService.removeAllNotes(boardId);

    client.to(getBoardRoom(boardId)).emit(NotesSocketEvents.REMOVE_ALL);
  }
}
