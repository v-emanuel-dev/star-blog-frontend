import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  userName: string | null = null;
  isMenuOpen = false;
  isDropdownOpen = false;
  notifications: any[] = [];
  unreadNotificationsCount: number = 0;
  isNotificationsOpen: boolean = false;
  userId: number | null = null; // Inicialize com null ou um valor padrão
  profilePicture: string | null = null;
  defaultProfilePicture: string = 'assets/img/default-profile.png';
  userRole: string | null = null; // Propriedade para armazenar o papel do usuário

  private notificationsSubscription: Subscription | undefined; // Adicionando subscription para notificações
  private subscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private webSocketService: WebSocketService,
    private http: HttpClient,
    private changeDetectorRef: ChangeDetectorRef,
    private imageService: ImageService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('userRole'); // Recupera o papel do usuário
    this.imageService.profilePic$.subscribe((pic) => {
      this.profilePicture = pic || this.defaultProfilePicture;
      // Força o Angular a detectar mudanças na imagem
      this.cd.detectChanges();
    });

    this.notificationsSubscription =
      this.webSocketService.notifications$.subscribe((notifications) => {
        this.notifications = notifications;
        this.unreadNotificationsCount = this.notifications.length;
        this.changeDetectorRef.detectChanges(); // Força a detecção de mudanças na interface
      });

    document.addEventListener('click', this.closeDropdowns.bind(this));
  }

  isAdmin(): boolean {
    return this.userRole === 'admin'; // Retorna true se o usuário for admin
  }

  ngAfterViewInit(): void {
    // Força a detecção de mudanças após a inicialização da view
    this.cd.detectChanges();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  goToLoginWithMessage() {
    if (this.isLoggedIn()) {
      this.router.navigate(['/blog']);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { message: 'Please log in to proceed' },
      });
    }
  }

  fetchNotifications() {
    if (!this.userId) return; // Verifica se userId está disponível

    this.http
      .get(`http://localhost:3000/api/comments/${this.userId}/notifications`)
      .subscribe(
        (data: any) => {
          this.notifications = data;
          this.unreadNotificationsCount = this.notifications.filter(
            (n) => !n.read
          ).length; // Atualiza a contagem de notificações não lidas
        },
        (error: HttpErrorResponse) => {
          console.error('Erro ao buscar notificações:', error);
        }
      );
  }

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    console.log(
      'toggleNotifications: Notificações abertas:',
      this.isNotificationsOpen
    ); // Verificar se o estado está sendo alterado
  }

  markAsRead(index: number) {
    if (index < 0 || index >= this.notifications.length) {
      console.error(
        'Índice inválido para marcação de notificação como lida:',
        index
      );
      return;
    }

    const notificationToRemove = this.notifications[index];
    console.log('Marcando a notificação como lida:', notificationToRemove); // Log da notificação sendo marcada como lida

    // Atualiza o estado local
    this.notifications.splice(index, 1);
    this.unreadNotificationsCount = this.notifications.length;
    this.isNotificationsOpen = false; // Fecha as notificações ao marcar como lida

    // Atualiza a notificação como lida
    notificationToRemove.read = true;

    // Remover a notificação do banco de dados
    this.removeNotificationFromDatabase(notificationToRemove.id).subscribe(
      () => {
        console.log(
          'Notificação removida do banco de dados com sucesso:',
          notificationToRemove.id
        );
      },
      (error) => {
        console.error('Erro ao remover notificação do banco de dados:', error);
      }
    );
  }

  private removeNotificationFromDatabase(notificationId: number) {
    return this.http.delete(
      `http://localhost:3000/api/comments/notifications/${notificationId}`
    );
  }

  hasNotifications(): boolean {
    return this.unreadNotificationsCount > 0;
  }

  markNotificationAsRead(index: number): void {
    this.notifications.splice(index, 1);
    this.unreadNotificationsCount = this.notifications.length;
    // Aqui, você pode enviar uma atualização para o backend, se necessário, para marcar a notificação como lida.
  }

  closeDropdowns(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const notificationButton = document.querySelector('.fa-bell');
    const userMenuButton = document.getElementById('user-menu-button');

    if (
      notificationButton &&
      !notificationButton.contains(target) &&
      userMenuButton &&
      !userMenuButton.contains(target) &&
      !target.closest('.notifications') // Verifica se o clique ocorreu fora das notificações
    ) {
      this.isNotificationsOpen = false;
      this.isDropdownOpen = false;
    }
  }

  onImageError() {
    console.log('Failed to load profile picture, using default.');
    this.profilePicture = this.defaultProfilePicture;
  }

  logout(): void {
    localStorage.removeItem('profilePicture');
    this.notifications = [];
    this.unreadNotificationsCount = 0;

    this.authService.logout();
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.closeDropdowns.bind(this));
  }
}
