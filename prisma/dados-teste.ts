// Popula o banco com dados de exemplo: 3 contas (uma por tipo de usuário),
// fazendas, vacinas e gados com histórico de peso, prenhez e vacinação.
// Uso: npm run dados-teste  (rode o seed antes). Não roda duas vezes: se as
// contas de teste já existirem, o script para sem alterar nada.
import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

const SENHA = 'Pass123$';
const DIA = 24 * 60 * 60 * 1000;
const hoje = new Date();
const diasAtras = (dias: number) => new Date(hoje.getTime() - dias * DIA);

const CONTAS = [
  {
    email: 'admin.teste@fazendata.com',
    Nome: 'Carlos Mendes',
    IdSexo: 1,
    IdTipoUsuario: 1, // Administrador
  },
  {
    email: 'gerente.teste@fazendata.com',
    Nome: 'Ana Souza',
    IdSexo: 2,
    IdTipoUsuario: 2, // Gerente
  },
  {
    email: 'funcionario.teste@fazendata.com',
    Nome: 'João Pereira',
    IdSexo: 1,
    IdTipoUsuario: 3, // Funcionário
  },
];

// dono e quem tem acesso, pelo índice em CONTAS.
const FAZENDAS = [
  {
    Nome: 'Fazenda Boa Vista',
    dono: 0,
    acesso: [0, 1, 2],
    endereco: {
      IdTipoLogradouro: 4, // Estrada
      Logradouro: 'Municipal do Pântano',
      Numero: 1200,
      Bairro: 'Zona Rural',
      CEP: 38700000,
      Cidade: 'Patos de Minas',
      UF: 'MG',
    },
  },
  {
    Nome: 'Sítio Santa Luzia',
    dono: 1,
    acesso: [0, 1],
    endereco: {
      IdTipoLogradouro: 5, // Rodovia
      Logradouro: 'BR-365, km 412',
      Numero: 0,
      Bairro: 'Zona Rural',
      CEP: 38500000,
      Cidade: 'Monte Carmelo',
      UF: 'MG',
    },
  },
  {
    Nome: 'Estância Rio Verde',
    dono: 0,
    acesso: [0, 2],
    endereco: {
      IdTipoLogradouro: 4, // Estrada
      Logradouro: 'do Rio Verde',
      Numero: 85,
      Bairro: 'Distrito de Rio Verde',
      CEP: 75901000,
      Cidade: 'Rio Verde',
      UF: 'GO',
    },
  },
];

const VACINAS = [
  { Nome: 'Febre Aftosa', Descricao: 'Dose semestral obrigatória' },
  { Nome: 'Brucelose', Descricao: 'Fêmeas de 3 a 8 meses, dose única' },
  { Nome: 'Raiva', Descricao: 'Reforço anual' },
  { Nome: 'Clostridiose', Descricao: 'Reforço anual' },
  { Nome: 'Leptospirose', Descricao: 'Reforço semestral' },
];

type Pesagem = [dias: number, peso: number];

type GadoTeste = {
  Nome: string;
  fazenda: number;
  numero: number;
  tipo: 1 | 2 | 3; // 1 leiteiro, 2 corte, 3 reprodutor
  raca: number; // ver RACAS no seed.ts
  nascimento: Date;
  pesoNascimento: number;
  pesagens: Pesagem[]; // a última é o peso atual
  vacinas: [dias: number, vacina: number, proximaEmDias: number][];
  leiteiro?: {
    status: [dias: number, IdStatusPrenhez: number][]; // o último é o atual
    inseminacoes: number[]; // dias atrás
    partos: number;
    leite: number;
  };
  corte?: { idadeAbate: number; ganho: number; abateEmDias?: number };
  reprodutor?: { volume: string; motilidade: number; concentracao: number };
};

