import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { OAuth2Client } from 'google-auth-library';

const EXPIRE_TIME = 20 * 60 * 1000;
// const EXPIRE_TIME = 10 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(dto: any) {
    const user = await this.validateUser(dto);
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      sub: user.id,
    };

    return {
      user,
      backendTokens: {
        accessToken: await this.jwtService.signAsync(payload, {
          expiresIn: '20m',
          secret: process.env.JWT_SECRET,
        }),
        refreshToken: await this.jwtService.signAsync(payload, {
          expiresIn: '7d',
          secret: process.env.JWT_REFRESH_SECRET,
        }),
        expiresIn: Date.now() + EXPIRE_TIME,
      },
    };
  }

  async googleLogin(token: string) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    let user = await this.userService.findByEmail(payload.email);

    if (!user) {
      user = await this.userService.create({
        email: payload.email,
        name: payload.name,
        image: payload.picture,
      });
    }

    const backendPayload = {
      id: user.id,
      username: user.email,
      image: user.image,
      sub: user.id,
    };

    return {
      user,
      backendTokens: {
        accessToken: await this.jwtService.signAsync(backendPayload, {
          expiresIn: '20m',
          secret: process.env.JWT_SECRET,
        }),
        refreshToken: await this.jwtService.signAsync(backendPayload, {
          expiresIn: '7d',
          secret: process.env.JWT_REFRESH_SECRET,
        }),
        expiresIn: Date.now() + EXPIRE_TIME,
      },
    };
  }

  async validateUser(dto: any) {
    const user = await this.userService.findByEmail(dto.email);

    if (user && (await compare(dto.password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    throw new UnauthorizedException();
  }

  async refreshToken(user: any) {
    const payload = {
      id: user.id,
      name: user.name,
      image: user.image,
      sub: user.id,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: '20m',
        secret: process.env.JWT_SECRET,
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET,
      }),
      expiresIn: Date.now() + EXPIRE_TIME,
    };
  }
}
