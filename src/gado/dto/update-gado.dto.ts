import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateGadoDto {
  @IsOptional()
  @IsInt()
  IdTipoGado?: number;

  @IsOptional()
  @IsInt()
  IdFazenda?: number;

  @IsOptional()
  @IsInt()
  NumeroIdentificacao?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  DataNascimento?: Date;

  @IsOptional()
  @IsInt()
  IdSexo?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  PesoNascimentoEmKg?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  PesoAtual?: number;

  @IsOptional()
  @IsInt()
  IdRaca?: number;

  @IsOptional()
  @IsString()
  Nome?: string;

  @IsOptional()
  @IsString()
  volumeSemenDisponivel?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  motilidade?: number;

  @IsOptional()
  @IsInt()
  concentracao?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  ultimaInseminacao?: Date;

  @IsOptional()
  @IsInt()
  quantidadePartos?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  producaoLeiteDiariaEmLitros?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dataAbate?: Date;

  @IsOptional()
  @IsInt()
  idadePrevistaAbate?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  ganhoDePesoMensal?: number;

  @IsOptional()
  @IsInt()
  IdStatusPrenhez?: number;

  @IsOptional()
  @IsInt()
  IdPai?: number | null;

  @IsOptional()
  @IsInt()
  IdMae?: number | null;
}
