import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGadoDto {
  @IsInt()
  IdTipoGado: number;

  @IsInt()
  IdFazenda: number;

  @IsInt()
  NumeroIdentificacao: number;

  @Type(() => Date)
  @IsDate()
  DataNascimento: Date;

  @IsInt()
  IdSexo: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  PesoNascimentoEmKg: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  PesoAtual: number;

  @IsInt()
  IdRaca: number;

  @IsString()
  Nome: string;

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
}
