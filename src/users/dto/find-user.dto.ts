import { IsEmail, IsNotEmpty } from 'class-validator';

export class FindUserDto {
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
