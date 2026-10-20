import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class PessoaService {
  constructor(private readonly prisma: PrismaService) {}
  findPessoas() {
    return this.prisma.pessoa.findMany({
      select: { IdPessoa: true, Nome: true },
      orderBy: { Nome: 'asc' },
    });
  }
}
