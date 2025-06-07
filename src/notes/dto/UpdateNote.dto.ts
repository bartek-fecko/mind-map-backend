import { PartialType } from '@nestjs/mapped-types';
import { CreateNoteDto } from './CreateNote.dto';

export class UpdateNoteDto extends PartialType(CreateNoteDto) {}
