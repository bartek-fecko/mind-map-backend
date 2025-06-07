import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DrawingSocketEvents } from './socketEvents';

@WebSocketGateway({ cors: { origin: '*' } })
export class DrawingGateway {
  @WebSocketServer()
  server: Server;

  constructor() {}

  @SubscribeMessage(DrawingSocketEvents.ADD_STROKE)
  handleAddStroke(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    client.broadcast.emit(DrawingSocketEvents.ADD_STROKE, data);
  }

  @SubscribeMessage(DrawingSocketEvents.REMOVE_STROKE)
  handleRemoveStroke(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.emit(DrawingSocketEvents.REMOVE_STROKE, data);
  }

  @SubscribeMessage(DrawingSocketEvents.REMOVE_ALL_STROKES)
  handleRemoveAllStokes(@ConnectedSocket() client: Socket) {
    client.broadcast.emit(DrawingSocketEvents.REMOVE_ALL_STROKES);
  }

  // Akcja do przeniesnia do globalngego gatewaya
  @SubscribeMessage(DrawingSocketEvents.REMOVE_ALL)
  handleRemoveAll(@ConnectedSocket() client: Socket) {
    client.broadcast.emit(DrawingSocketEvents.REMOVE_ALL);
  }
}
