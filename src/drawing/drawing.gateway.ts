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

@WebSocketGateway({ cors: { origin: '*' } })
export class DrawingGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly drawingService: DrawingService) {}

  @SubscribeMessage(DrawingSocketEvents.LOAD_DRAWING)
  async handleLoadDrawing(
    @MessageBody() drawingId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const drawing = await this.drawingService.getDrawing(drawingId);
    client.emit(DrawingSocketEvents.LOAD_DRAWING, drawing?.strokes || []);
  }

  @SubscribeMessage(DrawingSocketEvents.ADD_STROKE)
  async handleAddStroke(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const { drawingId, ...stroke } = data;
    if (!drawingId) return;

    const drawing = await this.drawingService.getDrawing(drawingId);
    const strokes = Array.isArray(drawing?.strokes) ? drawing.strokes : [];
    const updatedStrokes = [...strokes, stroke];

    client.broadcast.emit(DrawingSocketEvents.ADD_STROKE, {
      drawingId,
      ...stroke,
    });

    this.drawingService
      .saveDrawing({
        id: drawingId,
        strokes: updatedStrokes,
        version: (drawing?.version || 1) + 1,
      })
      .catch((err) => {
        console.error('Błąd zapisu rysunku:', err);
      });
  }

  @SubscribeMessage(DrawingSocketEvents.REMOVE_STROKE)
  async handleRemoveStroke(
    @MessageBody() data: { drawingId: string; strokeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { drawingId, strokeId } = data;
    if (!drawingId || !strokeId) return;

    const drawing = await this.drawingService.getDrawing(drawingId);
    if (!drawing) return;

    const strokes = Array.isArray(drawing.strokes) ? drawing.strokes : [];

    const updatedStrokes = strokes.filter(
      (stroke: any) => stroke.id !== strokeId,
    );
    await this.drawingService.saveDrawing({
      id: drawingId,
      strokes: updatedStrokes,
      version: (drawing.version || 1) + 1,
    });

    client.broadcast.emit(DrawingSocketEvents.REMOVE_STROKE, {
      drawingId,
      strokeId,
    });
  }

  @SubscribeMessage(DrawingSocketEvents.REMOVE_ALL_STROKES)
  async handleRemoveAllStrokes(
    @MessageBody() drawingId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!drawingId) return;

    client.broadcast.emit(DrawingSocketEvents.REMOVE_ALL_STROKES, drawingId);
    await this.drawingService.saveDrawing({
      id: drawingId,
      strokes: [],
      version: 1,
    });
  }

  @SubscribeMessage(DrawingSocketEvents.UNDO_CLEAR_ALL)
  async handleUndoClearAll(
    @MessageBody() data: { drawingId: string; strokes: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    const { drawingId, strokes } = data;
    if (!drawingId || !Array.isArray(strokes)) return;

    await this.drawingService.saveDrawing({
      id: drawingId,
      strokes,
      version:
        (await this.drawingService.getDrawing(drawingId))?.version + 1 || 1,
    });

    client.broadcast.emit(DrawingSocketEvents.UNDO_CLEAR_ALL, data);
  }

  @SubscribeMessage(DrawingSocketEvents.REMOVE_ALL)
  handleRemoveAll(@ConnectedSocket() client: Socket) {
    this.drawingService.deleteAllDrawings();
    client.broadcast.emit(DrawingSocketEvents.REMOVE_ALL);
  }
}
