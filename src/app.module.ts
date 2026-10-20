import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CatalogoModule } from './catalogo/catalogo.module';
import { FazendaModule } from './fazenda/fazenda.module';
import { GadoModule } from './gado/gado.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { VacinaModule } from './vacina/vacina.module';
import { EnderecoModule } from './endereco/endereco.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { AcessoModule } from './shared/acesso/acesso.module';
import { UsuarioModule } from './usuario/usuario.module';

// Os dados iniciais (tabelas de apoio e usuário admin) ficam em prisma/seed.ts.
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
    CatalogoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
