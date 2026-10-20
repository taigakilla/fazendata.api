import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AcessoService } from '../shared/acesso/acesso.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateGadoDto } from './dto/create-gado.dto';
import { PesagemDto } from './dto/pesagem.dto';
import { SaidaDto } from './dto/saida.dto';
import { UpdateGadoDto } from './dto/update-gado.dto';
import { VacinarGadoDto } from './dto/vacinar-gado.dto';
import { diferencas, EntradaHistorico, normalizar } from './historico';
import { previsaoParto, situacaoVacinas } from './indicadores';

export const TIPO_GADO = { LEITEIRO: 1, CORTE: 2, REPRODUTOR: 3 } as const;
export const SEXO = { MACHO: 1, FEMEA: 2 } as const;

@Injectable()
export class GadoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly acesso: AcessoService,
  ) {}

  private async garantirAtivo(idGado: number) {
    const gado = await this.prisma.gado.findUnique({
      where: { IdGado: idGado },
      select: { Ativo: true },
    });
    if (!gado) {
      throw new BadRequestException(`Gado com ID ${idGado} não encontrado.`);
    }
    if (!gado.Ativo) {
      throw new BadRequestException('Este animal já saiu do rebanho.');
    }
  }

  private async validarGenealogia(
    idPessoa: number,
    dados: {
      IdGado?: number;
      IdPai?: number | null;
      IdMae?: number | null;
      DataNascimento: Date;
    },
  ) {
    const pais: [number | null | undefined, number, string][] = [
      [dados.IdPai, SEXO.MACHO, 'pai'],
      [dados.IdMae, SEXO.FEMEA, 'mãe'],
    ];
    for (const [id, sexo, papel] of pais) {
      if (id == null) continue;
      if (id === dados.IdGado) {
        throw new BadRequestException(
          `O animal não pode ser a própria ${papel}.`,
        );
      }
      await this.acesso.garantirAcessoGado(idPessoa, id);
      const parente = await this.prisma.gado.findUnique({
        where: { IdGado: id },
        select: { IdSexo: true, DataNascimento: true },
      });
      if (parente.IdSexo !== sexo) {
        throw new BadRequestException(
          papel === 'pai' ? 'O pai deve ser macho.' : 'A mãe deve ser fêmea.',
        );
      }
      if (parente.DataNascimento >= new Date(dados.DataNascimento)) {
        throw new BadRequestException(
          `O(a) ${papel} deve ter nascido antes do animal.`,
        );
      }
    }
  }

  private async nomeDoGado(id: number | null | undefined) {
    if (id == null) return id;
    const gado = await this.prisma.gado.findUnique({
      where: { IdGado: id },
      select: { Nome: true, NumeroIdentificacao: true },
    });
    return gado ? gado.Nome || `Nº ${gado.NumeroIdentificacao}` : null;
  }

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

  async create(createGadoDto: CreateGadoDto, idPessoa?: number) {
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
    if (idPessoa) {
      await this.validarGenealogia(idPessoa, {
        IdPai: gadoData.IdPai,
        IdMae: gadoData.IdMae,
        DataNascimento: gadoData.DataNascimento,
      });
    }

    const status =
      IdTipoGado === TIPO_GADO.LEITEIRO
        ? await this.prisma.statusPrenhez.findUnique({
            where: { IdStatusPrenhez },
          })
        : null;

    return this.prisma.$transaction(async (tx) => {
      const gado = await tx.gado.create({
        data: { ...gadoData, IdTipoGado, IdSexo },
      });

      // Ponto de partida do histórico (peso, prenhez e inseminação).
      const entradas: EntradaHistorico[] = [
        {
          Campo: 'Cadastro',
          ValorNovo: gado.Nome || `Nº ${gado.NumeroIdentificacao}`,
        },
        { Campo: 'PesoAtual', ValorNovo: normalizar(gado.PesoAtual) },
      ];
      if (status) {
        entradas.push({
          Campo: 'StatusPrenhez',
          ValorNovo: status.Descricao.trim(),
        });
      }
      if (ultimaInseminacao) {
        entradas.push({
          Campo: 'UltimaInseminacao',
          ValorNovo: normalizar(ultimaInseminacao),
        });
      }
      await tx.gadoHistorico.createMany({
        data: entradas.map((entrada) => ({
          ...entrada,
          IdGado: gado.IdGado,
          IdPessoa: idPessoa,
        })),
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

  async update(id: number, updateGadoDto: UpdateGadoDto, idPessoa?: number) {
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
      include: {
        Sexo: true,
        Raca: true,
        Fazenda: true,
        Pai: true,
        Mae: true,
        GadoFemea: { include: { StatusPrenhez: true, GadoLeiteiro: true } },
        GadoMacho: { include: { GadoCorte: true, GadoReprodutor: true } },
      },
    });
    if (!existente) {
      throw new BadRequestException(`Gado com ID ${id} não encontrado.`);
    }
    if (!existente.Ativo) {
      throw new BadRequestException('Este animal já saiu do rebanho.');
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
    if (idPessoa && (gadoData.IdPai != null || gadoData.IdMae != null)) {
      await this.validarGenealogia(idPessoa, {
        IdGado: id,
        IdPai: gadoData.IdPai,
        IdMae: gadoData.IdMae,
        DataNascimento: gadoData.DataNascimento ?? existente.DataNascimento,
      });
    }

    const entradas = await this.calcularAlteracoes(existente, updateGadoDto);
    // Mesmo instante no gado e no histórico, para a comparação com a tag NFC.
    const agora = new Date();

    return this.prisma.$transaction(async (tx) => {
      const gado = await tx.gado.update({
        where: { IdGado: id },
        data: {
          ...gadoData,
          IdSexo,
          ...(entradas.length > 0 && { AtualizadoEm: agora }),
        },
      });

      if (entradas.length > 0) {
        await tx.gadoHistorico.createMany({
          data: entradas.map((entrada) => ({
            ...entrada,
            IdGado: id,
            IdPessoa: idPessoa,
            CriadoEm: agora,
          })),
        });
      }

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

  private async calcularAlteracoes(
    existente: Prisma.GadoGetPayload<{
      include: {
        Sexo: true;
        Raca: true;
        Fazenda: true;
        Pai: true;
        Mae: true;
        GadoFemea: { include: { StatusPrenhez: true; GadoLeiteiro: true } };
        GadoMacho: { include: { GadoCorte: true; GadoReprodutor: true } };
      };
    }>,
    dto: UpdateGadoDto,
  ) {
    // Para ids, o histórico guarda o nome (ex.: raça "Nelore"), não o número.
    const [sexo, raca, fazenda, status, pai, mae] = await Promise.all([
      dto.IdSexo != null
        ? this.prisma.sexo.findUnique({ where: { IdSexo: dto.IdSexo } })
        : null,
      dto.IdRaca != null
        ? this.prisma.raca.findUnique({ where: { IdRaca: dto.IdRaca } })
        : null,
      dto.IdFazenda != null
        ? this.prisma.fazenda.findUnique({
            where: { IdFazenda: dto.IdFazenda },
          })
        : null,
      dto.IdStatusPrenhez != null
        ? this.prisma.statusPrenhez.findUnique({
            where: { IdStatusPrenhez: dto.IdStatusPrenhez },
          })
        : null,
      this.nomeDoGado(dto.IdPai),
      this.nomeDoGado(dto.IdMae),
    ]);
    const nome = (
      gado: { Nome: string; NumeroIdentificacao: number } | null,
    ) => (gado ? gado.Nome || `Nº ${gado.NumeroIdentificacao}` : null);
    const leiteiro = existente.GadoFemea?.GadoLeiteiro;
    const corte = existente.GadoMacho?.GadoCorte;
    const reprodutor = existente.GadoMacho?.GadoReprodutor;

    return diferencas({
      Nome: [existente.Nome, dto.Nome],
      NumeroIdentificacao: [
        existente.NumeroIdentificacao,
        dto.NumeroIdentificacao,
      ],
      DataNascimento: [existente.DataNascimento, dto.DataNascimento],
      Sexo: [existente.Sexo.Descricao.trim(), sexo?.Descricao.trim()],
      Raca: [existente.Raca.Nome, raca?.Nome],
      Fazenda: [existente.Fazenda.Nome, fazenda?.Nome],
      PesoNascimentoEmKg: [
        existente.PesoNascimentoEmKg,
        dto.PesoNascimentoEmKg,
      ],
      PesoAtual: [existente.PesoAtual, dto.PesoAtual],
      Pai: [nome(existente.Pai), pai],
      Mae: [nome(existente.Mae), mae],
      ...(existente.GadoFemea && {
        StatusPrenhez: [
          existente.GadoFemea.StatusPrenhez.Descricao.trim(),
          status?.Descricao.trim(),
        ],
        UltimaInseminacao: [leiteiro?.UltimaInseminacao, dto.ultimaInseminacao],
        QuantidadePartos: [leiteiro?.QuantidadePartos, dto.quantidadePartos],
        ProducaoLeiteDiariaEmLitros: [
          leiteiro?.ProducaoLeiteDiariaEmLitros,
          dto.producaoLeiteDiariaEmLitros,
        ],
      }),
      ...(corte && {
        DataAbate: [corte.DataAbate, dto.dataAbate],
        IdadePrevistaAbate: [corte.IdadePrevistaAbate, dto.idadePrevistaAbate],
        GanhoDePesoMensal: [corte.GanhoDePesoMensal, dto.ganhoDePesoMensal],
      }),
      ...(reprodutor && {
        VolumeSemenDisponivel: [
          reprodutor.VolumeSemenDisponivel,
          dto.volumeSemenDisponivel,
        ],
        Motilidade: [reprodutor.Motilidade, dto.motilidade],
        Concentracao: [reprodutor.Concentracao, dto.concentracao],
      }),
    });
  }

  async BuscarHistorico(gadoId: number, desde?: Date) {
    return this.prisma.gadoHistorico.findMany({
      where: { IdGado: gadoId, ...(desde && { CriadoEm: { gt: desde } }) },
      include: { Pessoa: { select: { IdPessoa: true, Nome: true } } },
      orderBy: [{ CriadoEm: 'desc' }, { IdHistorico: 'desc' }],
    });
  }

  async BuscarAnimalPorFazenda(fazendaId: number, inativos = false) {
    const gados = await this.prisma.gado.findMany({
      where: {
        IdFazenda: fazendaId,
        ...(!inativos && { Ativo: true }),
      },
      include: {
        Sexo: true,
        TipoGado: true,
        Raca: true,
        GadoFemea: { include: { StatusPrenhez: true, GadoLeiteiro: true } },
        AnimalVacina: {
          select: { IdVacina: true, DataAplicacao: true, DataProxima: true },
        },
      },
      orderBy: [{ Ativo: 'desc' }, { Nome: 'asc' }],
    });
    const agora = new Date();
    return gados.map(({ AnimalVacina, ...gado }) => {
      const vacinas = situacaoVacinas(AnimalVacina, agora);
      return {
        ...gado,
        PrevisaoParto: previsaoParto(gado.GadoFemea),
        VacinasAtrasadas: vacinas.atrasadas.length,
        VacinasProximas: vacinas.proximas.length,
      };
    });
  }

  async pesar(id: number, dto: PesagemDto, idPessoa: number) {
    await this.garantirAtivo(id);
    const atual = await this.prisma.gado.findUnique({
      where: { IdGado: id },
      select: { PesoAtual: true },
    });
    const agora = new Date();
    return this.prisma.$transaction(async (tx) => {
      const gado = await tx.gado.update({
        where: { IdGado: id },
        data: { PesoAtual: dto.PesoAtual, AtualizadoEm: agora },
      });
      await tx.gadoHistorico.create({
        data: {
          IdGado: id,
          Campo: 'PesoAtual',
          ValorAnterior: normalizar(atual.PesoAtual),
          ValorNovo: normalizar(dto.PesoAtual),
          IdPessoa: idPessoa,
          CriadoEm: agora,
        },
      });
      return gado;
    });
  }

  async registrarSaida(id: number, dto: SaidaDto, idPessoa: number) {
    const gado = await this.prisma.gado.findUnique({
      where: { IdGado: id },
      include: { Fazenda: true },
    });
    if (!gado) {
      throw new BadRequestException(`Gado com ID ${id} não encontrado.`);
    }
    if (!gado.Ativo) {
      throw new BadRequestException('Este animal já saiu do rebanho.');
    }

    const agora = new Date();
    const entradas: EntradaHistorico[] = [];
    let data: Prisma.GadoUncheckedUpdateInput;

    if (dto.Motivo === 'Transferencia') {
      if (dto.IdFazendaDestino == null) {
        throw new BadRequestException('Informe a fazenda de destino.');
      }
      if (dto.IdFazendaDestino === gado.IdFazenda) {
        throw new BadRequestException('O animal já está nesta fazenda.');
      }
      await this.acesso.garantirAcessoFazenda(idPessoa, dto.IdFazendaDestino);
      const destino = await this.prisma.fazenda.findUnique({
        where: { IdFazenda: dto.IdFazendaDestino },
      });
      data = { IdFazenda: destino.IdFazenda, AtualizadoEm: agora };
      entradas.push({
        Campo: 'Transferencia',
        ValorAnterior: gado.Fazenda.Nome,
        ValorNovo: destino.Nome,
      });
    } else {
      data = {
        Ativo: false,
        DataSaida: dto.Data,
        MotivoSaida: dto.Motivo,
        ObservacaoSaida: dto.Observacao?.trim() || null,
        AtualizadoEm: agora,
      };
      entradas.push({
        Campo: 'Saida',
        ValorNovo: [dto.Motivo, dto.Observacao?.trim()]
          .filter(Boolean)
          .join(' - ')
          .slice(0, 100),
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.gado.update({ where: { IdGado: id }, data });
      await tx.gadoHistorico.createMany({
        data: entradas.map((entrada) => ({
          ...entrada,
          IdGado: id,
          IdPessoa: idPessoa,
          CriadoEm: agora,
        })),
      });
      return atualizado;
    });
  }

  async BuscarGenealogia(id: number) {
    const resumo = {
      IdGado: true,
      Nome: true,
      NumeroIdentificacao: true,
      IdSexo: true,
      IdPai: true,
      IdMae: true,
      Ativo: true,
      Raca: { select: { Nome: true } },
    } as const;
    const gado = await this.prisma.gado.findUnique({
      where: { IdGado: id },
      select: {
        ...resumo,
        Pai: {
          select: {
            ...resumo,
            Pai: { select: resumo },
            Mae: { select: resumo },
          },
        },
        Mae: {
          select: {
            ...resumo,
            Pai: { select: resumo },
            Mae: { select: resumo },
          },
        },
        FilhosComoPai: { select: resumo, orderBy: { DataNascimento: 'asc' } },
        FilhosComoMae: { select: resumo, orderBy: { DataNascimento: 'asc' } },
      },
    });
    if (!gado) {
      throw new BadRequestException(`Gado com ID ${id} não encontrado.`);
    }

    const { Pai, Mae, FilhosComoPai, FilhosComoMae, ...animal } = gado;
    let consanguinidade = false;
    if (Pai && Mae) {
      const emComum = (a: number | null, b: number | null) =>
        a != null && a === b;
      consanguinidade =
        Mae.IdPai === Pai.IdGado ||
        Pai.IdMae === Mae.IdGado ||
        emComum(Pai.IdPai, Mae.IdPai) ||
        emComum(Pai.IdMae, Mae.IdMae);
    }
    return {
      ...animal,
      Pai,
      Mae,
      Filhos: [...FilhosComoPai, ...FilhosComoMae],
      Consanguinidade: consanguinidade,
    };
  }

  async vacinarGado(vacinarGadoDto: VacinarGadoDto, idPessoa?: number) {
    const { IdGado, IdVacina, DataAplicacao, DataProxima } = vacinarGadoDto;
    await this.garantirAtivo(IdGado);

    const vacina = await this.prisma.vacina.findUnique({
      where: { IdVacina },
    });

    if (!vacina) {
      throw new BadRequestException(`Vacina com ID ${IdVacina} não existe.`);
    }

    const agora = new Date();

    return this.prisma.$transaction(async (tx) => {
      const aplicacao = await tx.animalVacina.create({
        data: {
          IdGado,
          IdVacina: vacina.IdVacina,
          DataAplicacao,
          DataProxima,
        },
      });
      await tx.gado.update({
        where: { IdGado },
        data: { AtualizadoEm: agora },
      });
      await tx.gadoHistorico.create({
        data: {
          IdGado,
          Campo: 'Vacina',
          ValorNovo: vacina.Nome,
          IdPessoa: idPessoa,
          CriadoEm: agora,
        },
      });
      return aplicacao;
    });
  }

  async BuscarGadoPorId(gadoId: number) {
    const gado = await this.prisma.gado.findUnique({
      where: { IdGado: gadoId },
      include: {
        Sexo: true,
        TipoGado: true,
        Raca: true,
        Fazenda: { select: { IdFazenda: true, Nome: true } },
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

    return { ...gado, PrevisaoParto: previsaoParto(gado.GadoFemea) };
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
