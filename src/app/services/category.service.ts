import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Category } from '../models/category.model';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'https://blog-backend-production-c203.up.railway.app/api/categories';
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadCategories(): void {
    this.http.get<Category[]>(`${this.apiUrl}/all`).subscribe((categories) => {
      this.categoriesSubject.next(categories);
    });
  }

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/all`).pipe(
      tap((categories) => categories), // Log dos dados obtidos
      catchError((error) => {
        console.error('Error fetching categories:', error); // Log de erro
        return of([]); // Retorna um array vazio em caso de erro
      })
    );
  }

  getCategoriesByPostId(postId: number): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}?postId=${postId}`);
  }

  createCategory(category: Category): Observable<Category> {
    return this.http
      .post<Category>(this.apiUrl, category)
      .pipe(tap(() => this.loadCategories()));
  }

  updateCategory(id: number, category: Category): Observable<Category> {
    return this.http
      .put<Category>(`${this.apiUrl}/${id}`, category)
      .pipe(tap(() => this.loadCategories()));
  }

  deleteCategoryFromPost(postId: number, categoryId: number): Observable<any> {
    const token = localStorage.getItem('accessToken');
    return this.http
      .delete(`${this.apiUrl}/${postId}/categories/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        catchError((error) => {
          console.error('Error occurred while deleting category:', error);
          return throwError(error); // Repassa o erro para que possa ser tratado onde a função é chamada
        })
      );
  }

  deleteCategory(categoryId: number): Observable<any> {
    const token = localStorage.getItem('accessToken');
    return this.http
      .delete(`${this.apiUrl}/${categoryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(tap(() => this.loadCategories()));
  }
}
