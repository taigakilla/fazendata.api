import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class CatalogoService {
  constructor(private readonly prisma: PrismaService) {}

  BuscarRacas() {
    return this.prisma.raca.findMany({ orderBy: { Nome: 'asc' } });
  }

  async BuscarSexos() {
    const sexos = await this.prisma.sexo.findMany({
      orderBy: { IdSexo: 'asc' },
    });
    // Descricao é CHAR no banco e volta com espaços à direita.
    return sexos.map((sexo) => ({ ...sexo, Descricao: sexo.Descricao.trim() }));
  }

  async BuscarStatusPrenhez() {
    const status = await this.prisma.statusPrenhez.findMany({
      orderBy: { IdStatusPrenhez: 'asc' },
    });
    return status.map((s) => ({ ...s, Descricao: s.Descricao.trim() }));
  }

  BuscarTiposGado() {
    return this.prisma.tipoGado.findMany({ orderBy: { IdTipoGado: 'asc' } });
  }
}
