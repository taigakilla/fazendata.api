import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateFazendaDto } from './dto/create-fazenda.dto';

@Injectable()
export class FazendaService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createFazendaDto: CreateFazendaDto) {
    const {
      Logradouro,
      Complemento,
      Bairro,
      CEP,
      Numero,
      Cidade,
      UF,
      IdTipoLogradouro,
      Nome,
      IdPessoa,
      IdDono,
    } = createFazendaDto;

    if (!IdPessoa) {
      throw new BadRequestException(
        `A pessoa com o ID ${createFazendaDto.IdPessoa} não existe.`,
      );
    }

    if (!IdDono) {
      throw new BadRequestException(
        `A pessoa com o ID ${createFazendaDto.IdDono} não existe.`,
      );
    }

    const dono = await this.prisma.pessoa.findUnique({
      where: { IdPessoa: IdDono },
    });
    if (!dono) {
      throw new BadRequestException(`A pessoa com o ID ${IdDono} não existe.`);
    }

    const estado = await this.prisma.unidadeFederativa.findUnique({
      where: { UF },
    });
    if (!estado) {
      throw new BadRequestException(`O estado ${UF} não existe.`);
    }

    const tipoLogradouro = await this.prisma.tipoLogradouro.findUnique({
      where: { IdTipoLogradouro },
    });
    if (!tipoLogradouro) {
      throw new BadRequestException(
        `Tipo de logradouro com ID ${IdTipoLogradouro} não existe.`,
      );
    }

    return this.prisma.fazenda.create({
      data: {
        Nome,
        Dono: { connect: { IdPessoa: IdDono } },
        Endereco: {
          create: {
            Logradouro,
            Complemento,
            Bairro,
            CEP,
            Numero,
            Cidade,
            IdTipoLogradouro,
            UF,
          },
        },
        // Quem cadastrou e o dono passam a ter acesso à fazenda.
        FazendaPessoa: {
          create: [...new Set([IdPessoa, IdDono])].map((id) => ({
            IdPessoa: id,
          })),
        },
      },
    });
  }

  async BuscarTodasFazendas(idPessoa: number) {
    return this.prisma.fazenda.findMany({
      where: {
        FazendaPessoa: {
          some: {
            IdPessoa: idPessoa,
          },
        },
      },
      include: {
        Dono: { select: { IdPessoa: true, Nome: true } },
        Endereco: {
          include: { TipoLogradouro: true },
        },
      },
    });
  }
}
