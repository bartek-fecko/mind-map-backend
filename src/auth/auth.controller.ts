import {
  Body,
  Controller,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { RefreshJwtGuard } from './guards/refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private userService: UsersService,
    private authService: AuthService,
  ) {}

  // @Post('register')
  // async registerUser(@Body() dto: any) {
  //   return await this.userService.create(dto);
  // }

  @Post('login')
  async login(@Body() dto: any) {
    return await this.authService.login(dto);
  }

  @Post('google-login')
  async googleLogin(@Body() body: { access_token: string }) {
    return await this.authService.validateGoogleUser(body.access_token);
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  async refreshToken(@Request() req) {
    return await this.authService.refreshToken(req.user);
  }
}
