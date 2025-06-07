import { IsEmail, IsEnum, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsNumber()
  id: number;

  @IsEmail()
  email: string;

  @IsEnum(['dev', 'tester'], {
    message: "To pole nie jest jednym z ['dev', 'tester']",
  })
  role: 'dev' | 'tester';
}
