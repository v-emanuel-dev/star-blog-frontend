import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Post } from '../models/post.model';
import { AuthService } from './auth.service'; // Importe o AuthService

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = 'http://localhost:3000/api/posts';

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
          Authorization: `Bearer ${token}` // Inclui o token de autenticação no cabeçalho
        }
      }
    );
  }

  updatePostLikes(postId: number, likes: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${postId}`, { likes });
  }

  // Método para criar um post
  createPost(post: Post): Observable<Post> {
    console.log('Post a ser criado:', post); // Adicione este log para depuração
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

  getPostsAdmin(): Observable<Post[]> {
    const token = this.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    // Supondo que exista uma rota /posts/admin para buscar todos os posts
    return this.http.get<Post[]>(`${this.apiUrl}/admin`, { headers });
  }

  getPosts(): Observable<Post[]> {
    console.log('Iniciando a busca de posts...');

    const token = this.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.get<Post[]>(this.apiUrl, { headers }).pipe(
      map((posts) => {
        console.log('Posts recebidos da API:', posts);

        // Processar comentários e likes nos posts
        posts.forEach((post) => {
          post.likes = post.likes || 0; // Garantir que likes está definido
          console.log(`Post ID: ${post.id} - Likes: ${post.likes}`); // Log da contagem de likes
        });

        // Se o usuário estiver logado, retorne todos os posts
        if (this.isLoggedIn()) {
          console.log('Usuário está logado. Retornando todos os posts.');

          return posts.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA; // Ordenação decrescente
          });
        } else {
          console.log('Usuário não está logado. Retornando apenas posts públicos.');

          // Retornar apenas posts públicos e ordená-los
          return posts
            .filter((post) => post.visibility === 'public')
            .sort((a, b) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA; // Ordenação decrescente
            });
        }
      })
    );
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
