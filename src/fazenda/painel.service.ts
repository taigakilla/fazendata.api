import { Injectable } from '@nestjs/common';
import { TIPO_GADO } from '../gado/gado.service';
import {
  diasEntre,
  previsaoParto,
  situacaoVacinas,
  STATUS_PRENHEZ,
} from '../gado/indicadores';
import { PrismaService } from '../shared/prisma/prisma.service';

const DIA_MS = 24 * 60 * 60 * 1000;

type Tipo = 'leiteiro' | 'corte' | 'reprodutor';
type Alerta = {
  IdGado: number;
  Nome: string;
  Vacina?: string;
  DataProxima?: Date;
  PrevisaoParto?: Date;
  Confirmada?: boolean;
};

const nomeDe = (gado: { Nome: string; NumeroIdentificacao: number }) =>
  gado.Nome || `Nº ${gado.NumeroIdentificacao}`;

const media = (valores: number[]) =>
  valores.length
    ? Math.round(
        (valores.reduce((total, valor) => total + valor, 0) / valores.length) *
          100,
      ) / 100
    : null;

const porData = (a: Alerta, b: Alerta) =>
  (a.DataProxima ?? a.PrevisaoParto).getTime() -
  (b.DataProxima ?? b.PrevisaoParto).getTime();

@Injectable()
export class PainelService {
  constructor(private readonly prisma: PrismaService) {}

  async painel(idFazenda: number) {
    const agora = new Date();
    const gados = await this.prisma.gado.findMany({
      where: { IdFazenda: idFazenda, Ativo: true },
      include: {
        GadoFemea: { include: { GadoLeiteiro: true } },
        AnimalVacina: { include: { Vacinas: true } },
        Historico: {
          where: { Campo: 'PesoAtual' },
          orderBy: { CriadoEm: 'asc' },
          select: { ValorNovo: true, CriadoEm: true },
        },
      },
    });

    const porTipo: Record<Tipo, number> = {
      leiteiro: 0,
      corte: 0,
      reprodutor: 0,
    };
    const pesos: Record<Tipo, number[]> = {
      leiteiro: [],
      corte: [],
      reprodutor: [],
    };
    const ganhos: number[] = [];
    const vacinasAtrasadas: Alerta[] = [];
    const vacinasProximas: Alerta[] = [];
    const partos: Alerta[] = [];
    let prenhas = 0;
    let inseminadas = 0;

    for (const gado of gados) {
      const tipo: Tipo =
        gado.IdTipoGado === TIPO_GADO.LEITEIRO
          ? 'leiteiro'
          : gado.IdTipoGado === TIPO_GADO.CORTE
            ? 'corte'
            : 'reprodutor';
      porTipo[tipo]++;
      pesos[tipo].push(gado.PesoAtual.toNumber());

      const status = gado.GadoFemea?.IdStatusPrenhez;
      if (status === STATUS_PRENHEZ.PRENHA) prenhas++;
      if (status === STATUS_PRENHEZ.INSEMINADA) inseminadas++;

      if (tipo === 'corte' && gado.Historico.length >= 2) {
        const primeiro = gado.Historico[0];
        const ultimo = gado.Historico[gado.Historico.length - 1];
        const dias = diasEntre(primeiro.CriadoEm, ultimo.CriadoEm);
        if (dias >= 1) {
          ganhos.push(
            (Number(ultimo.ValorNovo) - Number(primeiro.ValorNovo)) / dias,
          );
        }
      }

      const vacinas = situacaoVacinas(gado.AnimalVacina, agora);
      const alerta = (aplicacao: (typeof vacinas.atrasadas)[number]) => ({
        IdGado: gado.IdGado,
        Nome: nomeDe(gado),
        Vacina: gado.AnimalVacina.find(
          (item) => item.IdVacina === aplicacao.IdVacina,
        ).Vacinas.Nome,
        DataProxima: aplicacao.DataProxima,
      });
      vacinasAtrasadas.push(...vacinas.atrasadas.map(alerta));
      vacinasProximas.push(...vacinas.proximas.map(alerta));

      const parto = previsaoParto(gado.GadoFemea);
      if (
        parto &&
        parto.getTime() >= agora.getTime() - 30 * DIA_MS &&
        parto.getTime() <= agora.getTime() + 60 * DIA_MS
      ) {
        partos.push({
          IdGado: gado.IdGado,
          Nome: nomeDe(gado),
          PrevisaoParto: parto,
          Confirmada: status === STATUS_PRENHEZ.PRENHA,
        });
      }
    }

    const saidas = await this.prisma.gado.groupBy({
      by: ['MotivoSaida'],
      where: {
        IdFazenda: idFazenda,
        Ativo: false,
        DataSaida: { gte: new Date(agora.getTime() - 365 * DIA_MS) },
      },
      _count: true,
    });

    return {
      Total: gados.length,
      PorTipo: porTipo,
      Prenhas: prenhas,
      Inseminadas: inseminadas,
      PesoMedio: {
        leiteiro: media(pesos.leiteiro),
        corte: media(pesos.corte),
        reprodutor: media(pesos.reprodutor),
      },
      GanhoMedioDiarioCorte: media(ganhos),
      VacinasAtrasadas: vacinasAtrasadas.sort(porData),
      VacinasProximas: vacinasProximas.sort(porData),
      PartosPrevistos: partos.sort(porData),
      SaidasUltimoAno: Object.fromEntries(
        saidas.map((saida) => [saida.MotivoSaida, saida._count]),
      ),
    };
  }
}
