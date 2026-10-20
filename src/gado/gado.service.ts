import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateGadoDto } from './dto/create-gado.dto';
import { UpdateGadoDto } from './dto/update-gado.dto';
import { VacinarGadoDto } from './dto/vacinar-gado.dto';

export const TIPO_GADO = { LEITEIRO: 1, CORTE: 2, REPRODUTOR: 3 } as const;
export const SEXO = { MACHO: 1, FEMEA: 2 } as const;

@Injectable()
export class GadoService {
  constructor(private readonly prisma: PrismaService) {}

  private validarSexoDoTipo(IdTipoGado: number, IdSexo: number) {
    switch (IdTipoGado) {
      case TIPO_GADO.LEITEIRO:
        if (IdSexo !== SEXO.FEMEA) {
          throw new BadRequestException('Gado Leiteiro deve ser fêmea');
        }
        break;
      case TIPO_GADO.CORTE:
        if (IdSexo !== SEXO.MACHO) {
          throw new BadRequestException('Gado de Corte deve ser macho');
        }
        break;
      case TIPO_GADO.REPRODUTOR:
        if (IdSexo !== SEXO.MACHO) {
          throw new BadRequestException('Gado Reprodutor deve ser macho');
        }
        break;
      default:
        throw new BadRequestException('Tipo de gado inválido');
    }
  }

  private async validarReferencias(ids: {
    IdTipoGado?: number;
    IdFazenda?: number;
    IdSexo?: number;
    IdRaca?: number;
    IdStatusPrenhez?: number;
  }) {
    const checagens: [unknown, Promise<unknown>, string][] = [
      [
        ids.IdTipoGado,
        this.prisma.tipoGado.findUnique({
          where: { IdTipoGado: ids.IdTipoGado ?? -1 },
        }),
        `Tipo de gado com ID ${ids.IdTipoGado} não existe.`,
      ],
      [
        ids.IdFazenda,
        this.prisma.fazenda.findUnique({
          where: { IdFazenda: ids.IdFazenda ?? -1 },
        }),
        `Fazenda com ID ${ids.IdFazenda} não existe.`,
      ],
      [
        ids.IdSexo,
        this.prisma.sexo.findUnique({ where: { IdSexo: ids.IdSexo ?? -1 } }),
        `Sexo com ID ${ids.IdSexo} não existe.`,
      ],
      [
        ids.IdRaca,
        this.prisma.raca.findUnique({ where: { IdRaca: ids.IdRaca ?? -1 } }),
        `Raça com ID ${ids.IdRaca} não existe.`,
      ],
      [
        ids.IdStatusPrenhez,
        this.prisma.statusPrenhez.findUnique({
          where: { IdStatusPrenhez: ids.IdStatusPrenhez ?? -1 },
        }),
        `Status Prenhez com ID ${ids.IdStatusPrenhez} não existe.`,
      ],
    ];

    for (const [id, busca, mensagem] of checagens) {
      if (id != null && !(await busca)) {
        throw new BadRequestException(mensagem);
      }
    }
  }

  async create(createGadoDto: CreateGadoDto) {
    const {
      IdTipoGado,
      IdSexo,
      ultimaInseminacao,
      quantidadePartos,
      producaoLeiteDiariaEmLitros,
      dataAbate,
      idadePrevistaAbate,
      ganhoDePesoMensal,
      volumeSemenDisponivel,
      motilidade,
      concentracao,
      IdStatusPrenhez,
      ...gadoData
    } = createGadoDto;

    // Tudo é validado antes de gravar, para não sobrar gado pela metade.
    this.validarSexoDoTipo(IdTipoGado, IdSexo);
    if (IdTipoGado === TIPO_GADO.LEITEIRO && IdStatusPrenhez == null) {
      throw new BadRequestException(
        'Status de prenhez é obrigatório para gado leiteiro.',
      );
    }
    if (IdTipoGado === TIPO_GADO.CORTE) {
      if (idadePrevistaAbate == null || ganhoDePesoMensal == null) {
        throw new BadRequestException(
          'Idade prevista de abate e ganho de peso mensal são obrigatórios para gado de corte.',
        );
      }
    }
    if (IdTipoGado === TIPO_GADO.REPRODUTOR) {
      if (
        volumeSemenDisponivel == null ||
        motilidade == null ||
        concentracao == null
      ) {
        throw new BadRequestException(
          'Volume de sêmen, motilidade e concentração são obrigatórios para gado reprodutor.',
        );
      }
    }
    await this.validarReferencias({
      IdTipoGado,
      IdFazenda: gadoData.IdFazenda,
      IdSexo,
      IdRaca: gadoData.IdRaca,
      IdStatusPrenhez:
        IdTipoGado === TIPO_GADO.LEITEIRO ? IdStatusPrenhez : undefined,
    });

    return this.prisma.$transaction(async (tx) => {
      const gado = await tx.gado.create({
        data: { ...gadoData, IdTipoGado, IdSexo },
      });

      switch (IdTipoGado) {
        case TIPO_GADO.LEITEIRO:
          await tx.gadoFemea.create({
            data: {
              IdGadoFemea: gado.IdGado,
              IdStatusPrenhez,
              GadoLeiteiro: {
                create: {
                  UltimaInseminacao: ultimaInseminacao,
                  QuantidadePartos: quantidadePartos,
                  ProducaoLeiteDiariaEmLitros: producaoLeiteDiariaEmLitros,
                },
              },
            },
          });
          break;

        case TIPO_GADO.CORTE:
          await tx.gadoMacho.create({
            data: {
              IdGadoMacho: gado.IdGado,
              GadoCorte: {
                create: {
                  DataAbate: dataAbate,
                  IdadePrevistaAbate: idadePrevistaAbate,
                  GanhoDePesoMensal: ganhoDePesoMensal,
                },
              },
            },
          });
          break;

        case TIPO_GADO.REPRODUTOR:
          await tx.gadoMacho.create({
            data: {
              IdGadoMacho: gado.IdGado,
              GadoReprodutor: {
                create: {
                  VolumeSemenDisponivel: volumeSemenDisponivel,
                  Motilidade: motilidade,
                  Concentracao: concentracao,
                },
              },
            },
          });
          break;
      }

      return gado;
    });
  }

