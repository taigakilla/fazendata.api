// Dados iniciais do banco. Pode rodar quantas vezes quiser (`npx prisma db seed`):
// tudo é feito com upsert, então não duplica nem sobrescreve o que já existe
// além das descrições das tabelas de apoio.
import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

// Os IDs são fixos porque o app e a API usam alguns deles diretamente
// (ex.: tipo de gado 1 = leiteiro, sexo 2 = fêmea).
const SEXOS = ['Masculino', 'Feminino', 'Outro'];
const TIPOS_USUARIO = ['Administrador', 'Gerente', 'Funcionário'];
const TIPOS_GADO = ['Leiteiro', 'Corte', 'Reprodutor'];
const STATUS_PRENHEZ = [
  'Não Prenha',
  'Prenha',
  'Inseminada',
  'Abortou',
  'Indefinido',
  'Parto Recente',
];
const RACAS = [
  'Girolando',
  'Nelore',
  'Angus',
  'Hereford',
  'Gir',
  'Holandesa',
  'Jersey',
  'Guzerá',
  'Brahman',
  'Tabapuã',
  'Senepol',
  'Mestiço',
];
const TIPOS_LOGRADOURO = [
  'Rua',
  'Avenida',
  'Travessa',
  'Estrada',
  'Rodovia',
  'Alameda',
  'Praça',
  'Sítio',
  'Fazenda',
];
const ESTADOS: [string, string][] = [
  ['AC', 'Acre'],
  ['AL', 'Alagoas'],
  ['AP', 'Amapá'],
  ['AM', 'Amazonas'],
  ['BA', 'Bahia'],
  ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'],
  ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'],
  ['MA', 'Maranhão'],
  ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'],
  ['PA', 'Pará'],
  ['PB', 'Paraíba'],
  ['PR', 'Paraná'],
  ['PE', 'Pernambuco'],
  ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'],
  ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'],
  ['RR', 'Roraima'],
  ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'],
  ['SE', 'Sergipe'],
  ['TO', 'Tocantins'],
];

// Após inserir com IDs explícitos, o autoincrement precisa continuar do maior ID.
async function ajustarSequencia(tabela: string, coluna: string) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${tabela}"', '${coluna}'), COALESCE((SELECT MAX("${coluna}") FROM "${tabela}"), 1))`,
  );
}

async function main() {
  for (const [i, Descricao] of SEXOS.entries()) {
    await prisma.sexo.upsert({
      where: { IdSexo: i + 1 },
      update: { Descricao },
      create: { IdSexo: i + 1, Descricao },
    });
  }
  await ajustarSequencia('Sexo', 'IdSexo');

  for (const [i, Descricao] of TIPOS_USUARIO.entries()) {
    await prisma.tipoUsuario.upsert({
      where: { IdTipoUsuario: i + 1 },
      update: { Descricao },
      create: { IdTipoUsuario: i + 1, Descricao },
    });
  }
  await ajustarSequencia('TipoUsuario', 'IdTipoUsuario');

  for (const [i, TipoDoGado] of TIPOS_GADO.entries()) {
    await prisma.tipoGado.upsert({
      where: { IdTipoGado: i + 1 },
      update: { TipoDoGado },
      create: { IdTipoGado: i + 1, TipoDoGado },
    });
  }
  await ajustarSequencia('TipoGado', 'IdTipoGado');

  for (const [i, Descricao] of STATUS_PRENHEZ.entries()) {
    await prisma.statusPrenhez.upsert({
      where: { IdStatusPrenhez: i + 1 },
      update: { Descricao },
      create: { IdStatusPrenhez: i + 1, Descricao },
    });
  }
  await ajustarSequencia('StatusPrenhez', 'IdStatusPrenhez');

  for (const [i, Nome] of RACAS.entries()) {
    await prisma.raca.upsert({
      where: { IdRaca: i + 1 },
      update: { Nome },
      create: { IdRaca: i + 1, Nome },
    });
  }
  await ajustarSequencia('Raca', 'IdRaca');

  for (const [i, Descricao] of TIPOS_LOGRADOURO.entries()) {
    await prisma.tipoLogradouro.upsert({
      where: { IdTipoLogradouro: i + 1 },
      update: { Descricao },
      create: { IdTipoLogradouro: i + 1, Descricao },
    });
  }
  await ajustarSequencia('TipoLogradouro', 'IdTipoLogradouro');

  for (const [UF, NomeEstado] of ESTADOS) {
    await prisma.unidadeFederativa.upsert({
      where: { UF },
      update: { NomeEstado },
      create: { UF, NomeEstado },
    });
  }

  // Usuário administrador inicial. Se já existir, a senha não é alterada.
  const email = process.env.LOGIN_ADM;
  const senha = process.env.SENHA_ADM;
  if (!email || !senha) {
    console.warn('LOGIN_ADM/SENHA_ADM não definidos; admin não foi criado.');
    return;
  }

  const admin = await prisma.usuario.findUnique({ where: { email } });
  if (!admin) {
    await prisma.pessoa.create({
      data: {
        Nome: 'Administrador Padrão',
        IdSexo: 3,
        Usuario: {
          create: {
            email,
            password: await bcryptjs.hash(senha, 10),
            IdTipoUsuario: 1,
          },
        },
      },
    });
    console.log(`Usuário administrador ${email} criado.`);
  }
}

main()
  .then(() => console.log('Seed concluído.'))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
