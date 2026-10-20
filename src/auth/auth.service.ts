import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { LoginResponseDto } from './dto/login.dto';
import { PERMISSOES } from '../shared/acesso/permissoes';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUsuario(email: string, password: string): Promise<any> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      select: {
        IdPessoa: true,
        email: true,
        password: true,
        IdTipoUsuario: true,
        Pessoa: {
          select: {
            Nome: true,
          },
        },
      },
    });
    if (usuario && (await bcrypt.compare(password, usuario.password))) {
      const { password, ...result } = usuario;
      return result;
    }
    return null;
  }

  async login(usuario: any): Promise<LoginResponseDto> {
    const payload = { email: usuario.email, sub: usuario.IdPessoa };
    const IdPessoa = usuario.IdPessoa;
    const pessoa = await this.prisma.pessoa.findUnique({
      where: { IdPessoa },
      select: {
        IdPessoa: true,
        Nome: true,
      },
    });
    return {
      Nome: pessoa.Nome,
      IdPessoa: pessoa.IdPessoa,
      IdTipoUsuario: usuario.IdTipoUsuario,
      Permissoes: PERMISSOES[usuario.IdTipoUsuario] ?? [],
      access_token: this.jwtService.sign(payload),
    };
  }
}
