import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'http://localhost:3000/api/categories'; // Ajuste conforme sua API

  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/all`); // Usando a nova rota
  }

  getCategoriesByPostId(postId: number): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}?postId=${postId}`);
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category); // Ajuste a URL conforme necessário
  }

  // Atualizar a assinatura do método updateCategory
  updateCategory(id: number, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(categoryId: number): Observable<any> {
    const token = localStorage.getItem('accessToken');
    return this.http.delete(`${this.apiUrl}/${categoryId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
