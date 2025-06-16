import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DrawingSocketEvents } from './socketEvents';
import { DrawingService } from './drawing.service';
import { BoardAccessService } from '../boards/board-access.service';
import { randomUUID } from 'crypto';
import { ForbiddenException } from '@nestjs/common';
import { getBoardRoom } from 'src/utils/utils';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class DrawingGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly drawingService: DrawingService,
    private readonly boardAccessService: BoardAccessService,
  ) {}

  @SubscribeMessage(DrawingSocketEvents.LOAD_DRAWING)
  async handleLoadDrawing(
    @MessageBody() boardId: number,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(boardId, client.data.userId);

      client.join(getBoardRoom(boardId));

      let drawing = await this.drawingService.getDrawingByBoardId(boardId);

      if (!drawing) {
        drawing = await this.drawingService.createDrawing({
          id: randomUUID(),
          boardId,
          strokes: [],
        });
      }

      client.emit(DrawingSocketEvents.LOAD_DRAWING, {
        boardId,
        strokes: drawing.strokes,
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
        client.disconnect(true);
      }
    }
  }

  @SubscribeMessage(DrawingSocketEvents.ADD_STROKE)
  async handleAddStroke(
    @MessageBody()
    data: {
      boardId: number;
      id: string;
      points: any[];
      strokeColor: string;
      lineWidth: number;
      tool: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(
        data.boardId,
        client.data.userId,
      );

      const { boardId, ...stroke } = data;
      let drawing = await this.drawingService.getDrawingByBoardId(boardId);

      const strokes = Array.isArray(drawing.strokes) ? drawing.strokes : [];
      const updatedStrokes = [...strokes, stroke];

      await this.drawingService.saveDrawing({
        id: drawing.id,
        strokes: updatedStrokes,
        version: (drawing.version || 1) + 1,
      });

      client.to(getBoardRoom(boardId)).emit(DrawingSocketEvents.ADD_STROKE, {
        boardId,
        stroke,
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
      }
    }
  }

  @SubscribeMessage(DrawingSocketEvents.REMOVE_STROKE)
  async handleRemoveStroke(
    @MessageBody() data: { boardId: number; strokeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(
        data.boardId,
        client.data.userId,
      );

      const { boardId, strokeId } = data;
      if (!boardId || !strokeId) return;

      const drawing = await this.drawingService.getDrawingByBoardId(boardId);
      if (!drawing) return;

      const strokes = Array.isArray(drawing.strokes) ? drawing.strokes : [];

      const updatedStrokes = strokes.filter(
        (stroke: any) => stroke.id !== strokeId,
      );

      await this.drawingService.saveDrawing({
        id: drawing.id,
        strokes: updatedStrokes,
        version: (drawing.version || 1) + 1,
      });

      client.to(getBoardRoom(boardId)).emit(DrawingSocketEvents.REMOVE_STROKE, {
        boardId,
        strokeId,
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
      }
    }
  }

  @SubscribeMessage(DrawingSocketEvents.REMOVE_ALL_STROKES)
  async handleRemoveAllStrokes(
    @MessageBody() boardId: number,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(boardId, client.data.userId);

      const drawing = await this.drawingService.getDrawingByBoardId(boardId);
      if (!drawing) return;

      await this.drawingService.saveDrawing({
        id: drawing.id,
        strokes: [],
        version: 1,
      });

      client
        .to(getBoardRoom(boardId))
        .emit(DrawingSocketEvents.REMOVE_ALL_STROKES, boardId);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
      }
    }
  }

  @SubscribeMessage(DrawingSocketEvents.UNDO_CLEAR_ALL)
  async handleUndoClearAll(
    @MessageBody() data: { boardId: number; strokes: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(
        data.boardId,
        client.data.userId,
      );

      const { boardId, strokes } = data;
      if (!boardId || !Array.isArray(strokes)) return;

      const drawing = await this.drawingService.getDrawingByBoardId(boardId);
      if (!drawing) return;

      await this.drawingService.saveDrawing({
        id: drawing.id,
        strokes,
        version: (drawing.version || 1) + 1,
      });

      client
        .to(getBoardRoom(boardId))
        .emit(DrawingSocketEvents.UNDO_CLEAR_ALL, data);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
      }
    }
  }

  @SubscribeMessage(DrawingSocketEvents.REMOVE_ALL)
  async handleRemoveAll(
    @MessageBody() boardId: number,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(boardId, client.data.userId);

      await this.drawingService.clearDrawingStrokes(boardId);

      client
        .to(getBoardRoom(boardId))
        .emit(DrawingSocketEvents.REMOVE_ALL, boardId);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
      }
    }
  }
}
