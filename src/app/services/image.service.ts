import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private serverUrl: string = 'http://localhost:3000'; // Substitua pela URL do seu servidor Node.js
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
    const fullUrl = this.getFullProfilePicUrl(picUrl);
    localStorage.setItem('profilePicture', picUrl); // Armazenar o valor original no localStorage
    this.profilePicSubject.next(fullUrl); // Atualizar o BehaviorSubject com a URL completa
  }

  updateProfilePic(picUrl: string): void {
    this.setProfilePic(picUrl);
  }

  getFullProfilePicUrl(picUrl: string): string {
    // Substitui as barras invertidas por barras normais
    picUrl = picUrl.replace(/\\/g, '/');
    return picUrl.startsWith('http')
      ? picUrl
      : `http://localhost:3000/${picUrl}`;
  }

  clearProfilePic(): void {
    this.profilePicSubject.next(null);
  }
}
