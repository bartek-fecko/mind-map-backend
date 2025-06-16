import { Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';

export class SocketAuthMiddleware {
  use(socket: Socket, next: (err?: any) => void) {
    try {
      const cookie = socket.handshake.headers.cookie;

      if (!cookie) {
        throw new Error('No cookie');
      }

      const tokenCookie = cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('token='));

      if (!tokenCookie) {
        throw new Error('No token cookie');
      }

      const token = tokenCookie.split('=')[1];
      const payload = verify(token, process.env.JWT_SECRET);

      socket.data.userId = (payload as any).sub;

      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  }
}
