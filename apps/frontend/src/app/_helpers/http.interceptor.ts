import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { catchError, map } from 'rxjs/operators';
import { ThemeKind } from '../ui-lib/ui-lib.interfaces';
import { IErrorResponse } from '@core/interfaces';
import { CookieService } from 'ngx-cookie-service';

@Injectable()
export class HttpConfigInterceptor implements HttpInterceptor {
  constructor(private toastService: ToastService, private cookieService: CookieService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Attach cookie to request
    let currentSession = this.cookieService.get('connect.sid');
    if (currentSession) {
      req = req.clone({
        withCredentials: true
      });
    }

    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        // For future, maybe handle the request here
        return event;
      }),
      // Top level error handler
      catchError((error: HttpErrorResponse) => {
        const body: IErrorResponse = error.error;
        this.toastService.emit(
          `${body.statusCode}: ${body.message}${body.errors?.length ? ` (${body.errors.length} errors)`: ""}`,
          ThemeKind.Danger,
          { duration: 10000 }
        );
        return throwError(error);
      })
    );
  }
}