const GADOS: GadoTeste[] = [
  {
    Nome: 'Mimosa',
    fazenda: 0,
    numero: 101,
    tipo: 1,
    raca: 1, // Girolando
    nascimento: diasAtras(1460),
    pesoNascimento: 34,
    pesagens: [
      [180, 455],
      [120, 468],
      [60, 472.5],
      [10, 480],
    ],
    vacinas: [
      [150, 0, 30],
      [40, 3, 325],
    ],
    leiteiro: {
      status: [
        [180, 1],
        [95, 3],
        [50, 2],
      ],
      inseminacoes: [210, 95],
      partos: 2,
      leite: 18.5,
    },
  },
  {
    Nome: 'Estrela',
    fazenda: 0,
    numero: 102,
    tipo: 1,
    raca: 6, // Holandesa
    nascimento: diasAtras(1825),
    pesoNascimento: 38,
    pesagens: [
      [150, 560],
      [90, 548],
      [20, 571],
    ],
    vacinas: [
      [140, 0, 40],
      [140, 4, 40],
    ],
    leiteiro: {
      status: [
        [150, 2],
        [30, 6],
      ],
      inseminacoes: [320],
      partos: 3,
      leite: 27.3,
    },
  },
  {
    Nome: 'Pintada',
    fazenda: 0,
    numero: 103,
    tipo: 1,
    raca: 7, // Jersey
    nascimento: diasAtras(900),
    pesoNascimento: 25,
    pesagens: [
      [200, 310],
      [100, 338],
      [15, 352],
    ],
    vacinas: [
      [190, 1, -1],
      [60, 0, 120],
    ],
    leiteiro: {
      status: [
        [200, 1],
        [45, 3],
      ],
      inseminacoes: [45],
      partos: 0,
      leite: 12,
    },
  },
  {
    Nome: 'Trovão',
    fazenda: 0,
    numero: 201,
    tipo: 3,
    raca: 5, // Gir
    nascimento: diasAtras(2190),
    pesoNascimento: 36,
    pesagens: [
      [160, 790],
      [80, 802],
      [5, 815],
    ],
    vacinas: [
      [100, 0, 80],
      [100, 2, 265],
    ],
    reprodutor: { volume: '120 doses', motilidade: 78.5, concentracao: 85 },
  },
  {
    Nome: 'Bandido',
    fazenda: 0,
    numero: 301,
    tipo: 2,
    raca: 2, // Nelore
    nascimento: diasAtras(540),
    pesoNascimento: 32,
    pesagens: [
      [180, 290],
      [150, 318],
      [120, 349],
      [90, 377],
      [60, 402],
      [30, 431],
      [2, 455],
    ],
    vacinas: [
      [170, 0, 10],
      [20, 3, 345],
    ],
    corte: { idadeAbate: 24, ganho: 27.5, abateEmDias: 150 },
  },
  {
    Nome: 'Faísca',
    fazenda: 0,
    numero: 302,
    tipo: 2,
    raca: 3, // Angus
    nascimento: diasAtras(480),
    pesoNascimento: 35,
    pesagens: [
      [120, 330],
      [60, 371],
      [8, 405],
    ],
    vacinas: [[110, 0, 70]],
    corte: { idadeAbate: 20, ganho: 32 },
  },
  {
    Nome: 'Flor',
    fazenda: 1,
    numero: 11,
    tipo: 1,
    raca: 1, // Girolando
    nascimento: diasAtras(1200),
    pesoNascimento: 31,
    pesagens: [
      [90, 430],
      [3, 441],
    ],
    vacinas: [
      [80, 0, 100],
      [80, 1, -1],
    ],
    leiteiro: {
      status: [[90, 2]],
      inseminacoes: [160],
      partos: 1,
      leite: 15.8,
    },
  },
  {
    Nome: 'Princesa',
    fazenda: 1,
    numero: 12,
    tipo: 1,
    raca: 5, // Gir
    nascimento: diasAtras(2000),
    pesoNascimento: 30,
    pesagens: [
      [200, 420],
      [110, 416],
      [25, 428],
    ],
    vacinas: [
      [190, 0, 0],
      [10, 4, 170],
    ],
    leiteiro: {
      status: [
        [200, 6],
        [120, 1],
        [70, 3],
        [25, 4],
      ],
      inseminacoes: [70],
      partos: 4,
      leite: 11.2,
    },
  },
  {
    Nome: 'Valente',
    fazenda: 1,
    numero: 21,
    tipo: 2,
    raca: 10, // Tabapuã
    nascimento: diasAtras(600),
    pesoNascimento: 33,
    pesagens: [
      [150, 360],
      [75, 412],
      [12, 448],
    ],
    vacinas: [[140, 0, 40]],
    corte: { idadeAbate: 26, ganho: 22 },
  },
  {
    Nome: 'Sultão',
    fazenda: 2,
    numero: 501,
    tipo: 3,
    raca: 9, // Brahman
    nascimento: diasAtras(1700),
    pesoNascimento: 37,
    pesagens: [
      [100, 845],
      [7, 861],
    ],
    vacinas: [
      [95, 0, 85],
      [95, 2, 270],
    ],
    reprodutor: { volume: '80 doses', motilidade: 81, concentracao: 90 },
  },
  {
    Nome: 'Tição',
    fazenda: 2,
    numero: 601,
    tipo: 2,
    raca: 2, // Nelore
    nascimento: diasAtras(420),
    pesoNascimento: 30,
    pesagens: [
      [140, 250],
      [100, 281],
      [60, 309],
      [20, 338],
    ],
    vacinas: [
      [130, 0, 50],
      [130, 3, 235],
    ],
    corte: { idadeAbate: 22, ganho: 24.5, abateEmDias: 240 },
  },
  {
    Nome: 'Brisa',
    fazenda: 2,
    numero: 602,
    tipo: 2,
    raca: 11, // Senepol
    nascimento: diasAtras(380),
    pesoNascimento: 31,
    pesagens: [[30, 296]],
    vacinas: [],
    corte: { idadeAbate: 22, ganho: 26 },
  },
];

