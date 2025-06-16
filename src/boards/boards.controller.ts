import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  Req,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  async getAllBoards(@Req() req: any) {
    const userId = req.user.id;
    return this.boardsService.getAllBoards(userId);
  }

  @Get(':boardId')
  async getBoard(@Param('boardId') boardId: number, @Req() req: any) {
    const userId = req.user.id;    
    return this.boardsService.getBoardById(+boardId, userId);
  }

  @Post()
  async createBoard(@Body() data: { title: string }, @Req() req: any) {
    const userId = req.user.id;
    return this.boardsService.createBoard(data.title, userId);
  }

  @Post(':boardId/share')
  async shareBoard(
    @Param('boardId') boardId: number,
    @Body() dto: { email: string; role: 'editor' | 'viewer' },
    @Req() req: any,
  ) {
    return this.boardsService.shareBoard(
      boardId,
      dto.email,
      dto.role,
      req.user.id,
    );
  }
}
