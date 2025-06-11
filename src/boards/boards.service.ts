import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
 
@Injectable()
export class BoardsService {
  constructor(private readonly db: DatabaseService) {}

  getAllBoards() {
    return this.db.board.findMany();
  }

  createBoard(title: string) {
    return this.db.board.create({
      data: { title },
    });
  }
}
