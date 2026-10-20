import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFazendaDto {
  @IsString()
  Logradouro: string;

  @IsString()
  Complemento: string;

  @IsString()
  Bairro: string;

  @IsInt()
  CEP: number;

  @IsInt()
  Numero: number;

  @IsString()
  Cidade: string;

  @MaxLength(2)
  @IsString()
  UF: string;

  @IsInt()
  IdTipoLogradouro: number;

  @IsInt()
  IdDono: number;

  @IsString()
  Nome: string;

  // Ignorado: a API usa o usuário logado.
  @IsOptional()
  @IsInt()
  IdPessoa?: number;
}
