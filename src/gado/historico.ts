import { Prisma } from '@prisma/client';

export type EntradaHistorico = {
  Campo: string;
  ValorAnterior?: string | null;
  ValorNovo?: string | null;
};

// Valores são guardados como texto para exibição: datas em ISO e números sem
// zeros à direita (o Decimal "100.00" e o número 100 viram "100").
export function normalizar(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === '') return null;
  if (valor instanceof Date) return valor.toISOString();
  if (valor instanceof Prisma.Decimal) return valor.toNumber().toString();
  if (typeof valor === 'number') return valor.toString();
  if (typeof valor === 'string') {
    // Datas que chegam como string no body.
    if (/^\d{4}-\d{2}-\d{2}T/.test(valor)) return new Date(valor).toISOString();
    return valor.trim().slice(0, 100);
  }
  return String(valor).slice(0, 100);
}

// Compara campo a campo; só entra no histórico o que foi enviado e mudou.
export function diferencas(
  campos: Record<string, [anterior: unknown, novo: unknown]>,
): EntradaHistorico[] {
  const entradas: EntradaHistorico[] = [];
  for (const [Campo, [anterior, novo]] of Object.entries(campos)) {
    if (novo === undefined) continue;
    const ValorAnterior = normalizar(anterior);
    const ValorNovo = normalizar(novo);
    if (ValorAnterior !== ValorNovo) {
      entradas.push({ Campo, ValorAnterior, ValorNovo });
    }
  }
  return entradas;
}
