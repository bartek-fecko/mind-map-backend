import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  ValidationPipe,
} from '@nestjs/common';
import { NotesService } from '../notes.service';
import { Note } from '../types';
import { CreateUserDto } from './dto/CreateUser.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  getNotes(): any[] {
    return [];
  }

  @Post()
  createNote(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    console.log(createUserDto);
    return createUserDto.email;
  }

  @Get(':id')
  getNote(@Param('id', ParseIntPipe) id: number) {
    if (true) {
      throw new NotFoundException();
    }
    return { id };
  }

  @Put(':id')
  updateNote(@Param('id', ParseIntPipe) id: number, @Body() updatedNote: Note) {
    return { id };
  }
}