  async update(id: number, updateGadoDto: UpdateGadoDto) {
    const {
      IdTipoGado,
      IdSexo,
      ultimaInseminacao,
      quantidadePartos,
      producaoLeiteDiariaEmLitros,
      dataAbate,
      idadePrevistaAbate,
      ganhoDePesoMensal,
      volumeSemenDisponivel,
      motilidade,
      concentracao,
      IdStatusPrenhez,
      ...gadoData
    } = updateGadoDto;

    const existente = await this.prisma.gado.findUnique({
      where: { IdGado: id },
      select: { IdTipoGado: true, IdSexo: true },
    });
    if (!existente) {
      throw new BadRequestException(`Gado com ID ${id} não encontrado.`);
    }

    // Trocar o tipo exigiria mover os dados entre as tabelas específicas.
    if (IdTipoGado !== undefined && IdTipoGado !== existente.IdTipoGado) {
      throw new BadRequestException(
        'Não é possível alterar o tipo de um gado já cadastrado.',
      );
    }
    const tipo = existente.IdTipoGado;
    this.validarSexoDoTipo(tipo, IdSexo ?? existente.IdSexo);
    await this.validarReferencias({
      IdFazenda: gadoData.IdFazenda,
      IdSexo,
      IdRaca: gadoData.IdRaca,
      IdStatusPrenhez:
        tipo === TIPO_GADO.LEITEIRO ? IdStatusPrenhez : undefined,
    });

    return this.prisma.$transaction(async (tx) => {
      const gado = await tx.gado.update({
        where: { IdGado: id },
        data: { ...gadoData, IdSexo },
      });

      switch (tipo) {
        case TIPO_GADO.LEITEIRO:
          if (IdStatusPrenhez !== undefined) {
            await tx.gadoFemea.update({
              where: { IdGadoFemea: id },
              data: { IdStatusPrenhez },
            });
          }
          await tx.gadoLeiteiro.update({
            where: { IdGadoFemea: id },
            data: {
              UltimaInseminacao: ultimaInseminacao,
              QuantidadePartos: quantidadePartos,
              ProducaoLeiteDiariaEmLitros: producaoLeiteDiariaEmLitros,
            },
          });
          break;

        case TIPO_GADO.CORTE:
          await tx.gadoCorte.update({
            where: { IdGadoMacho: id },
            data: {
              DataAbate: dataAbate,
              IdadePrevistaAbate: idadePrevistaAbate,
              GanhoDePesoMensal: ganhoDePesoMensal,
            },
          });
          break;

        case TIPO_GADO.REPRODUTOR:
          await tx.gadoReprodutor.update({
            where: { IdGadoMacho: id },
            data: {
              VolumeSemenDisponivel: volumeSemenDisponivel,
              Motilidade: motilidade,
              Concentracao: concentracao,
            },
          });
          break;
      }

      return gado;
    });
  }

  async BuscarAnimalPorFazenda(fazendaId: number) {
    return this.prisma.gado.findMany({
      where: {
        IdFazenda: fazendaId,
      },
      include: {
        Sexo: true,
        TipoGado: true,
        Raca: true,
      },
    });
  }

  async vacinarGado(vacinarGadoDto: VacinarGadoDto) {
    const { IdGado, IdVacina, DataAplicacao, DataProxima } = vacinarGadoDto;

    const vacina = await this.prisma.vacina.findUnique({
      where: { IdVacina },
    });

    if (!vacina) {
      throw new BadRequestException(`Vacina com ID ${IdVacina} não existe.`);
    }

    return this.prisma.animalVacina.create({
      data: {
        IdGado,
        IdVacina: vacina.IdVacina,
        DataAplicacao,
        DataProxima,
      },
    });
  }

  async BuscarGadoPorId(gadoId: number) {
    const gado = await this.prisma.gado.findUnique({
      where: { IdGado: gadoId },
      include: {
        Sexo: true,
        TipoGado: true,
        Raca: true,
        GadoFemea: {
          include: { GadoLeiteiro: true, StatusPrenhez: true },
        },
        GadoMacho: {
          include: { GadoCorte: true, GadoReprodutor: true },
        },
      },
    });

    if (!gado) {
      throw new BadRequestException(`Gado com ID ${gadoId} não encontrado.`);
    }

    return gado;
  }

  async BuscarVacinasPorGado(gadoId: number) {
    return this.prisma.animalVacina.findMany({
      where: {
        IdGado: gadoId,
      },
      include: {
        Vacinas: true,
      },
    });
  }
}
