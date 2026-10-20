import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// IdPessoa do usuário autenticado, vindo do `sub` do JWT (ver JwtStrategy).
export const UsuarioLogado = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number =>
    ctx.switchToHttp().getRequest().user.userId,
);
