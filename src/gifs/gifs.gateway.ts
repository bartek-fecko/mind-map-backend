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

@WebSocketGateway({ cors: { origin: '*' } })
export class GifsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gifsService: GifsService) {}

  @SubscribeMessage(GifsSocketEvents.LOAD_GIFS)
  async handleLoadGifs(
    @MessageBody() boardId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const gifs = await this.gifsService.getGifsForBoard(boardId);
    client.emit(GifsSocketEvents.LOAD_GIFS, gifs);
  }

  @SubscribeMessage(GifsSocketEvents.ADD_GIF)
  async handleAddGif(
    @MessageBody()
    data: { boardId: number; gif: Prisma.GifUncheckedCreateInput },
    @ConnectedSocket() client: Socket,
  ) {
    const createdGif = await this.gifsService.createGif(data.boardId, data.gif);
    client.broadcast.emit(GifsSocketEvents.ADD_GIF, createdGif);
  }

  @SubscribeMessage(GifsSocketEvents.REMOVE_GIF)
  async handleRemoveGif(
    @MessageBody() gifId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await this.gifsService.deleteGif(gifId);
    client.broadcast.emit(GifsSocketEvents.REMOVE_GIF, gifId);
  }
}
