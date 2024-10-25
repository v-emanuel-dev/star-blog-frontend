import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from '../../models/post.model';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic'; // Importa a classe do editor
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-blog-create',
  templateUrl: './blog-create.component.html',
  styleUrls: ['./blog-create.component.css'],
})
export class BlogCreateComponent implements OnInit {
  title: string = '';
  content: string = '';
  success: boolean = false;
  visibility: string = 'public';
  user_id: number = 0;
  postId: number | null = null;
  categories: Category[] = [];
  newCategoryName: string = '';
  selectedCategoryIds: number[] = []; // Inicializa como um array vazio
  currentPostId: number | null = null;
  message: string | null = null; // Permite que message seja uma string ou null
  editorContent: string = '';
  isModalOpen: boolean = false;
  currentCategoryId: number | null = null; // Adicione esta nova propriedade
  editingCategory: any = null;

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
    ],
  };

  constructor(
    private postService: PostService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private categoryService: CategoryService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Carrega as categorias ao inicializar o componente
    this.categoryService.loadCategories();

    // Subscreve ao BehaviorSubject para receber atualizações
    this.categoryService.categories$.subscribe((categories) => {
      this.categories = categories; // Atualiza a lista de categorias
    });

    this.route.params.subscribe((params) => {
      this.currentPostId = +params['postId']; // Converte o postId para número

      // Chame loadCategories apenas se currentPostId não for null
      if (this.currentPostId !== null) {
        this.loadCategories(); // Passa o currentPostId como argumento
      } else {
        console.error(
          'currentPostId é null. Não é possível carregar categorias.'
        );
      }
    });

    this.getUserId();
    this.setVisibility();
    this.handleQueryParams();
  }

  public onReady(editor: any): void {
    // Remover o adaptador de upload de imagem
    delete editor.plugins.get('FileRepository').createUploadAdapter;

    // Se necessário, você pode adicionar outras configurações aqui
  }

  private getUserId(): void {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      this.user_id = parseInt(storedUserId, 10);
    } else {
      this.router.navigate(['/login']);
    }
  }

  private setVisibility(): void {
    this.visibility = this.authService.isLoggedIn() ? 'private' : 'public';
  }

  private handleQueryParams(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['message']) {
        this.message = params['message'];
      }
    });
  }

  // Create a new post
  createPost(): void {
    const userRole = 'user'; // ou qualquer valor que faça sentido para o contexto

    // Log para depuração
    console.log('Título:', this.title);
    console.log('Conteúdo:', this.content); // Adicione esta linha para depuração
    console.log('IDs de categoria selecionados:', this.selectedCategoryIds); // Log dos IDs de categoria

    if (!this.title.trim() || !this.content.trim()) {
      this.message = 'Title and content are required.';
      this.success = false;
      console.log('Erro: Título ou conteúdo vazio.'); // Log de erro
      return;
    }

    if (this.selectedCategoryIds.length === 0) {
      this.message = 'At least one category is required.';
      this.success = false;
      console.log('Erro: Nenhuma categoria selecionada.'); // Log de erro
      return;
    }

    const newPost: Post = {
      id: 0,
      title: this.title.trim(),
      content: this.content.trim(), // Use o conteúdo do CKEditor
      user_id: this.user_id,
      visibility: this.visibility,
      categoryIds: this.selectedCategoryIds,
      role: userRole,
      likes: 0, // Definir likes como 0 ao criar o post
    };

    console.log('Criando post com dados:', newPost); // Log para depuração

    this.postService.createPost(newPost).subscribe({
      next: (response) => {
        console.log('Post criado com sucesso:', response);
        this.message = 'Post created successfully!';
        this.success = true;
        this.router.navigate(['/blog']);
      },
      error: (error) => {
        console.log('Erro ao criar post:', error); // Log de erro
        this.onPostCreationError(error);
      },
    });
  }

  private onPostCreationError(error: any): void {
    console.error('Error creating post:', error);
    this.message = error?.error?.message || 'Failed to create post.';
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe(
      (data: Category[]) => {
        this.categories = data; // Armazena as categorias
      },
      (error) => {
        console.error('Erro ao obter categorias:', error);
      }
    );
  }

  addCategory(): void {
    if (this.newCategoryName.trim()) {
      const category: Omit<Category, 'id'> = {
        name: this.newCategoryName,
        postId: this.currentPostId, // Certifique-se de que postId esteja associado corretamente
      };

      this.categoryService.createCategory(category).subscribe({
        next: () => {
          this.newCategoryName = ''; // Limpa o campo após a adição
        },
        error: (error) => {
          console.error('Erro ao criar categoria:', error);
        },
      });
    } else {
      console.error('O nome da categoria não pode estar vazio');
    }
  }

  startEditCategory(category: any) {
    console.log('Editing category:', category);
    this.editingCategory = { ...category };
  }

  saveEditCategory() {
    if (this.editingCategory) {
      console.log('Saving category:', this.editingCategory);
      this.categoryService
        .updateCategory(this.editingCategory.id, this.editingCategory)
        .subscribe({
          next: () => {
            console.log('Category updated successfully:', this.editingCategory);
            this.message = 'Category updated successfully!';
            this.success = true;
            this.loadCategories();
            this.editingCategory = null;
          },
          error: (error) => {
            console.error('Error updating category:', error);
            this.message = 'Failed to update category.';
            this.success = false;
          },
        });
    }
  }

  cancelEditCategory() {
    console.log('Edit canceled for category:', this.editingCategory);
    this.editingCategory = null;
  }

  deleteCategory(categoryId: number): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoryService.deleteCategory(categoryId).subscribe({
        next: () => {
          // Verifica se currentPostId não é null antes de chamar loadCategories
          if (this.currentPostId !== null) {
            this.loadCategories(); // Passa o postId para recarregar as categorias
          } else {
            console.error(
              'currentPostId is null. Cannot load categories after deletion.'
            );
          }

          this.message = 'Category deleted successfully!';
          this.success = true;
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.message = 'Failed to delete category.';
        },
      });
    }
  }

  onCategoryChange(event: Event, categoryId: number): void {
    event.preventDefault(); // Previne o comportamento padrão

    const isChecked = this.selectedCategoryIds.includes(categoryId);

    if (isChecked) {
      // Remove o ID se o botão for clicado novamente
      this.selectedCategoryIds = this.selectedCategoryIds.filter(
        (id) => id !== categoryId
      );
    } else {
      // Adiciona o ID se o botão for clicado
      this.selectedCategoryIds.push(categoryId);
    }

    console.log('Categorias selecionadas:', this.selectedCategoryIds);
  }

  openModal(categoryId: number): void {
    this.currentCategoryId = categoryId; // Armazena o ID da categoria a ser deletada
    this.isModalOpen = true; // Abre o modal
  }

  // Método para fechar o modal
  closeModal(): void {
    this.isModalOpen = false; // Fecha o modal
    this.currentPostId = null; // Limpa o ID atual
    this.currentCategoryId = null; // Limpa o ID da categoria atual
  }

  confirmDelete(categoryId: number): void {
    this.openModal(categoryId);
  }

  // Método para deletar a categoria do post
  deletePostCategory(): void {
    if (this.currentCategoryId) {
      this.categoryService.deleteCategory(this.currentCategoryId).subscribe({
        next: () => {
          this.message = 'Category removed successfully!';
          this.success = true;
          this.closeModal();
          this.loadCategories(); // Chame sem argumento
        },
        error: (err) => {
          console.error('Error removing category from post:', err);
          this.message = 'Failed to remove category.';
          this.success = false;
        },
        complete: () => {
          setTimeout(() => {
            this.message = '';
          }, 1500);
        },
      });
    } else {
      console.error('Invalid Category ID:', {
        categoryId: this.currentCategoryId,
      });
    }
  }
}
