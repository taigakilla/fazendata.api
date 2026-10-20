import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UsuarioLogado } from '../auth/usuario-logado.decorator';
import { AcessoService } from '../shared/acesso/acesso.service';
import { CreateGadoDto } from './dto/create-gado.dto';
import { UpdateGadoDto } from './dto/update-gado.dto';
import { VacinarGadoDto } from './dto/vacinar-gado.dto';
import { GadoService } from './gado.service';

@Controller('gado')
export class GadoController {
  constructor(
    private readonly gadoService: GadoService,
    private readonly acessoService: AcessoService,
  ) {}

  @Post()
  async create(
    @UsuarioLogado() idPessoa: number,
    @Body() createGadoDto: CreateGadoDto,
  ) {
    await this.acessoService.garantirAcessoFazenda(
      idPessoa,
      createGadoDto.IdFazenda,
    );
    return this.gadoService.create(createGadoDto);
  }
  @Patch(':id')
  async update(
    @UsuarioLogado() idPessoa: number,
    @Param('id') id: string, // O ID vem da rota
    @Body() updateGadoDto: UpdateGadoDto, // O corpo contém apenas os campos que podem ser alterados
  ) {
    await this.acessoService.garantirAcessoGado(idPessoa, +id);
    if (updateGadoDto.IdFazenda) {
      await this.acessoService.garantirAcessoFazenda(
        idPessoa,
        updateGadoDto.IdFazenda,
      );
    }
    return this.gadoService.update(id, updateGadoDto);
  }

  @Get('fazenda/:fazendaId')
  async findByFazendaId(
    @UsuarioLogado() idPessoa: number,
    @Param('fazendaId') fazendaId: string,
  ) {
    const id = parseInt(fazendaId, 10);
    await this.acessoService.garantirAcessoFazenda(idPessoa, id);
    return this.gadoService.BuscarAnimalPorFazenda(id);
  }
  @Get(':GadoId')
  async BuscarAnimalPorFazenda(
    @UsuarioLogado() idPessoa: number,
    @Param('GadoId') GadoId: string,
  ) {
    const id = parseInt(GadoId, 10);
    await this.acessoService.garantirAcessoGado(idPessoa, id);
    return this.gadoService.BuscarGadoPorId(id);
  }

  @Post('vacinar')
  async vacinar(
    @UsuarioLogado() idPessoa: number,
    @Body() vacinarGadoDto: VacinarGadoDto,
  ) {
    await this.acessoService.garantirAcessoGado(
      idPessoa,
      vacinarGadoDto.IdGado,
    );
    return this.gadoService.vacinarGado(vacinarGadoDto);
  }

  @Get('vacina/:id')
  async BuscarVacinasPorGado(
    @UsuarioLogado() idPessoa: number,
    @Param('id') id: string,
  ) {
    await this.acessoService.garantirAcessoGado(idPessoa, +id);
    return this.gadoService.BuscarVacinasPorGado(+id);
  }
}
