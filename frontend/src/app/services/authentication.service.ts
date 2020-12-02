import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  constructor(private http: HttpClient,
    private userService:UserService,
    private cookieService:CookieService,
    private router:Router) {
  }

  login(formData) {
    return this.http.post<any>('/api/users/login', formData, { withCredentials:true })
      .pipe(map(user => {
          this.userService.setUser(user);
          this.router.navigate(['/']);
          return user;
      }));
  }

  logout() {
    this.cookieService.set('connect.sid', null)
    this.userService.setUser(null);
    localStorage.removeItem('currentUser');
    this.router.navigate(['/']);
    return this.http.post<any>('/api/users/logout', {})
  }
}
