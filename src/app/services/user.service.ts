import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'https://blog-backend-production-c203.up.railway.app/api/users';

  public profilePictureSubject: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);
  public profilePicture$ = this.profilePictureSubject.asObservable();

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeUserAndProfilePicture();
  }

  private initializeUserAndProfilePicture(): void {
    const storedProfilePicture = localStorage.getItem('profilePicture');
    if (storedProfilePicture) {
      this.profilePictureSubject.next(storedProfilePicture);
    }
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    this.userSubject.next(storedUser);
  }

  loadUserData(userId: number): void {
    if (userId !== null) {
      this.getUserById(userId).subscribe((user: User) => {
        this.userSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      });
    }
  }

  getUsers(): Observable<any[]> {
    return this.http
      .get<any[]>(this.apiUrl)
      .pipe(tap((users) => this.usersSubject.next(users)));
  }

  updateUserAdmin(id: number, userData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .put(`${this.apiUrl}/admin/update/${id}`, userData, { headers })
      .pipe(tap((response) => this.handleUserUpdate(id, userData, response)));
  }

  private handleUserUpdate(id: number, userData: any, response: any): void {
    const updatedUsers = this.usersSubject.value.map((u) =>
      u.id === id ? { ...u, ...userData } : u
    );
    this.usersSubject.next(updatedUsers);
  }

  deleteUser(userId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/users/${userId}`, { headers }).pipe(
      tap(() => {
        const filteredUsers = this.usersSubject.value.filter(
          (u) => u.id !== userId
        );
        this.usersSubject.next(filteredUsers);
      })
    );
  }

  updateProfilePicture(picture: string | null): void {
    const formattedPicture = picture?.replace(/\\/g, '/') ?? '';
    localStorage.setItem('profilePicture', formattedPicture);
    this.profilePictureSubject.next(formattedPicture);
  }

  getUserById(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${userId}`);
  }

  updateUser(
    userId: string,
    username: string,
    email: string,
    password: string | null,
    selectedImage: File | null,
    role: string,
    headers: HttpHeaders
  ): Observable<any> {
    const formData = this.createUserFormData(
      username,
      email,
      password,
      selectedImage,
      role
    );
    return this.http.put(`${this.apiUrl}/update/${userId}`, formData, {
      headers,
    });
  }

  private createUserFormData(
    username: string,
    email: string,
    password: string | null,
    selectedImage: File | null,
    role: string
  ): FormData {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    if (password) formData.append('password', password);
    if (selectedImage) formData.append('profilePicture', selectedImage);
    formData.append('role', role);
    return formData;
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getEmail(): string | null {
    return localStorage.getItem('email');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getProfilePicture(): string | null {
    return this.cleanUrl(localStorage.getItem('profilePicture'));
  }

  getAllUserInfo(): {
    userId: string | null;
    email: string | null;
    username: string | null;
    profilePicture: string | null;
  } {
    return {
      userId: this.getUserId(),
      email: this.getEmail(),
      username: this.getUsername(),
      profilePicture: this.getProfilePicture(),
    };
  }

  cleanUrl(url: string | null): string | null {
    if (!url) return null;
    const prefix = 'https://blog-backend-production-c203.up.railway.app/';
    return url.startsWith(prefix) ? url.replace(prefix, '') : url;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
