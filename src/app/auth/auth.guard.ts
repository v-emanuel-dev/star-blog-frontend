import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Adjust the import path as necessary

@Injectable({
  providedIn: 'root' // This makes the AuthGuard available throughout the app
})
export class AuthGuard implements CanActivate {
  // Injecting AuthService and Router into the guard
  constructor(private authService: AuthService, private router: Router) {}

  // This method checks if the route can be activated
  canActivate(
    route: ActivatedRouteSnapshot, // Information about the route being activated
    state: RouterStateSnapshot // Information about the router state at the moment
  ): boolean {
    // Check if the user is authenticated by looking for a token in localStorage
    const isAuthenticated = !!localStorage.getItem('token');

    if (!isAuthenticated) {
      // If the user is not authenticated, redirect them to the login page
      this.router.navigate(['/login']);
    }

    return isAuthenticated; // Return true to allow access or false to block
  }
}
