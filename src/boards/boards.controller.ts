import { Controller, Post, Body, Get } from '@nestjs/common';
import { BoardsService } from './boards.service';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  async getAllBoards() {
    return this.boardsService.getAllBoards();
  }

  @Post()
  async createBoard(@Body() data: { title: string }) {
    return this.boardsService.createBoard(data.title);
  }
}
