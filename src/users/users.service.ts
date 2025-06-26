import { Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(search: string) {
    return this.db.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        boards: { select: { boardId: true } },
      },
      take: 10,
    });
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  async findOrCreateByEmail(email: string, name?: string, image?: string) {
    let user = await this.db.user.findUnique({ where: { email } });

    if (!user) {
      user = await this.db.user.create({
        data: { email, name, image },
      });
    } else if (image && user.image !== image) {
      user = await this.db.user.update({
        where: { email },
        data: { image },
      });
    }

    return user;
  }

  async create(data: {
    email: string;
    name?: string;
    image?: string;
    password?: string;
  }) {
    const existingUser = await this.db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = data.password
      ? await hash(data.password, 10)
      : undefined;

    return this.db.user.create({
      data: {
        email: data.email,
        name: data.name,
        image: data.image,
        password: hashedPassword,
      },
    });
  }
}