async function nomeStatus(id: number) {
  const status = await prisma.statusPrenhez.findUniqueOrThrow({
    where: { IdStatusPrenhez: id },
  });
  return status.Descricao.trim();
}

async function main() {
  const existente = await prisma.usuario.findUnique({
    where: { email: CONTAS[0].email },
  });
  if (existente) {
    console.log('Dados de teste já existem; nada foi alterado.');
    return;
  }

  const senha = await bcryptjs.hash(SENHA, 10);
  const pessoas = [];
  for (const conta of CONTAS) {
    pessoas.push(
      await prisma.pessoa.create({
        data: {
          Nome: conta.Nome,
          IdSexo: conta.IdSexo,
          Usuario: {
            create: {
              email: conta.email,
              password: senha,
              IdTipoUsuario: conta.IdTipoUsuario,
            },
          },
        },
      }),
    );
  }

  const fazendas = [];
  for (const fazenda of FAZENDAS) {
    fazendas.push(
      await prisma.fazenda.create({
        data: {
          Nome: fazenda.Nome,
          Dono: { connect: { IdPessoa: pessoas[fazenda.dono].IdPessoa } },
          Endereco: { create: { ...fazenda.endereco, Complemento: '' } },
          FazendaPessoa: {
            create: fazenda.acesso.map((i) => ({
              IdPessoa: pessoas[i].IdPessoa,
            })),
          },
        },
      }),
    );
  }

  const vacinas = [];
  for (const vacina of VACINAS) {
    vacinas.push(
      (await prisma.vacina.findFirst({ where: { Nome: vacina.Nome } })) ??
        (await prisma.vacina.create({ data: vacina })),
    );
  }

  for (const g of GADOS) {
    const responsavel = pessoas[FAZENDAS[g.fazenda].dono].IdPessoa;
    const [diasCadastro, pesoInicial] = g.pesagens[0];
    const [, pesoAtual] = g.pesagens[g.pesagens.length - 1];

    // Histórico em ordem cronológica; o gado guarda o estado final.
    const historico: {
      Campo: string;
      ValorAnterior?: string | null;
      ValorNovo: string;
      CriadoEm: Date;
    }[] = [
      {
        Campo: 'Cadastro',
        ValorNovo: g.Nome,
        CriadoEm: diasAtras(diasCadastro),
      },
      {
        Campo: 'PesoAtual',
        ValorNovo: String(pesoInicial),
        CriadoEm: diasAtras(diasCadastro),
      },
    ];
    for (let i = 1; i < g.pesagens.length; i++) {
      historico.push({
        Campo: 'PesoAtual',
        ValorAnterior: String(g.pesagens[i - 1][1]),
        ValorNovo: String(g.pesagens[i][1]),
        CriadoEm: diasAtras(g.pesagens[i][0]),
      });
    }
    if (g.leiteiro) {
      let anterior: string | null = null;
      for (const [dias, id] of g.leiteiro.status) {
        const nome = await nomeStatus(id);
        historico.push({
          Campo: 'StatusPrenhez',
          ValorAnterior: anterior,
          ValorNovo: nome,
          CriadoEm: diasAtras(Math.min(dias, diasCadastro)),
        });
        anterior = nome;
      }
      let inseminacaoAnterior: string | null = null;
      for (const dias of [...g.leiteiro.inseminacoes].sort((a, b) => b - a)) {
        const data = diasAtras(dias).toISOString();
        historico.push({
          Campo: 'UltimaInseminacao',
          ValorAnterior: inseminacaoAnterior,
          ValorNovo: data,
          CriadoEm: diasAtras(Math.min(dias, diasCadastro)),
        });
        inseminacaoAnterior = data;
      }
    }
    for (const [dias, vacina] of g.vacinas) {
      historico.push({
        Campo: 'Vacina',
        ValorNovo: vacinas[vacina].Nome,
        CriadoEm: diasAtras(dias),
      });
    }
    historico.sort((a, b) => a.CriadoEm.getTime() - b.CriadoEm.getTime());
    const atualizadoEm = historico[historico.length - 1].CriadoEm;

    const ultimaInseminacao = g.leiteiro
      ? diasAtras(Math.min(...g.leiteiro.inseminacoes))
      : undefined;
    const statusAtual = g.leiteiro?.status[g.leiteiro.status.length - 1][1];

    await prisma.gado.create({
      data: {
        Nome: g.Nome,
        NumeroIdentificacao: g.numero,
        IdTipoGado: g.tipo,
        IdFazenda: fazendas[g.fazenda].IdFazenda,
        IdSexo: g.tipo === 1 ? 2 : 1,
        IdRaca: g.raca,
        DataNascimento: g.nascimento,
        PesoNascimentoEmKg: g.pesoNascimento,
        PesoAtual: pesoAtual,
        AtualizadoEm: atualizadoEm,
        ...(g.leiteiro && {
          GadoFemea: {
            create: {
              IdStatusPrenhez: statusAtual,
              GadoLeiteiro: {
                create: {
                  UltimaInseminacao: ultimaInseminacao,
                  QuantidadePartos: g.leiteiro.partos,
                  ProducaoLeiteDiariaEmLitros: g.leiteiro.leite,
                },
              },
            },
          },
        }),
        ...(g.corte && {
          GadoMacho: {
            create: {
              GadoCorte: {
                create: {
                  IdadePrevistaAbate: g.corte.idadeAbate,
                  GanhoDePesoMensal: g.corte.ganho,
                  DataAbate:
                    g.corte.abateEmDias !== undefined
                      ? diasAtras(-g.corte.abateEmDias)
                      : undefined,
                },
              },
            },
          },
        }),
        ...(g.reprodutor && {
          GadoMacho: {
            create: {
              GadoReprodutor: {
                create: {
                  VolumeSemenDisponivel: g.reprodutor.volume,
                  Motilidade: g.reprodutor.motilidade,
                  Concentracao: g.reprodutor.concentracao,
                },
              },
            },
          },
        }),
        AnimalVacina: {
          create: g.vacinas.map(([dias, vacina, proxima]) => ({
            IdVacina: vacinas[vacina].IdVacina,
            DataAplicacao: diasAtras(dias),
            // proxima < 0: dose única, sem próxima aplicação.
            DataProxima: proxima < 0 ? null : diasAtras(dias - proxima),
          })),
        },
        Historico: {
          create: historico.map((entrada) => ({
            ...entrada,
            IdPessoa: responsavel,
          })),
        },
      },
    });
  }

  console.log(
    `Criados: ${pessoas.length} contas, ${fazendas.length} fazendas, ${GADOS.length} gados.`,
  );
  for (const conta of CONTAS) console.log(`  ${conta.email} / ${SENHA}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
