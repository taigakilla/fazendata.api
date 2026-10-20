import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
export class LoginResponseDto {
  IdPessoa: number;
  Nome: string;
  IdTipoUsuario: number;
  Permissoes: string[];
  access_token: string;
}
