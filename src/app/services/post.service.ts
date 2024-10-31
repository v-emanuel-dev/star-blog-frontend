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
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private apiUrl = 'https://blog-backend-production-c203.up.railway.app/api/posts';

  private postsSubject = new BehaviorSubject<any[]>([]);
  posts$ = this.postsSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  toggleLike(postId: number): Observable<any> {
    const token = localStorage.getItem('token');

    return this.http.post<any>(
      `${this.apiUrl}/${postId}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
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

    return this.http
      .get<Post[]>(`${this.apiUrl}/admin`, { headers })
      .pipe(tap((posts) => this.postsSubject.next(posts)));
  }

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
          const currentPosts = this.postsSubject.value;
          const updatedPosts = currentPosts.map((p) =>
            p.id === postId ? updatedPost : p
          );
          this.postsSubject.next(updatedPosts);
        })
      );
  }

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
          const currentPosts = this.postsSubject.value;
          const updatedPosts = currentPosts.filter((p) => p.id !== postId);
          this.postsSubject.next(updatedPosts);
        })
      );
  }

  createPost(post: Post): Observable<Post> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getToken()}`
    );

    return this.http.post<Post>(this.apiUrl, post, { headers }).pipe(
      catchError((error) => {
        return throwError(() => new Error('Error creating post.'));
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
        posts.forEach((post) => {
          post.likes = post.likes || 0;
        });
        return posts;
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

  getPostById(postId: number): Observable<Post> {
    const token = this.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.get<Post>(`${this.apiUrl}/${postId}`, { headers });
  }

  getPrivatePosts(userId: number): Observable<Post[]> {
    const token = this.getToken();
    return this.http.get<Post[]>(`${this.apiUrl}/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  updatePost(postId: number, post: Post): Observable<Post> {
    const token = this.getToken();
    return this.http.put<Post>(`${this.apiUrl}/${postId}`, post, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  deletePost(postId: number): Observable<void> {
    const token = this.getToken();
    return this.http.delete<void>(`${this.apiUrl}/${postId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null;
  }
}
