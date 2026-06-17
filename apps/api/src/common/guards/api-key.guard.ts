import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private static readonly log = new Logger(ApiKeyGuard.name);
  private readonly apiKey: string | undefined;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService,
  ) {
    this.apiKey = config.get<string>('API_KEY');
    if (!this.apiKey) {
      if (process.env['NODE_ENV'] === 'production') {
        throw new Error(
          'API_KEY must be set in production — without it every request is unauthenticated. Set API_KEY in .env and restart.',
        );
      }
      ApiKeyGuard.log.warn(
        '⚠️  API_KEY is not configured — all requests pass without authentication. Set API_KEY in .env before deploying.',
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.apiKey) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>();

    if (request.headers['x-api-key'] !== this.apiKey) {
      throw new ForbiddenException('Invalid or missing API key');
    }
    return true;
  }
}
