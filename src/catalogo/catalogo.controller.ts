import { Controller, Get } from '@nestjs/common';
import { CatalogoService } from './catalogo.service';

// Listas de apoio usadas nos formulários do app.
@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get('racas')
  BuscarRacas() {
    return this.catalogoService.BuscarRacas();
  }

  @Get('sexos')
  BuscarSexos() {
    return this.catalogoService.BuscarSexos();
  }

  @Get('status-prenhez')
  BuscarStatusPrenhez() {
    return this.catalogoService.BuscarStatusPrenhez();
  }

  @Get('tipos-gado')
  BuscarTiposGado() {
    return this.catalogoService.BuscarTiposGado();
  }
}
