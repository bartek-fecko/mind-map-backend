import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  async findAll() {
    return this.db.user.findMany();
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
    return this.db.user.create({
      data: {
        email: data.email,
        name: data.name,
        image: data.image,
        password: data.password,
      },
    });
  }
}
