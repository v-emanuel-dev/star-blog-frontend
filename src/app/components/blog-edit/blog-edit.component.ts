import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from '../../models/post.model';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic'; // Importa a classe do editor

@Component({
  selector: 'app-blog-edit',
  templateUrl: './blog-edit.component.html',
  styleUrls: ['./blog-edit.component.css'],
})
export class BlogEditComponent implements OnInit {
  postId!: number;
  title: string = '';
  content: string = '';
  userId!: number;
  visibility: 'public' | 'private' = 'public';
  role: string = 'user'; // Valor padrão para o papel
  message: string | null = null;
  success: boolean = false;
  selectedCategoryIds: number[] = [];
  categories: Category[] = [];
  newCategoryName: string = '';
  currentPostId: number | null = null;
  post: Post;
  isModalOpen = false;
  currentCategoryId: number | null = null;
  editorContent: string = '';

  public Editor = ClassicEditor.default; // Use a propriedade .default aqui
  public blogEditorContent: string = ''; // Variável renomeada para evitar conflitos
  public editorConfig = {
    toolbar: [
      'heading',
      '|',
      'bold',
      'italic',
      'link',
      'bulletedList',
      'numberedList',
      '|',
      'imageUpload',
      'blockQuote',
      'insertTable',
      'mediaEmbed',
      '|',
      'undo',
      'redo',
    ]
  };

  constructor(
    private postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private categoryService: CategoryService
  ) {
    this.post = {
      id: 0,
      title: '',
      content: '',
      categories: [],
      user_id: 0,
      visibility: '',
      role: '',
      likes: 0
    };
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.currentPostId = +params['postId'];
      console.log('Post ID atual:', this.currentPostId);

      // Chame loadCategories independentemente do postId
      this.loadCategories();
    });

    this.postId = +this.route.snapshot.paramMap.get('id')!;
    this.loadPost();
    this.userId = this.authService.getLoggedUserId() ?? 0;
  }

  loadPost(): void {
    this.postService.getPostById(this.postId).subscribe({
      next: (post: Post) => {
        this.title = post.title;
        this.content = post.content;
        this.visibility = post.visibility as 'public' | 'private';
        this.selectedCategoryIds = post.categoryIds || [];
      },
      error: () => {
        this.message = 'Failed to load post.';
        this.success = false;
        this.router.navigate(['/blog']);
      },
    });
  }

  public onReady(editor: any): void {
    // Remover o adaptador de upload de imagem
    delete editor.plugins.get('FileRepository').createUploadAdapter;

    // Se necessário, você pode adicionar outras configurações aqui
  }

  updatePost(): void {
    const updatedPost: Post = {
      id: this.postId,
      title: this.title,
      content: this.content,
      user_id: this.userId,
      visibility: this.visibility,
      created_at: new Date().toISOString(),
      username: '',
      categoryIds: this.selectedCategoryIds,
      role: this.role,
      likes: this.post.likes || 0, // Garantir que likes esteja presente ao atualizar
    };

    this.postService.updatePost(this.postId, updatedPost).subscribe(
      () => {
        this.message = 'Update successful!';
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/blog']);
        }, 1500);
      },
      (error) => {
        console.error('Error updating post:', error);
        this.message = 'Failed to update post.';
        this.success = false;
      }
    );
  }

  // Atualizado para usar getAllCategories como no BlogCreateComponent
  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe(
      (data: Category[]) => {
        this.categories = data;
      },
    );
  }

  addCategory(): void {
    if (this.newCategoryName.trim()) {
      const category: Omit<Category, 'id'> = {
        name: this.newCategoryName,
        postId: this.currentPostId,
      };

      this.categoryService.createCategory(category).subscribe({
        next: () => {
          this.loadCategories();
          this.newCategoryName = '';
        },
        error: (error) => {
        },
      });
    }
  }

  editCategory(category: Category): void {
    this.newCategoryName = category.name;
    this.selectedCategoryIds = category.id !== undefined ? [category.id] : [];
  }

  deleteCategory(categoryId: number): void {
    if (categoryId) {
      this.openModal(categoryId); // Abre o modal de confirmação para deletar a categoria
    }
  }

  // Método de confirmação de deleção da categoria
  deleteCategoryModal(categoryId: number): void {
    this.categoryService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.loadCategories(); // Atualiza a lista de categorias após a exclusão
        this.message = 'Category deleted successfully!';
        this.success = true;
        this.closeModal(); // Fecha o modal após a deleção
      },
      error: (error) => {
        console.error('Error deleting category:', error); // Exibe o erro detalhado no console
        this.message = 'Failed to delete category.';
        this.success = false;
      },
      complete: () => {
        setTimeout(() => {
          this.message = ''; // Limpa a mensagem após um tempo
        }, 2000);
      },
    });
  }

  confirmDelete(categoryId: number): void {
    this.openModal(categoryId); // Abre o modal com o ID da categoria
  }

  // Método para abrir o modal
  openModal(categoryId: number): void {
    this.currentCategoryId = categoryId; // Armazena o ID da categoria a ser deletada
    this.isModalOpen = true; // Abre o modal
  }

  // Método para fechar o modal
  closeModal(): void {
    this.isModalOpen = false; // Fecha o modal
    this.currentCategoryId = null; // Limpa o ID atual
  }

  onCategoryChange(event: Event, categoryId: number): void {
    event.preventDefault();

    const isChecked = this.selectedCategoryIds.includes(categoryId);

    if (isChecked) {
      this.selectedCategoryIds = this.selectedCategoryIds.filter(
        (id) => id !== categoryId
      );
    } else {
      this.selectedCategoryIds.push(categoryId);
    }
  }
}
