import { IsNumber, Max, Min } from 'class-validator';

export class PesagemDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999.99)
  PesoAtual: number;
}
