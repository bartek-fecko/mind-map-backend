import { ForbiddenException, UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { BoardAccessGuard } from './guards/BoardAccessGuard';
import { BoardCleanupService } from './boards/board-cleanup.service';
import { getBoardRoom } from './utils/utils';
import { BoardSocketEvents } from './boards/socketEvents';
import { GlobalSocketEvents } from './types/socketEvents';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly boardCleanupService: BoardCleanupService) {}

  handleConnection(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      client.join(`user_${userId}`);
      console.info(`User ${userId} connected with socket ${client.id}`);
    } else {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.info(`Disconnected: ${client.id}`);
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(BoardSocketEvents.REMOVE_BOARD_ALL_CONTENT)
  async handleRemoveAllElements(
    @MessageBody() data: { payload: { boardId: number } },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { boardId } = data.payload;
      await this.boardCleanupService.clearBoardData(boardId);

      this.server
        .to(getBoardRoom(boardId))
        .emit(BoardSocketEvents.REMOVE_BOARD_ALL_CONTENT, {
          boardId,
        });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit(GlobalSocketEvents.ERROR, 'Access denied to this board');
      }
      client.emit(GlobalSocketEvents.ERROR, 'Operation could not be executed');
    }
  }
}
