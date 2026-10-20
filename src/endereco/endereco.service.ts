import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class EnderecoService {
  constructor(private readonly prisma: PrismaService) {}
  async BuscarTodosEstados() {
    return this.prisma.unidadeFederativa.findMany();
  }

  async BuscarTiposLogradouro() {
    return this.prisma.tipoLogradouro.findMany();
  }
}
