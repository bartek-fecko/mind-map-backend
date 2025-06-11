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

@WebSocketGateway({ cors: { origin: '*' } })
export class DrawingGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly drawingService: DrawingService) {}

  @SubscribeMessage(DrawingSocketEvents.LOAD_DRAWING)
  async handleLoadDrawing(
    @MessageBody() boardId: number,
    @ConnectedSocket() client: Socket,
  ) {
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
    const { boardId, ...stroke } = data;
    if (!boardId) return;

    let drawing = await this.drawingService.getDrawingByBoardId(boardId);

    const strokes = Array.isArray(drawing.strokes) ? drawing.strokes : [];
    const updatedStrokes = [...strokes, stroke];

    await this.drawingService.saveDrawing({
      id: drawing.id,
      strokes: updatedStrokes,
      version: (drawing.version || 1) + 1,
    });

    client.broadcast.emit(DrawingSocketEvents.ADD_STROKE, { boardId, stroke });
  }

  @SubscribeMessage(DrawingSocketEvents.REMOVE_STROKE)
  async handleRemoveStroke(
    @MessageBody() data: { boardId: number; strokeId: string },
    @ConnectedSocket() client: Socket,
  ) {
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

    client.broadcast.emit(DrawingSocketEvents.REMOVE_STROKE, {
      boardId,
      strokeId,
    });
  }

  @SubscribeMessage(DrawingSocketEvents.REMOVE_ALL_STROKES)
  async handleRemoveAllStrokes(
    @MessageBody() boardId: number,
    @ConnectedSocket() client: Socket,
  ) {
    if (!boardId) return;

    const drawing = await this.drawingService.getDrawingByBoardId(boardId);
    if (!drawing) return;

    await this.drawingService.saveDrawing({
      id: drawing.id,
      strokes: [],
      version: 1,
    });

    client.broadcast.emit(DrawingSocketEvents.REMOVE_ALL_STROKES, boardId);
  }

  @SubscribeMessage(DrawingSocketEvents.UNDO_CLEAR_ALL)
  async handleUndoClearAll(
    @MessageBody() data: { boardId: number; strokes: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    const { boardId, strokes } = data;
    if (!boardId || !Array.isArray(strokes)) return;

    const drawing = await this.drawingService.getDrawingByBoardId(boardId);
    if (!drawing) return;

    await this.drawingService.saveDrawing({
      id: drawing.id,
      strokes,
      version: (drawing.version || 1) + 1,
    });

    client.broadcast.emit(DrawingSocketEvents.UNDO_CLEAR_ALL, data);
  }

  @SubscribeMessage(DrawingSocketEvents.REMOVE_ALL)
  handleRemoveAll(@ConnectedSocket() client: Socket) {
    this.drawingService.deleteAllDrawings();
    client.broadcast.emit(DrawingSocketEvents.REMOVE_ALL);
  }
}
