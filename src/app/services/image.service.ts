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
    }, 5);
  }

  setProfilePic(picUrl: string) {
    const formattedUrl = picUrl.replace(/\\/g, '/');
    localStorage.setItem('profilePicture', formattedUrl);
    const fullUrl = this.getFullProfilePicUrl(formattedUrl);
    this.profilePicSubject.next(fullUrl);
  }

  updateProfilePic(picUrl: string): void {
    this.setProfilePic(picUrl);
  }

  getFullProfilePicUrl(picUrl: string): string {
    return picUrl.startsWith('http')
      ? picUrl
      : `https://blog-backend-production-c203.up.railway.app/${picUrl}`;
  }

  clearProfilePic(): void {
    this.profilePicSubject.next(null);
  }
}
