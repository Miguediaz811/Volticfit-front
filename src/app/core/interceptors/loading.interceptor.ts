import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';


const SILENT_URLS: string[] = ['/api/chatbot', '/api/support/instructor/my', '/api/notifications'];

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  constructor(private loading: LoadingService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isSilent = SILENT_URLS.some(url => req.url.includes(url));

    if (!isSilent) {
      this.loading.show();
    }

    return next.handle(req).pipe(
      finalize(() => {
        if (!isSilent) {
          this.loading.hide();
        }
      }),
    );
  }
}