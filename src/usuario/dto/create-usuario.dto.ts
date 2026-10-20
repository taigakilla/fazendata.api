import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
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

  @IsOptional()
  @IsIn([1, 2, 3])
  IdTipoUsuario?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  Fazendas?: number[];
}
