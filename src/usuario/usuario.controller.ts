import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsuarioLogado } from '../auth/usuario-logado.decorator';
import { AcessoService } from '../shared/acesso/acesso.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UsuarioService } from './usuario.service';

@Controller('usuarios')
export class UsuarioController {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly acessoService: AcessoService,
  ) {}

  @Post()
  async create(
    @UsuarioLogado() idPessoa: number,
    @Body() createUsuarioDto: CreateUsuarioDto,
  ) {
    await this.acessoService.garantirPermissao(idPessoa, 'usuario.cadastrar');
    for (const idFazenda of createUsuarioDto.Fazendas ?? []) {
      await this.acessoService.garantirAcessoFazenda(idPessoa, idFazenda);
    }
    return this.usuarioService.create(createUsuarioDto);
  }

  @Get('me')
  async me(@UsuarioLogado() idPessoa: number) {
    return this.usuarioService.me(idPessoa);
  }
}
