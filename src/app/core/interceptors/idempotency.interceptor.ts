import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interceptor HTTP que agrega automáticamente un header `Idempotency-Key`
 * con un UUID v4 único a todas las peticiones mutantes (POST, PUT, PATCH).
 *
 * Esto garantiza que si el usuario hace doble clic o hay un retry de red,
 * el backend pueda detectar la petición duplicada y retornar la respuesta
 * original sin volver a ejecutar la lógica.
 *
 * Es completamente transparente para los servicios existentes.
 */
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH'];

@Injectable()
export class IdempotencyInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    if (!MUTATING_METHODS.includes(req.method.toUpperCase())) {
      return next.handle(req);
    }

    const idempotencyKey = crypto.randomUUID();

    const clonedReq = req.clone({
      setHeaders: { 'Idempotency-Key': idempotencyKey },
    });

    return next.handle(clonedReq);
  }
}
