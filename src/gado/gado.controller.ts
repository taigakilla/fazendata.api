import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
    return this.gadoService.create(createGadoDto, idPessoa);
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
    return this.gadoService.update(id, updateGadoDto, idPessoa);
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

  // `desde` (ISO ou epoch em ms) limita às alterações posteriores, usado para
  // mostrar o que mudou desde a gravação da tag NFC.
  @Get(':GadoId/historico')
  async BuscarHistorico(
    @UsuarioLogado() idPessoa: number,
    @Param('GadoId', ParseIntPipe) GadoId: number,
    @Query('desde') desde?: string,
  ) {
    await this.acessoService.garantirAcessoGado(idPessoa, GadoId);
    let data: Date | undefined;
    if (desde) {
      data = new Date(/^\d+$/.test(desde) ? Number(desde) : desde);
      if (isNaN(data.getTime())) {
        throw new BadRequestException('Parâmetro "desde" inválido.');
      }
    }
    return this.gadoService.BuscarHistorico(GadoId, data);
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
    return this.gadoService.vacinarGado(vacinarGadoDto, idPessoa);
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
