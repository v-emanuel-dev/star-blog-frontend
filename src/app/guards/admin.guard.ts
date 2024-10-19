import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {

    return this.authService.getUserRole().pipe(
      map(userRole => {
        if (userRole === 'admin') {
          return true; // Permite o acesso se o usuário for admin
        } else {
          this.router.navigate(['/access-denied']); // Redireciona para acesso negado
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/access-denied']); // Em caso de erro, redireciona para acesso negado
        return of(false);
      })
    );
  }
}
