import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { UsuarioLogado } from '../auth/usuario-logado.decorator';
import { CreateFazendaDto } from './dto/create-fazenda.dto';
import { FazendaService } from './fazenda.service';

@Controller('fazenda')
export class FazendaController {
  constructor(private readonly fazendaService: FazendaService) {}

  @Post()
  async create(
    @UsuarioLogado() idPessoa: number,
    @Body() createFazendaDto: CreateFazendaDto,
  ) {
    // A fazenda é sempre vinculada a quem está cadastrando.
    return this.fazendaService.create({
      ...createFazendaDto,
      IdPessoa: idPessoa,
    });
  }

  @Get('pessoa/:pessoaId')
  async findFazendas(
    @UsuarioLogado() idPessoa: number,
    @Param('pessoaId') pessoaId: string,
  ) {
    const id = parseInt(pessoaId, 10);
    if (id !== idPessoa) {
      throw new ForbiddenException(
        'Você só pode listar as suas próprias fazendas.',
      );
    }
    return this.fazendaService.BuscarTodasFazendas(id);
  }
}
