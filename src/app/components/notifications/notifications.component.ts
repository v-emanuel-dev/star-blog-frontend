import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.webSocketService.notifications$.subscribe((notifications) => {
      console.log('Notificações recebidas:', notifications); // Log das notificações recebidas
      this.notifications = notifications;
      console.log('Estado das notificações atualizado:', this.notifications); // Log do estado atualizado
    });
  }
}
