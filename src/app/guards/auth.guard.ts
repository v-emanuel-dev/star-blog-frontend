import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private authService: AuthService) {}

  canActivate(): boolean | Observable<boolean> {
    const token = localStorage.getItem('token');

    if (token && !this.isTokenExpired(token)) {
      return true;
    }

    console.warn('Access denied - no valid token found.');
    this.router.navigate(['/login']);
    return false;
  }

  private isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    return Date.now() > expiry;
  }

  isAdmin(): Observable<boolean> {
    return this.authService.getUserRole().pipe(
      map(role => role === 'admin') // Retorna verdadeiro se o papel for admin
    );
  }
}
