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
import { randomUUID } from 'crypto';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { getBoardRoom } from 'src/utils/utils';
import { BoardsAccessService } from 'src/boards/board-access.service';
import { BoardAccessGuard } from 'src/guards/BoardAccessGuard';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class DrawingGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly drawingService: DrawingService,
    private readonly boardAccessService: BoardsAccessService,
  ) {}

  @SubscribeMessage(DrawingSocketEvents.LOAD_DRAWING)
  async handleLoadDrawing(
    @MessageBody() data: { payload: { boardId: number } },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { boardId } = data.payload;
      await this.boardAccessService.checkBoardAccess(boardId, client);
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

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(DrawingSocketEvents.ADD_STROKE)
  async handleAddStroke(
    @MessageBody()
    data: {
      payload: {
        boardId: number;
        id: string;
        points: any[];
        strokeColor: string;
        lineWidth: number;
        tool: string;
      };
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { boardId, ...stroke } = data.payload;

    const drawing = await this.drawingService.getDrawingByBoardId(boardId);
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
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(DrawingSocketEvents.REMOVE_STROKE)
  async handleRemoveStroke(
    @MessageBody() data: { payload: { boardId: number; strokeId: string } },
    @ConnectedSocket() client: Socket,
  ) {
    const { boardId, strokeId } = data.payload;
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
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(DrawingSocketEvents.REMOVE_ALL_STROKES)
  async handleRemoveAllStrokes(
    @MessageBody() data: { payload: { boardId: number } },
    @ConnectedSocket() client: Socket,
  ) {
    const { boardId } = data.payload;

    const drawing = await this.drawingService.getDrawingByBoardId(boardId);
    if (!drawing) return;

    await this.drawingService.saveDrawing({
      id: drawing.id,
      strokes: [],
      version: (drawing.version || 1) + 1,
    });

    client
      .to(getBoardRoom(boardId))
      .emit(DrawingSocketEvents.REMOVE_ALL_STROKES, {
        boardId,
      });
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(DrawingSocketEvents.UNDO_CLEAR_ALL)
  async handleUndoClearAll(
    @MessageBody() data: { payload: { boardId: number; strokes: any[] } },
    @ConnectedSocket() client: Socket,
  ) {
    const { boardId, strokes } = data.payload;
    if (!boardId || !Array.isArray(strokes)) return;

    const drawing = await this.drawingService.getDrawingByBoardId(boardId);
    if (!drawing) return;

    await this.drawingService.saveDrawing({
      id: drawing.id,
      strokes,
      version: (drawing.version || 1) + 1,
    });

    client.to(getBoardRoom(boardId)).emit(DrawingSocketEvents.UNDO_CLEAR_ALL, {
      boardId,
      strokes,
    });
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(DrawingSocketEvents.REMOVE_ALL)
  async handleRemoveAll(
    @MessageBody() data: { payload: { boardId: number } },
    @ConnectedSocket() client: Socket,
  ) {
    const { boardId } = data.payload;
    await this.drawingService.clearDrawingStrokes(boardId);

    client.to(getBoardRoom(boardId)).emit(DrawingSocketEvents.REMOVE_ALL, {
      boardId,
    });
  }
}
