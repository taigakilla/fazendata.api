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

    if (!UF) {
      throw new BadRequestException(
        `O endereço com ID ${createFazendaDto.UF} não existe.`,
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

    const endereco = await this.prisma.endereco.create({
      data: {
        Logradouro,
        Complemento,
        Bairro,
        CEP,
        Numero,
        Cidade,
        IdTipoLogradouro,
        UF,
      },
    });

    const fazendaData = await this.prisma.fazenda.create({
      data: {
        IdEndereco: endereco.IdEndereco,
        Nome,
        IdDono,
      },
    });
    // Quem cadastrou e o dono passam a ter acesso à fazenda.
    await this.prisma.fazendaPessoa.createMany({
      data: [...new Set([IdPessoa, IdDono])].map((id) => ({
        IdPessoa: id,
        IdFazenda: fazendaData.IdFazenda,
      })),
    });

    const fazenda = await this.prisma.fazenda.findUnique({
      where: { IdFazenda: fazendaData.IdFazenda },
    });

    return fazenda;
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
        Dono: true,
        Endereco: {
          include: { TipoLogradouro: true },
        },
      },
    });
  }
}
