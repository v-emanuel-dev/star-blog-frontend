// src/app/services/websocket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// Definindo uma interface para Notificações
interface Notification {
  id?: number; // Opcional, caso a notificação já tenha um ID do banco de dados
  userId: string;
  message: string;
  postId: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();
  private userId: string | null = localStorage.getItem('userId');

  constructor(private http: HttpClient) {
    this.socket = io('http://localhost:3000');

    this.socket.on('connect', () => {
    });

    this.socket.on('new-comment', (data: Notification) => {
      this.addNotification(data);
    });

    // Inicializa notificações
    this.initializeNotifications();
    this.watchForUserIdAndFetchNotifications(); // Monitora o userId
  }

  initializeNotifications() {
    if (this.userId) {
      this.fetchNotifications(this.userId);
    }
  }

  fetchNotifications(userId: string) {
    this.http
      .get<Notification[]>(`http://localhost:3000/api/comments/${userId}/notifications`)
      .subscribe(
        (notifications) => {
          const validNotifications = notifications.filter(n => n.message && n.postId);
          this.notificationsSubject.next(validNotifications);
        },
        (error) => {
          console.error('Erro ao recuperar notificações do banco de dados:', error);
        }
      );
  }

  private addNotification(notification: Notification) {
    if (notification && notification.message && notification.postId) {
      const currentNotifications = this.notificationsSubject.value;
      const updatedNotifications = [...currentNotifications, notification];
      this.notificationsSubject.next(updatedNotifications);
    } else {
      console.warn('Notificação inválida recebida e não foi adicionada:', notification);
    }
  }

  private watchForUserIdAndFetchNotifications() {
    const intervalId = setInterval(() => {
      this.userId = localStorage.getItem('userId'); // Atualiza o userId

      if (this.userId) {
        this.fetchNotifications(this.userId); // Busca as notificações
        clearInterval(intervalId); // Limpa o intervalo uma vez que o userId foi encontrado
      }
    }, 1000); // Verifica a cada 1 segundo
  }

  // Método para desconectar o socket (opcional)
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
