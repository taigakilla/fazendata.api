import { Controller, Get } from '@nestjs/common';
import { EnderecoService } from './endereco.service';

@Controller('endereco')
export class EnderecoController {
  constructor(private readonly enderecoService: EnderecoService) {}

  @Get('estados')
  BuscarTodosEstados() {
    return this.enderecoService.BuscarTodosEstados();
  }

  @Get('tipo-logradouro')
  BuscarTiposLogradouro() {
    return this.enderecoService.BuscarTiposLogradouro();
  }
}
