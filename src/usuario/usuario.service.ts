import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

const TIPO_USUARIO_ADMINISTRADOR = 1;

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    const email = createUsuarioDto.email.trim().toLowerCase();
    const { Nome, password, IdSexo } = createUsuarioDto;

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
            IdTipoUsuario: TIPO_USUARIO_ADMINISTRADOR,
          },
        },
      },
    });

    return { IdPessoa: pessoa.IdPessoa, Nome: pessoa.Nome, email };
  }
}
