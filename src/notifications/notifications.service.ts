import { ForbiddenException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  async getNotificationsByUserId(userId: string) {
    const notifications = await this.db.notification.findMany({
      where: { userId },
      include: {
        fromUser: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return notifications;
  }

  async markAsRead(notificationId: number, userId: string) {
    const notification = await this.db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only modify your own notificaitons',
      );
    }

    return await this.db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }
}
