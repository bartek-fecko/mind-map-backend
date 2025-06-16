import { Injectable, ForbiddenException } from '@nestjs/common';
import { BoardsService } from '../boards/boards.service';

@Injectable()
export class BoardAccessService {
  constructor(private readonly boardsService: BoardsService) {}

  async checkAccess(boardId: number, userId: number) {
    try {
      await this.boardsService.getBoardById(boardId, userId);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException('Access denied to this board');
      }
      throw error;
    }
  }
}
