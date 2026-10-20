import { Global, Module } from '@nestjs/common';
import { AcessoService } from './acesso.service';

@Global()
@Module({
  providers: [AcessoService],
  exports: [AcessoService],
})
export class AcessoModule {}
