import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];

  constructor(private webSocketService: WebSocketService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.webSocketService.notifications$.subscribe((notifications) => {
      this.snackbar('Notifications received:'); // Log das notificações recebidas
      this.notifications = notifications;
      this.snackbar('Notifications updated successfully');
    });
  }

  snackbar(message: string): void {
    this.snackBar.open(message, '', {
      duration: 2000,
    });
  }
}
