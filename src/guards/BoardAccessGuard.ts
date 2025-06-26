import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class BoardAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const data = context.switchToWs().getData();

    const boardId =
      typeof data === 'object' && typeof data.payload === 'object'
        ? data.payload.boardId
        : null;

    return !!boardId && !!client.data.boardAccess?.[boardId];
  }
}
