import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import * as bcryptjs from 'bcryptjs';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { FazendaModule } from './fazenda/fazenda.module';
import { GadoModule } from './gado/gado.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { PrismaService } from './shared/prisma/prisma.service';
import { VacinaModule } from './vacina/vacina.module';
import { EnderecoModule } from './endereco/endereco.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { AcessoModule } from './shared/acesso/acesso.module';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GadoModule,
    FazendaModule,
    VacinaModule,
    EnderecoModule,
    PessoaModule,
    AcessoModule,
    UsuarioModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    PrismaService,
    ConfigService,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const sexoExistente = await this.prisma.sexo.findFirst({
      where: { Descricao: 'Masculino' },
    });

    if (!sexoExistente) {
      await this.prisma.sexo.createMany({
        data: [
          { Descricao: 'Masculino' },
          { Descricao: 'Feminino' },
          { Descricao: 'Outro' },
        ],
      });
      console.log('Entradas de Sexo criadas');
    }

    const tipoUsuarioExistente = await this.prisma.tipoUsuario.findFirst({
      where: { Descricao: 'Administrador' },
    });

    if (!tipoUsuarioExistente) {
      await this.prisma.tipoUsuario.createMany({
        data: [
          { Descricao: 'Administrador' },
          { Descricao: 'Gerente' },
          { Descricao: 'Funcionário' },
        ],
      });
      console.log('Entradas de TipoUsuario criadas');
    }

    const ufExistente = await this.prisma.unidadeFederativa.findFirst();
    if (!ufExistente) {
      await this.prisma.unidadeFederativa.createMany({
        data: [{ UF: 'MG', NomeEstado: 'Minas Gerais' }],
      });
      console.log('Entradas de UnidadeFederativa criadas');
    }

    const tipoLogradouroExistente =
      await this.prisma.tipoLogradouro.findFirst();
    if (!tipoLogradouroExistente) {
      await this.prisma.tipoLogradouro.createMany({
        data: [
          { Descricao: 'Rua' },
          { Descricao: 'Avenida' },
          { Descricao: 'Travessa' },
        ],
      });
      console.log('Entradas de TipoLogradouro criadas');
    }

    const enderecoExistente = await this.prisma.endereco.findFirst({
      where: {
        Logradouro: 'Rua Exemplo',
        Numero: 123,
        CEP: 12345678,
      },
    });

    let enderecoId = enderecoExistente?.IdEndereco;
    if (!enderecoId) {
      const novoEndereco = await this.prisma.endereco.create({
        data: {
          Logradouro: 'Rua Exemplo',
          Complemento: 'Apto 1',
          Bairro: 'Centro',
          CEP: 12345678,
          Numero: 123,
          Cidade: 'Cidade Exemplo',
          IdTipoLogradouro: 1,
          UF: 'MG',
        },
      });
      enderecoId = novoEndereco.IdEndereco;
      console.log('Endereço padrão criado');
    }

    const pessoaExistente = await this.prisma.pessoa.findFirst({
      where: {
        Nome: 'Administrador Padrão',
        IdEndereco: enderecoId,
      },
    });

    let pessoaId = pessoaExistente?.IdPessoa;
    if (!pessoaId) {
      const novaPessoa = await this.prisma.pessoa.create({
        data: {
          Nome: 'Administrador Padrão',
          IdEndereco: enderecoId,
          IdSexo: 1,
        },
      });
      pessoaId = novaPessoa.IdPessoa;
      console.log('Pessoa padrão criada');
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        email: this.configService.get<string>('LOGIN_ADM'),
      },
    });

    if (!usuario) {
      const creatUsuario = await this.prisma.usuario.create({
        data: {
          IdPessoa: pessoaId,
          email: this.configService.get<string>('LOGIN_ADM'),
          password: await bcryptjs.hash(
            this.configService.get<string>('SENHA_ADM'),
            10,
          ),
          IdTipoUsuario: 1,
        },
      });
      console.log('Usuário Administrador criado:', creatUsuario);
    }
  }
}
