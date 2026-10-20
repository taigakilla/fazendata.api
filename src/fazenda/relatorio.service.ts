import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';

export const TIPOS_RELATORIO = [
  'rebanho',
  'pesagens',
  'vacinas',
  'saidas',
] as const;
export type TipoRelatorio = (typeof TIPOS_RELATORIO)[number];

type Celula = string | number | null;

const data = (valor: Date | null | undefined) =>
  valor ? valor.toISOString().slice(0, 10) : null;

@Injectable()
export class RelatorioService {
  constructor(private readonly prisma: PrismaService) {}

  async gerar(
    idFazenda: number,
    tipo: TipoRelatorio,
    inicio?: Date,
    fim?: Date,
  ) {
    const fazenda = await this.prisma.fazenda.findUnique({
      where: { IdFazenda: idFazenda },
      select: { Nome: true },
    });
    const periodo =
      inicio || fim
        ? { ...(inicio && { gte: inicio }), ...(fim && { lte: fim }) }
        : undefined;

    let titulo: string;
    let colunas: string[];
    let linhas: Celula[][];

    switch (tipo) {
      case 'rebanho': {
        const gados = await this.prisma.gado.findMany({
          where: { IdFazenda: idFazenda, Ativo: true },
          include: {
            TipoGado: true,
            Sexo: true,
            Raca: true,
            Pai: true,
            Mae: true,
            GadoFemea: { include: { StatusPrenhez: true } },
          },
          orderBy: { NumeroIdentificacao: 'asc' },
        });
        titulo = 'Rebanho';
        colunas = [
          'Número',
          'Nome',
          'Tipo',
          'Sexo',
          'Raça',
          'Nascimento',
          'Peso atual (kg)',
          'Prenhez',
          'Pai',
          'Mãe',
        ];
        linhas = gados.map((gado) => [
          gado.NumeroIdentificacao,
          gado.Nome,
          gado.TipoGado.TipoDoGado.trim(),
          gado.Sexo.Descricao.trim(),
          gado.Raca.Nome,
          data(gado.DataNascimento),
          gado.PesoAtual.toNumber(),
          gado.GadoFemea?.StatusPrenhez.Descricao.trim() ?? null,
          gado.Pai?.Nome ?? null,
          gado.Mae?.Nome ?? null,
        ]);
        break;
      }
      case 'pesagens': {
        const pesagens = await this.prisma.gadoHistorico.findMany({
          where: {
            Campo: 'PesoAtual',
            Gado: { IdFazenda: idFazenda },
            ...(periodo && { CriadoEm: periodo }),
          },
          include: { Gado: true, Pessoa: true },
          orderBy: { CriadoEm: 'asc' },
        });
        titulo = 'Pesagens';
        colunas = ['Data', 'Número', 'Nome', 'Peso anterior', 'Peso', 'Por'];
        linhas = pesagens.map((pesagem) => [
          data(pesagem.CriadoEm),
          pesagem.Gado.NumeroIdentificacao,
          pesagem.Gado.Nome,
          pesagem.ValorAnterior == null ? null : Number(pesagem.ValorAnterior),
          Number(pesagem.ValorNovo),
          pesagem.Pessoa?.Nome ?? null,
        ]);
        break;
      }
      case 'vacinas': {
        const aplicacoes = await this.prisma.animalVacina.findMany({
          where: {
            Gado: { IdFazenda: idFazenda },
            ...(periodo && { DataAplicacao: periodo }),
          },
          include: { Gado: true, Vacinas: true },
          orderBy: { DataAplicacao: 'asc' },
        });
        titulo = 'Vacinas aplicadas';
        colunas = ['Aplicação', 'Número', 'Nome', 'Vacina', 'Próxima dose'];
        linhas = aplicacoes.map((aplicacao) => [
          data(aplicacao.DataAplicacao),
          aplicacao.Gado.NumeroIdentificacao,
          aplicacao.Gado.Nome,
          aplicacao.Vacinas.Nome,
          data(aplicacao.DataProxima),
        ]);
        break;
      }
      case 'saidas': {
        const gados = await this.prisma.gado.findMany({
          where: {
            IdFazenda: idFazenda,
            Ativo: false,
            ...(periodo && { DataSaida: periodo }),
          },
          include: { TipoGado: true },
          orderBy: { DataSaida: 'asc' },
        });
        titulo = 'Saídas do rebanho';
        colunas = ['Data', 'Número', 'Nome', 'Tipo', 'Motivo', 'Observação'];
        linhas = gados.map((gado) => [
          data(gado.DataSaida),
          gado.NumeroIdentificacao,
          gado.Nome,
          gado.TipoGado.TipoDoGado.trim(),
          gado.MotivoSaida,
          gado.ObservacaoSaida,
        ]);
        break;
      }
      default:
        throw new BadRequestException('Tipo de relatório inválido.');
    }

    return {
      Titulo: titulo,
      Fazenda: fazenda.Nome,
      Inicio: data(inicio),
      Fim: data(fim),
      GeradoEm: new Date(),
      Colunas: colunas,
      Linhas: linhas,
    };
  }
}
