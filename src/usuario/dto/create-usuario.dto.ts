import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty()
  @MaxLength(100)
  Nome: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsInt()
  IdSexo: number;
}
