import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Post } from '../../models/post.model';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic'; // Importa a classe do editor
import { HttpClient } from '@angular/common/http';
import { ImageUpload } from '../../components/image-upload/image-upload.component';

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
  public isEmojiPickerVisible: boolean = false;

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
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private categoryService: CategoryService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.currentPostId = +params['postId']; // Converte o postId para número
      console.log('Post ID atual:', this.currentPostId);

      // Chame loadCategories apenas se currentPostId não for null
      if (this.currentPostId !== null) {
        this.loadCategories(this.currentPostId); // Passa o currentPostId como argumento
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
    editor.plugins.get('FileRepository').createUploadAdapter = (
      loader: any
    ) => {
      return new ImageUpload(loader, this.http);
    };
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

  loadCategories(postId: number): void {
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
          // Passa o currentPostId ao chamar loadCategories
          if (this.currentPostId !== null) {
            this.loadCategories(this.currentPostId);
          } else {
            console.error('currentPostId is null. Cannot load categories.');
          }
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

  editCategory(category: Category): void {
    //this.newCategoryName = category.name;
    //this.selectedCategoryIds = category.id !== undefined ? category.id : null;
  }

  deleteCategory(categoryId: number): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoryService.deleteCategory(categoryId).subscribe({
        next: () => {
          // Verifica se currentPostId não é null antes de chamar loadCategories
          if (this.currentPostId !== null) {
            this.loadCategories(this.currentPostId); // Passa o postId para recarregar as categorias
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
}
