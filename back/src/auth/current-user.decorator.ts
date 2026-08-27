import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, FirebaseUser } from './types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): FirebaseUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
