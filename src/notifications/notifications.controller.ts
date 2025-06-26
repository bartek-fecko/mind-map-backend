import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtGuard)
  async getNotifications(@Req() req: any) {
    const userId = req.user.id.toString();
    return await this.notificationsService.getNotificationsByUserId(userId);
  }

  @Post(':id/read')
  @UseGuards(JwtGuard)
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id.toString();
    return await this.notificationsService.markAsRead(parseInt(id), userId);
  }
}
