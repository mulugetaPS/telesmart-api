import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { finalize } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const ms = Date.now() - start;
        const { statusCode } = res;
        this.logger.log(`${method} ${url} ${statusCode} - ${ms}ms`);
      }),
    );
  }
}
