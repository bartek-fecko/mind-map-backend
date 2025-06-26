import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  Req,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('boards')
@UseGuards(JwtGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  async getBoards(@Req() req: any) {
    return this.boardsService.getBoards(req.user.id.toString());
  }

  @Get('/owned')
  async getOwnedBoards(@Req() req: any) {
    const userId = req.user.id.toString();
    return this.boardsService.getOwnedBoards(userId);
  }

  @Get(':boardId')
  async getBoard(@Param('boardId') boardId: number, @Req() req: any) {
    const userId = req.user.id.toString();
    return await this.boardsService.getBoardById(+boardId, userId.toString());
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = uuidv4() + extname(file.originalname);
          callback(null, uniqueSuffix);
        },
      }),
    }),
  )
  async createBoard(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: { title: string; description: string },
    @Req() req: any,
  ) {
    const userId = req.user.id.toString();
    const imagePath = file ? file.filename : null;
    return this.boardsService.createBoard(
      data.title,
      data.description,
      userId,
      imagePath,
    );
  }

  @Post(':boardId/share')
  async shareBoard(
    @Param('boardId') boardId: string,
    @Body()
    dto: { email: string; role: 'editor' | 'viewer'; boardTitle: string },
    @Req() req: any,
  ) {
    const ownerId = req.user.id.toString();
    return this.boardsService.shareBoard(
      +boardId,
      dto.email,
      dto.role,
      dto.boardTitle,
      ownerId,
    );
  }

  @Delete(':boardId')
  async deleteBoard(@Param('boardId') boardId: string, @Req() req: any) {
    const userId = req.user.id.toString();
    return this.boardsService.deleteBoard(+boardId, userId);
  }
}
