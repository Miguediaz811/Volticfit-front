import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

const PUBLIC_URLS = ['/auth/login', '/auth/register'];

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    const isPublic = PUBLIC_URLS.some(url => req.url.includes(url));
    const token    = this.auth.getToken();

    const authReq = (!isPublic && token)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        const staysOnPage = req.url.includes('/attendance/manual');

        if (err.status === 401 && !staysOnPage) {
          this.auth.removeToken();
          this.router.navigate(['/auth/login']);
        }
        return throwError(() => err);
      }),
    );
  }
}
