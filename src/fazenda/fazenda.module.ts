import { Module } from '@nestjs/common';
import { FazendaController } from './fazenda.controller';
import { FazendaService } from './fazenda.service';
import { PainelService } from './painel.service';
import { RelatorioService } from './relatorio.service';

@Module({
  controllers: [FazendaController],
  providers: [FazendaService, PainelService, RelatorioService],
})
export class FazendaModule {}
