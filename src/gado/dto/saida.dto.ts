import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const MOTIVOS_SAIDA = ['Venda', 'Morte', 'Transferencia'] as const;

export class SaidaDto {
  @IsIn(MOTIVOS_SAIDA)
  Motivo: (typeof MOTIVOS_SAIDA)[number];

  @Type(() => Date)
  @IsDate()
  Data: Date;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  Observacao?: string;

  @IsOptional()
  @IsInt()
  IdFazendaDestino?: number;
}
