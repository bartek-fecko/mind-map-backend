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
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { getBoardRoom } from 'src/utils/utils';
import { BoardsAccessService } from 'src/boards/board-access.service';
import { BoardAccessGuard } from 'src/guards/BoardAccessGuard';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class GifsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gifsService: GifsService,
    private readonly boardAccessService: BoardsAccessService,
  ) {}

  @SubscribeMessage(GifsSocketEvents.LOAD_GIFS)
  async handleLoadGifs(
    @MessageBody() data: { payload: { boardId: number } },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { boardId } = data.payload;
      await this.boardAccessService.checkBoardAccess(boardId, client);

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

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(GifsSocketEvents.ADD_GIF)
  async handleAddGif(
    @MessageBody()
    data: { payload: { boardId: number; gif: Prisma.GifUncheckedCreateInput } },
    @ConnectedSocket() client: Socket,
  ) {
    const { boardId, gif } = data.payload;

    const createdGif = await this.gifsService.createGif(boardId, gif);

    client.to(getBoardRoom(boardId)).emit(GifsSocketEvents.ADD_GIF, createdGif);
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(GifsSocketEvents.UPDATE_GIF)
  async handleUpdateNote(
    @MessageBody()
    data: {
      payload: {
        id: string;
        gif: Prisma.GifUncheckedUpdateInput;
        boardId: number;
      };
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { payload } = data;

    const updatedGif = await this.gifsService.updateGif(payload.gif);

    client
      .to(getBoardRoom(payload.boardId))
      .emit(GifsSocketEvents.UPDATE_GIF, updatedGif);
  }

  @UseGuards(BoardAccessGuard)
  @SubscribeMessage(GifsSocketEvents.REMOVE_GIF)
  async handleRemoveGif(
    @MessageBody()
    data: { payload: { gifId: string; boardId: number } },
    @ConnectedSocket() client: Socket,
  ) {
    const { gifId, boardId } = data.payload;
    await this.gifsService.deleteGif(gifId);

    client.to(getBoardRoom(boardId)).emit(GifsSocketEvents.REMOVE_GIF, gifId);
  }
}
