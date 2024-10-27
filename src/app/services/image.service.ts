import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private profilePicSubject = new BehaviorSubject<string | null>(null);
  profilePic$ = this.profilePicSubject.asObservable();

  constructor() {
    this.initialize();
  }

  initialize() {
    this.checkLocalStorageProfilePic();
  }

  private checkLocalStorageProfilePic() {
    const storedPic = localStorage.getItem('profilePicture');
    if (storedPic) {
      this.setProfilePic(storedPic);
    } else {
      this.watchForProfilePicInLocalStorage();
    }
  }

  private watchForProfilePicInLocalStorage() {
    const intervalId = setInterval(() => {
      const storedPic = localStorage.getItem('profilePicture');
      if (storedPic) {
        this.setProfilePic(storedPic);
        clearInterval(intervalId);
      }
    }, 1000); // Verifica a cada 1 segundo
  }

  setProfilePic(picUrl: string) {
    const formattedUrl = picUrl.replace(/\\/g, '/'); // Garante que todas as barras invertidas sejam substituídas
    localStorage.setItem('profilePicture', formattedUrl); // Armazena o valor formatado no localStorage
    const fullUrl = this.getFullProfilePicUrl(formattedUrl); // Gera a URL completa
    this.profilePicSubject.next(fullUrl); // Atualiza o BehaviorSubject com a URL completa
  }

  updateProfilePic(picUrl: string): void {
    this.setProfilePic(picUrl);
  }

  getFullProfilePicUrl(picUrl: string): string {
    // Confirma que a URL está formatada corretamente
    return picUrl.startsWith('http')
      ? picUrl
      : `http://localhost:4200/${picUrl}`;
  }

  clearProfilePic(): void {
    this.profilePicSubject.next(null);
  }
}
