import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  tap,
  throwError,
} from 'rxjs';
import { Post } from '../models/post.model';
import { AuthService } from './auth.service'; // Importe o AuthService

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = 'http://localhost:3000/api/posts';

  private postsSubject = new BehaviorSubject<any[]>([]);
  posts$ = this.postsSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {} // Injete AuthService

  // Método para obter o token
  private getToken(): string | null {
    return localStorage.getItem('token'); // Certifique-se de recuperar o token correto
  }

  toggleLike(postId: number): Observable<any> {
    const token = localStorage.getItem('token'); // Assumindo que o token está armazenado no localStorage

    return this.http.post<any>(
      `${this.apiUrl}/${postId}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`, // Inclui o token de autenticação no cabeçalho
        },
      }
    );
  }

  updatePostLikes(postId: number, likes: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${postId}`, { likes });
  }

  getPostsAdminDashboard(): Observable<Post[]> {
    const token = this.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.get<Post[]>(`${this.apiUrl}/admin`, { headers }).pipe(
      tap((posts) => this.postsSubject.next(posts)) // Atualiza o BehaviorSubject
    );
  }

  // Método para atualizar um post e refletir no BehaviorSubject
  updatePostDashboard(postId: number, post: Post): Observable<Post> {
    const token = this.getToken();

    return this.http
      .put<Post>(`${this.apiUrl}/${postId}`, post, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        tap((updatedPost) => {
          // Atualiza a lista no BehaviorSubject
          const currentPosts = this.postsSubject.value;
          const updatedPosts = currentPosts.map((p) =>
            p.id === postId ? updatedPost : p
          );
          this.postsSubject.next(updatedPosts);
        })
      );
  }

  // Método para deletar um post e refletir no BehaviorSubject
  deletePostDashboard(postId: number): Observable<void> {
    const token = this.getToken();

    return this.http
      .delete<void>(`${this.apiUrl}/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        tap(() => {
          // Remove o post deletado do BehaviorSubject
          const currentPosts = this.postsSubject.value;
          const updatedPosts = currentPosts.filter((p) => p.id !== postId);
          this.postsSubject.next(updatedPosts);
        })
      );
  }

  // Método para criar um post
  createPost(post: Post): Observable<Post> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );

    return this.http.post<Post>(this.apiUrl, post, { headers }).pipe(
      catchError((error) => {
        console.error('Erro ao criar post:', error);
        return throwError(() => new Error('Erro ao criar post.'));
      })
    );
  }

  getPosts(): Observable<Post[]> {
    const token = this.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.get<Post[]>(this.apiUrl, { headers }).pipe(
      map((posts) => {
        // Processar comentários e likes nos posts
        posts.forEach((post) => {
          post.likes = post.likes || 0; // Garantir que likes está definido
        });
        return posts; // Retorna os posts sem ordenação
      })
    );
  }

  getPostsAdmin(): Observable<Post[]> {
    const token = this.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.get<Post[]>(`${this.apiUrl}/admin`, { headers });
  }

  // Método para buscar um post específico pelo ID
  getPostById(postId: number): Observable<Post> {
    const token = this.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.get<Post>(`${this.apiUrl}/${postId}`, { headers });
  }

  // Método para buscar posts privados de um usuário
  getPrivatePosts(userId: number): Observable<Post[]> {
    const token = this.getToken();
    return this.http.get<Post[]>(`${this.apiUrl}/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Inclua o token
      },
    });
  }

  // Método para atualizar um post
  updatePost(postId: number, post: Post): Observable<Post> {
    const token = this.getToken(); // Certifique-se de que o token está sendo obtido corretamente
    return this.http.put<Post>(`${this.apiUrl}/${postId}`, post, {
      headers: {
        Authorization: `Bearer ${token}`, // Inclui o token no cabeçalho
      },
    });
  }

  // Método para deletar um post
  deletePost(postId: number): Observable<void> {
    const token = this.getToken();
    return this.http.delete<void>(`${this.apiUrl}/${postId}`, {
      headers: {
        Authorization: `Bearer ${token}`, // Inclua o token
      },
    });
  }

  // Método auxiliar para verificar se o usuário está logado
  isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null; // Verifique se há token de acesso
  }
}
