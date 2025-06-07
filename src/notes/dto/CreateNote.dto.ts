import { IsString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  id: string;

  @IsString()
  content: string;

  @IsString()
  x: string;

  @IsString()
  y: string;
}
