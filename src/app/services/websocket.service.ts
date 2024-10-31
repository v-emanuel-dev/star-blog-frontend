import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id?: number;
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
    this.socket = io('https://blog-backend-production-c203.up.railway.app');

    this.socket.on('connect', () => {});

    this.socket.on('new-comment', (data: Notification) => {
      this.addNotification(data);
    });

    this.initializeNotifications();
    this.watchForUserIdAndFetchNotifications();
  }

  initializeNotifications() {
    if (this.userId) {
      this.fetchNotifications(this.userId);
    }
  }

  fetchNotifications(userId: string) {
    this.http
      .get<Notification[]>(
        `https://blog-backend-production-c203.up.railway.app/api/comments/${userId}/notifications`
      )
      .subscribe((notifications) => {
        const validNotifications = notifications.filter(
          (n) => n.message && n.postId
        );
        this.notificationsSubject.next(validNotifications);
      });
  }

  private addNotification(notification: Notification) {
    if (notification && notification.message && notification.postId) {
      const currentNotifications = this.notificationsSubject.value;
      const updatedNotifications = [...currentNotifications, notification];
      this.notificationsSubject.next(updatedNotifications);
    }
  }

  private watchForUserIdAndFetchNotifications() {
    const intervalId = setInterval(() => {
      this.userId = localStorage.getItem('userId');

      if (this.userId) {
        this.fetchNotifications(this.userId);
        clearInterval(intervalId);
      }
    }, 1000);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
