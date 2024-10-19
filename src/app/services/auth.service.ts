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
  private baseUrl = 'http://localhost:3000/api/auth';

  private userNameSubject = new BehaviorSubject<string | undefined>(
    this.getUserName()
  );

  private currentUserIdSubject = new BehaviorSubject<number | null>(
    this.getLoggedUserId()
  ); // Adicionando a BehaviorSubject para o ID do usuário

  userName$: Observable<string | undefined> =
    this.userNameSubject.asObservable();
  userId$: Observable<number | null> = this.currentUserIdSubject.asObservable(); // Para expor o ID do usuário como um Observable

  private userLoggedInSubject = new BehaviorSubject<boolean>(false);
  userLoggedIn$ = this.userLoggedInSubject.asObservable();

  private profileImageUrlSubject = new BehaviorSubject<string | null>(null);
  profileImageUrl$ = this.profileImageUrlSubject.asObservable();

  private userRoleSubject = new BehaviorSubject<string | null>(null);

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
  }

  login(email: string, password: string) {
    return this.http
      .post<any>(`${this.baseUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          // Armazenar informações no localStorage
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('userName', response.username);
          localStorage.setItem('email', response.email);
          localStorage.setItem('userId', response.userId);
          localStorage.setItem('userRole', response.userRole); // Armazenar o papel do usuário
          // Lógica para armazenar a URL da imagem do perfil
          let profilePicUrl = response.profilePicture;

          // Verifique se a URL da imagem de perfil é válida
          if (profilePicUrl) {
            profilePicUrl = profilePicUrl.replace(/\\/g, '/');
            if (!profilePicUrl.startsWith('http')) {
              profilePicUrl = `http://localhost:3000/${profilePicUrl}`;
            }
            localStorage.setItem('profilePicture', profilePicUrl);
          } else {
            console.log('No profile picture found, setting to default.');
            profilePicUrl = 'assets/img/default-profile.png'; // Defina o caminho para a imagem padrão
            localStorage.setItem('profilePicture', profilePicUrl);
          }

          // Notificações
          this.profileImageUrlSubject.next(profilePicUrl);
          this.imageService.updateProfilePic(profilePicUrl);
          this.userNameSubject.next(response.username);
          this.currentUserIdSubject.next(response.userId);
          this.userLoggedInSubject.next(true);
          this.websocketService.fetchNotifications(response.userId);

          // Redirecionamento baseado no papel do usuário
          if (response.userRole === 'admin') {
            this.router.navigate(['/admin']); // Roteamento para a página de admin
          } else {
            this.router.navigate(['/blog']); // Roteamento para o dashboard normal
          }
        })
      );
  }


  updateProfileImageUrl(url: string): void {
    localStorage.setItem('profilePicture', url);
    this.profileImageUrlSubject.next(url);
    console.log('Profile picture updated in localStorage:', url); // Adicione este log
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

  // Função para atualizar a role do usuário
  setUserRole(role: string) {
    this.userRoleSubject.next(role);
    localStorage.setItem('userRole', role); // Armazenar no localStorage para persistência
  }

  getUserName(): string {
    return localStorage.getItem('username') || 'Visitor';
  }

  getUserId(): number | null {
    return this.currentUserIdSubject.value; // Retorna o ID do usuário logado ou null se não estiver logado
  }

  // Método para obter o token do localStorage
  getToken(): string | null {
    return localStorage.getItem('token'); // Certifique-se de que o token está armazenado com a chave 'token'
  }

  getLoggedUserId(): number | null {
    const storedUserId = localStorage.getItem('userId'); // ou o que você usar para armazenar o ID do usuário
    return storedUserId ? parseInt(storedUserId, 10) : null; // Retorna o ID do usuário
  }

  getCurrentUserId(): number | null {
    return this.currentUserIdSubject.value; // Retorna o ID do usuário logado ou null se não estiver logado
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null; // Corrigido para verificar 'accessToken'
  }

  setProfileImageUrl(url: string): void {
    this.profileImageUrlSubject.next(url);
  }

  getProfileImageUrl(): string | null {
    return this.profileImageUrlSubject.value;
  }

  logout() {
    // Limpa todo o localStorage
    localStorage.clear();

    this.userLoggedInSubject.next(false);
    this.userNameSubject.next(undefined);
    this.currentUserIdSubject.next(null); // Limpando o ID do usuário

    this.profileImageUrlSubject.next(null);
    this.imageService.clearProfilePic(); // Notificar o UserService sobre a remoção da imagem

    // Redirecionando para a página de login após o logout
    this.router.navigate(['/login']);
  }
}
