import { Controller, Get } from '@nestjs/common';
import { PessoaService } from './pessoa.service';

@Controller('pessoas')
export class PessoaController {
  constructor(private readonly pessoaService: PessoaService) {}

  // Usado para escolher o dono da fazenda; retorna só id e nome.
  @Get()
  async findPessoas() {
    return this.pessoaService.findPessoas();
  }
}
