import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GifsSocketEvents } from './socketEvents';
import { GifsService } from './gifs.service';
import { Prisma } from '@prisma/client';
import { BoardAccessService } from '../boards/board-access.service';
import { ForbiddenException } from '@nestjs/common';
import { getBoardRoom } from 'src/utils/utils';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class GifsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gifsService: GifsService,
    private readonly boardAccessService: BoardAccessService,
  ) {}

  @SubscribeMessage(GifsSocketEvents.LOAD_GIFS)
  async handleLoadGifs(
    @MessageBody() boardId: number,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(boardId, client.data.userId);

      const gifs = await this.gifsService.getGifsForBoard(boardId);

      client.join(getBoardRoom(boardId));

      client.emit(GifsSocketEvents.LOAD_GIFS, gifs);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
        client.disconnect(true);
      }
    }
  }

  @SubscribeMessage(GifsSocketEvents.ADD_GIF)
  async handleAddGif(
    @MessageBody()
    data: { boardId: number; gif: Prisma.GifUncheckedCreateInput },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.boardAccessService.checkAccess(
        data.boardId,
        client.data.userId,
      );

      const createdGif = await this.gifsService.createGif(
        data.boardId,
        data.gif,
      );

      client
        .to(getBoardRoom(data.boardId))
        .emit(GifsSocketEvents.ADD_GIF, createdGif);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
      }
    }
  }

  @SubscribeMessage(GifsSocketEvents.REMOVE_GIF)
  async handleRemoveGif(
    @MessageBody() gifId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const boardId = await this.gifsService.getBoardIdByGifId(gifId);
      await this.boardAccessService.checkAccess(boardId, client.data.userId);

      await this.gifsService.deleteGif(gifId);

      client.to(getBoardRoom(boardId)).emit(GifsSocketEvents.REMOVE_GIF, gifId);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        client.emit('error', 'Access denied to this board');
      }
    }
  }
}
