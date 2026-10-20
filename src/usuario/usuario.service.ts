import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';
import { PrismaService } from '../shared/prisma/prisma.service';
import { PERMISSOES, TIPO_USUARIO } from '../shared/acesso/permissoes';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    const email = createUsuarioDto.email.trim().toLowerCase();
    const { Nome, password, IdSexo, Fazendas = [] } = createUsuarioDto;
    const IdTipoUsuario =
      createUsuarioDto.IdTipoUsuario ?? TIPO_USUARIO.ADMINISTRADOR;

    const existente = await this.prisma.usuario.findUnique({
      where: { email },
    });
    if (existente) {
      throw new ConflictException('Já existe um usuário com este email.');
    }

    const sexo = await this.prisma.sexo.findUnique({ where: { IdSexo } });
    if (!sexo) {
      throw new BadRequestException(`Sexo com ID ${IdSexo} não existe.`);
    }

    const hash = await bcryptjs.hash(password, 10);

    const pessoa = await this.prisma.pessoa.create({
      data: {
        Nome: Nome.trim(),
        IdSexo,
        Usuario: {
          create: {
            email,
            password: hash,
            IdTipoUsuario,
          },
        },
        FazendaPessoa: {
          create: [...new Set(Fazendas)].map((IdFazenda) => ({ IdFazenda })),
        },
      },
    });

    return {
      IdPessoa: pessoa.IdPessoa,
      Nome: pessoa.Nome,
      email,
      IdTipoUsuario,
    };
  }

  async me(idPessoa: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { IdPessoa: idPessoa },
      select: {
        email: true,
        IdTipoUsuario: true,
        TipoUsuario: { select: { Descricao: true } },
        Pessoa: { select: { IdPessoa: true, Nome: true } },
      },
    });
    if (!usuario) {
      throw new BadRequestException('Usuário não encontrado.');
    }
    return {
      IdPessoa: usuario.Pessoa.IdPessoa,
      Nome: usuario.Pessoa.Nome,
      email: usuario.email,
      IdTipoUsuario: usuario.IdTipoUsuario,
      TipoUsuario: usuario.TipoUsuario.Descricao,
      Permissoes: PERMISSOES[usuario.IdTipoUsuario] ?? [],
    };
  }
}
