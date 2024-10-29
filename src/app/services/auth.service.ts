import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ImageService } from './image.service';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'https://blog-backend-production-c203.up.railway.app/api/auth';



  private currentUserIdSubject = new BehaviorSubject<number | null>(
    this.getLoggedUserId()
  ); // Adicionando a BehaviorSubject para o ID do usuário

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
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      this.userRoleSubject.next(savedRole);
    }

    const storedRole = localStorage.getItem('userRole') || '';
    this.userRoleSubject.next(storedRole);

    // Carregar os detalhes do usuário do localStorage
    const role = localStorage.getItem('userRole') || '';
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const username = localStorage.getItem('username');
    const profilePicture = localStorage.getItem('profilePicture');

    if (userId && email && username && profilePicture) {
      this.userDetailsSubject.next({
        role,
        userId,
        email,
        username,
        profilePicture,
      });
    }
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
          console.log('Login response:', response);
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('userName', response.username);
          localStorage.setItem('email', response.email);
          localStorage.setItem('userId', response.userId);
          localStorage.setItem('userRole', response.userRole);

          let profilePicUrl = response.profilePicture;

          if (profilePicUrl) {
            profilePicUrl = profilePicUrl.replace(/\\/g, '/');
            if (!profilePicUrl.startsWith('http')) {
              profilePicUrl = `https://star-blog-frontend-git-main-vemanueldevs-projects.vercel.app/${profilePicUrl}`;
            }
            localStorage.setItem('profilePicture', profilePicUrl);
          } else {
            console.log('No profile picture found, setting to default.');
            profilePicUrl = 'https://star-blog-frontend-git-main-vemanueldevs-projects.vercel.app/assets/img/default-profile.png'; // Defina o caminho para a imagem padrão
            localStorage.setItem('profilePicture', profilePicUrl);
          }

          // Atualiza os subjects para refletir as informações do usuário
          this.profileImageUrlSubject.next(profilePicUrl);
          this.imageService.updateProfilePic(profilePicUrl);
          this.currentUserIdSubject.next(response.userId);
          this.userLoggedInSubject.next(true);
          this.setUserRole(response.userRole);

          // Atualiza o userDetailsSubject com todos os detalhes do usuário
          this.userDetailsSubject.next({
            userRole: response.userRole,
            userId: response.userId,
            email: response.email,
            username: response.username,
            profilePicture: profilePicUrl,
          });

          // Navegação com base na função do usuário
          if (response.userRole === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/blog']);
          }

          // Inicia a busca de notificações com base no ID do usuário
          this.websocketService.fetchNotifications(response.userId);
        })
      );
  }

  updateProfileImageUrl(url: string): void {
    localStorage.setItem('profilePicture', url);
    this.profileImageUrlSubject.next(url);
    console.log('Profile picture updated in localStorage:', url);
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
