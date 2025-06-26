import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GlobalSocketEvents } from 'src/types/socketEvents';

export const getBoardRoom = (boardId: number) => `board:${boardId}`;

@Catch()
export class WsExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();

    const message = exception.message || 'Błąd serwera';
    client.emit(GlobalSocketEvents.ERROR, message);
  }
}
