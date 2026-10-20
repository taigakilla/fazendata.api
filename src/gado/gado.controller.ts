import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
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
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGadoDto: UpdateGadoDto,
  ) {
    await this.acessoService.garantirAcessoGado(idPessoa, id);
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
    @Param('fazendaId', ParseIntPipe) fazendaId: number,
  ) {
    await this.acessoService.garantirAcessoFazenda(idPessoa, fazendaId);
    return this.gadoService.BuscarAnimalPorFazenda(fazendaId);
  }
  @Get(':GadoId')
  async BuscarAnimalPorFazenda(
    @UsuarioLogado() idPessoa: number,
    @Param('GadoId', ParseIntPipe) GadoId: number,
  ) {
    await this.acessoService.garantirAcessoGado(idPessoa, GadoId);
    return this.gadoService.BuscarGadoPorId(GadoId);
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
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.acessoService.garantirAcessoGado(idPessoa, id);
    return this.gadoService.BuscarVacinasPorGado(id);
  }
}
