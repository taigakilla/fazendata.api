export const TIPO_USUARIO = {
  ADMINISTRADOR: 1,
  GERENTE: 2,
  FUNCIONARIO: 3,
} as const;

export type Permissao =
  | 'fazenda.cadastrar'
  | 'usuario.cadastrar'
  | 'gado.cadastrar'
  | 'gado.editar'
  | 'gado.saida'
  | 'gado.pesar'
  | 'gado.vacinar'
  | 'relatorio.gerar';

const FUNCIONARIO: Permissao[] = ['gado.pesar', 'gado.vacinar'];
const GERENTE: Permissao[] = [
  ...FUNCIONARIO,
  'gado.cadastrar',
  'gado.editar',
  'gado.saida',
  'relatorio.gerar',
];
const ADMINISTRADOR: Permissao[] = [
  ...GERENTE,
  'fazenda.cadastrar',
  'usuario.cadastrar',
];

export const PERMISSOES: Record<number, Permissao[]> = {
  [TIPO_USUARIO.ADMINISTRADOR]: ADMINISTRADOR,
  [TIPO_USUARIO.GERENTE]: GERENTE,
  [TIPO_USUARIO.FUNCIONARIO]: FUNCIONARIO,
};
