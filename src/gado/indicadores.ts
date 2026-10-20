export const GESTACAO_DIAS = 283;
export const STATUS_PRENHEZ = { PRENHA: 2, INSEMINADA: 3 } as const;
const DIA_MS = 24 * 60 * 60 * 1000;

type Femea = {
  IdStatusPrenhez: number;
  GadoLeiteiro?: { UltimaInseminacao: Date | null } | null;
} | null;

export function previsaoParto(femea: Femea | undefined): Date | null {
  const inseminacao = femea?.GadoLeiteiro?.UltimaInseminacao;
  if (!inseminacao) return null;
  if (
    femea.IdStatusPrenhez !== STATUS_PRENHEZ.PRENHA &&
    femea.IdStatusPrenhez !== STATUS_PRENHEZ.INSEMINADA
  ) {
    return null;
  }
  return new Date(inseminacao.getTime() + GESTACAO_DIAS * DIA_MS);
}

type Aplicacao = {
  IdVacina: number;
  DataAplicacao: Date;
  DataProxima: Date | null;
};

export function situacaoVacinas(
  aplicacoes: Aplicacao[],
  agora = new Date(),
  dias = 7,
) {
  const ultimas = new Map<number, Aplicacao>();
  for (const aplicacao of aplicacoes) {
    const atual = ultimas.get(aplicacao.IdVacina);
    if (!atual || aplicacao.DataAplicacao > atual.DataAplicacao) {
      ultimas.set(aplicacao.IdVacina, aplicacao);
    }
  }
  const limite = new Date(agora.getTime() + dias * DIA_MS);
  const atrasadas: Aplicacao[] = [];
  const proximas: Aplicacao[] = [];
  for (const aplicacao of ultimas.values()) {
    if (!aplicacao.DataProxima) continue;
    if (aplicacao.DataProxima < agora) atrasadas.push(aplicacao);
    else if (aplicacao.DataProxima <= limite) proximas.push(aplicacao);
  }
  return { atrasadas, proximas };
}

export function diasEntre(inicio: Date, fim: Date) {
  return (fim.getTime() - inicio.getTime()) / DIA_MS;
}
