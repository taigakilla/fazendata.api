import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { UsuarioLogado } from '../auth/usuario-logado.decorator';
import { AcessoService } from '../shared/acesso/acesso.service';
import { CreateFazendaDto } from './dto/create-fazenda.dto';
import { FazendaService } from './fazenda.service';
import { PainelService } from './painel.service';
import {
  RelatorioService,
  TipoRelatorio,
  TIPOS_RELATORIO,
} from './relatorio.service';

const lerData = (valor?: string) => {
  if (!valor) return undefined;
  const data = new Date(valor);
  if (isNaN(data.getTime())) {
    throw new BadRequestException(`Data inválida: ${valor}`);
  }
  return data;
};

@Controller('fazenda')
export class FazendaController {
  constructor(
    private readonly fazendaService: FazendaService,
    private readonly painelService: PainelService,
    private readonly relatorioService: RelatorioService,
    private readonly acessoService: AcessoService,
  ) {}

  @Post()
  async create(
    @UsuarioLogado() idPessoa: number,
    @Body() createFazendaDto: CreateFazendaDto,
  ) {
    await this.acessoService.garantirPermissao(idPessoa, 'fazenda.cadastrar');
    // A fazenda é sempre vinculada a quem está cadastrando.
    return this.fazendaService.create({
      ...createFazendaDto,
      IdPessoa: idPessoa,
    });
  }

  @Get('pessoa/:pessoaId')
  async findFazendas(
    @UsuarioLogado() idPessoa: number,
    @Param('pessoaId', ParseIntPipe) pessoaId: number,
  ) {
    if (pessoaId !== idPessoa) {
      throw new ForbiddenException(
        'Você só pode listar as suas próprias fazendas.',
      );
    }
    return this.fazendaService.BuscarTodasFazendas(pessoaId);
  }

  @Get(':id/painel')
  async painel(
    @UsuarioLogado() idPessoa: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.acessoService.garantirAcessoFazenda(idPessoa, id);
    return this.painelService.painel(id);
  }

  @Get(':id/relatorio/:tipo')
  async relatorio(
    @UsuarioLogado() idPessoa: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('tipo') tipo: string,
    @Query('inicio') inicio?: string,
    @Query('fim') fim?: string,
  ) {
    if (!TIPOS_RELATORIO.includes(tipo as TipoRelatorio)) {
      throw new BadRequestException('Tipo de relatório inválido.');
    }
    await this.acessoService.garantirPermissao(idPessoa, 'relatorio.gerar');
    await this.acessoService.garantirAcessoFazenda(idPessoa, id);
    return this.relatorioService.gerar(
      id,
      tipo as TipoRelatorio,
      lerData(inicio),
      lerData(fim),
    );
  }
}
