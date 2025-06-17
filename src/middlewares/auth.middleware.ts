import { JwtService } from '@nestjs/jwt';

export class SocketAuthMiddleware {
  private jwtService = new JwtService({
    secret: process.env.JWT_SECRET,
  });

  async use(socket: any, next: any) {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('No token provided'));
      }

      const payload = this.jwtService.verify(token);

      socket.data.userId = payload.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  }
}
