import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  public profilePictureSubject: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);
  public profilePicture$ = this.profilePictureSubject.asObservable();

  constructor(private http: HttpClient) {
    const storedProfilePicture = localStorage.getItem('profilePicture');
    if (storedProfilePicture) {
      this.profilePictureSubject.next(storedProfilePicture);
    }
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  updateUserAdmin(id: number, userData: any): Observable<any> {
    const token = localStorage.getItem('accessToken'); // Pega o token do localStorage

    // Cria os cabeçalhos incluindo o token de autorização
    const headers = {
      Authorization: `Bearer ${token}`
    };

    // Passa os dados do usuário e os cabeçalhos na chamada PUT
    return this.http.put(`${this.apiUrl}/admin/update/${id}`, userData, { headers });
  }

  deleteUser(userId: number): Observable<any> {
    const token = localStorage.getItem('accessToken'); // Pega o token do localStorage
    return this.http.delete(`${this.apiUrl}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}` // Envia o token nos headers
      }
    });
  }

  updateProfilePicture(picture: string | null) {
    console.log('Updating profile picture in UserService:', picture);
    localStorage.setItem('profilePicture', picture ?? '');
    this.profilePictureSubject.next(picture);
    console.log(
      'Profile picture stored in localStorage:',
      localStorage.getItem('profilePicture')
    );
  }

  getUserById(userId: number) {
    return this.http.get<any>(`${this.apiUrl}/users/${userId}`);
  }

  updateUser(
    userId: string,
    username: string,
    email: string,
    password: string | null,
    selectedImage: File | null,
    role: string, // Adicione o parâmetro role
    headers: HttpHeaders
  ): Observable<any> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);

    if (password) {
      formData.append('password', password);
    }

    if (selectedImage) {
      formData.append('profilePicture', selectedImage);
    }

    formData.append('role', role); // Adicione o role no FormData

    console.log('Sending update user request with data:', {
      userId,
      username,
      email,
      password,
      selectedImage,
      role, // Inclua o role nos logs para depuração
    });

    return this.http.put(`${this.apiUrl}/update/${userId}`, formData, {
      headers,
    });
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
    return this.cleanUrl(localStorage.getItem('profilePicture')); // Limpa a URL ao retornar
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
    // Remove o prefixo 'http://localhost:3000/' se existir
    const prefix = 'http://localhost:3000/';
    return url.startsWith(prefix) ? url.replace(prefix, '') : url;
  }
}
