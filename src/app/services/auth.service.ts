import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { ImageService } from './image.service';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl =
    'https://blog-backend-production-c203.up.railway.app/api/auth';

  private currentUserIdSubject = new BehaviorSubject<number | null>(
    this.getLoggedUserId()
  );
  private userLoggedInSubject = new BehaviorSubject<boolean>(false);
  userLoggedIn$ = this.userLoggedInSubject.asObservable();

  private profileImageUrlSubject = new BehaviorSubject<string | null>(null);
  profileImageUrl$ = this.profileImageUrlSubject.asObservable();

  private userRoleSubject = new BehaviorSubject<string>('');
  userRole$ = this.userRoleSubject.asObservable();

  private userDetailsSubject = new BehaviorSubject<any>(null);
  userDetails$ = this.userDetailsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private imageService: ImageService,
    private websocketService: WebSocketService
  ) {
    const savedRole = localStorage.getItem('userRole') || '';
    this.userRoleSubject.next(savedRole);

    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const username = localStorage.getItem('username');
    const profilePicture = localStorage.getItem('profilePicture');
    const userRole = localStorage.getItem('userRole');
    if (userId && email && username && profilePicture) {
      const userDetails = {
        userRole,
        userId,
        email,
        username,
        profilePicture,
      };
      this.userDetailsSubject.next(userDetails);
    }
  }

  updateUserDetails(updatedDetails: any) {
    const userDetails = {
      userId: updatedDetails.userId ? updatedDetails.userId.toString() : null,
      email: updatedDetails.email || '',
      username: updatedDetails.username || '',
      profilePicture:
        updatedDetails.profilePicture ||
        'https://star-blog-frontend-git-main-vemanueldevs-projects.vercel.app/assets/img/default-profile.png',
      userRole: updatedDetails.userRole || 'user',
    };

    this.userDetailsSubject.next(userDetails);
    localStorage.setItem('userId', userDetails.userId || '');
    localStorage.setItem('email', userDetails.email);
    localStorage.setItem('username', userDetails.username);
    localStorage.setItem('profilePicture', userDetails.profilePicture);
    localStorage.setItem('userRole', userDetails.userRole);
  }

  setUserRole(role: string) {
    this.userRoleSubject.next(role);
  }

  setUserDetails(details: any) {
    this.userDetailsSubject.next(details);
  }

  clearUserDetails() {
    this.userDetailsSubject.next(null);
  }

  resetUserRole(): void {
    this.userRoleSubject.next('');
  }

  login(email: string, password: string) {
    return this.http
      .post<any>(`${this.baseUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          if (!response || !response.accessToken || !response.userId) {
            throw new Error('Invalid login response');
          }

          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('username', response.username);
          localStorage.setItem('email', response.email);
          localStorage.setItem('userId', response.userId);
          localStorage.setItem('userRole', response.userRole);

          let profilePicUrl = response.profilePicture;

          if (profilePicUrl) {
            profilePicUrl = profilePicUrl.replace(/\\/g, '/');
            if (!profilePicUrl.startsWith('http')) {
              profilePicUrl = `https://blog-backend-production-c203.up.railway.app/${profilePicUrl}`;
            }
            localStorage.setItem('profilePicture', profilePicUrl);
          } else {
            profilePicUrl =
              'https://star-blog-frontend-git-main-vemanueldevs-projects.vercel.app/assets/img/default-profile.png';
            localStorage.setItem('profilePicture', profilePicUrl);
          }

          this.profileImageUrlSubject.next(profilePicUrl);
          this.imageService.updateProfilePic(profilePicUrl);
          this.currentUserIdSubject.next(response.userId);
          this.userLoggedInSubject.next(true);
          this.setUserRole(response.userRole);

          this.userDetailsSubject.next({
            userRole: response.userRole,
            userId: response.userId,
            email: response.email,
            username: response.username,
            profilePicture: profilePicUrl,
          });

          if (response.userRole === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/blog']);
          }

          this.websocketService.fetchNotifications(response.userId);
        }),
        catchError((error) => {
          return throwError(error);
        })
      );
  }

  updateProfileImageUrl(url: string): void {
    localStorage.setItem('profilePicture', url);
    this.profileImageUrlSubject.next(url);
  }

  register(
    email: string,
    username: string,
    password: string,
    role: string
  ): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, {
      email,
      username,
      password,
      role,
    });
  }

  getUserRole() {
    return this.userRoleSubject.asObservable();
  }

  getUserId(): number | null {
    return this.currentUserIdSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getLoggedUserId(): number | null {
    const storedUserId = localStorage.getItem('userId');
    return storedUserId ? parseInt(storedUserId, 10) : null;
  }

  getCurrentUserId(): number | null {
    return this.currentUserIdSubject.value;
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null;
  }

  setProfileImageUrl(url: string): void {
    this.profileImageUrlSubject.next(url);
  }

  getProfileImageUrl(): string | null {
    return this.profileImageUrlSubject.value;
  }

  logout() {
    localStorage.clear();
    this.userLoggedInSubject.next(false);
    this.currentUserIdSubject.next(null);
    this.profileImageUrlSubject.next(null);
    this.userDetailsSubject.next(null);
    this.imageService.clearProfilePic();
    this.userRoleSubject.next('user');
    this.router.navigate(['/login']);
  }
}
