import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcessoService {
  constructor(private readonly prisma: PrismaService) {}

  async garantirAcessoFazenda(idPessoa: number, idFazenda: number) {
    const vinculo = await this.prisma.fazendaPessoa.findUnique({
      where: {
        IdPessoa_IdFazenda: { IdPessoa: idPessoa, IdFazenda: idFazenda },
      },
    });
    if (!vinculo) {
      throw new ForbiddenException('Você não tem acesso a esta fazenda.');
    }
  }

  async garantirAcessoGado(idPessoa: number, idGado: number) {
    const gado = await this.prisma.gado.findFirst({
      where: {
        IdGado: idGado,
        Fazenda: { FazendaPessoa: { some: { IdPessoa: idPessoa } } },
      },
      select: { IdGado: true },
    });
    if (!gado) {
      throw new ForbiddenException('Você não tem acesso a este gado.');
    }
  }
}
