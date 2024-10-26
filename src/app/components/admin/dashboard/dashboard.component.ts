import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { CategoryService } from '../../../services/category.service';
import { CommentService } from '../../../services/comment.service';
import { PostService } from '../../../services/post.service';
import { catchError, forkJoin, Observable, of, tap } from 'rxjs';
import { User } from '../../../models/user.model';
import { Post } from '../../../models/post.model';
import { Category } from '../../../models/category.model';
import { Comment } from '../../../models/comment.model';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic'; // Importa a classe do editor
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'], // Corrigi 'styleUrl' para 'styleUrls'
})
export class DashboardComponent implements OnInit {
  editingUser: any = null;
  editingCategory: any = null;
  editingComment: any = null;
  editingPost: any = null;
  success: boolean = false; // Status de sucesso ou falha das ações
  message: string | null = null; // Mensagem a ser exibida
  isModalOpen: boolean = false;
  currentPostId: number | null = null;
  currentId: number | null = null; // ID do item a ser deletado (genérico para post, user, comment, category)
  itemType: 'user' | 'post' | 'comment' | 'category' | null = null; // Tipo de item
  loading: boolean = true; // Indicador de carregamento
  newCategoryName: string = '';
  postId: number = 0;
  newComment: string = '';
  comments: Comment[] = []; // Adicione isso na classe DashboardComponent
  selectedPostId: number | null = null; // ID do post selecionado (inicialmente nulo)

  sections = [
    { name: 'Users', isEditing: false },
    { name: 'Categories', isEditing: false },
    { name: 'Comments', isEditing: false },
    { name: 'Posts', isEditing: false },
  ];

  users$: Observable<User[]>;
  posts$: Observable<Post[]>;
  categories$: Observable<Category[]>;
  comments$: Observable<Comment[]>;
  selectedTab: string;
  selectedPost: string | null = ''; // Inicializa como string vazia

  public Editor = ClassicEditor.default; // Use a propriedade .default aqui
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
    private userService: UserService,
    private categoryService: CategoryService,
    private commentService: CommentService,
    private postService: PostService,
    private route: ActivatedRoute
  ) {
    this.selectedTab = 'users'; // Defina o valor inicial da aba selecionada
    this.users$ = this.userService.users$; // Assina os usuários
    this.posts$ = this.postService.posts$; // Assina os posts
    this.categories$ = this.categoryService.categories$; // Assina as categorias
    this.comments$ = this.commentService.comments$; // Assina os comentários
  }

  ngOnInit() {
    this.loadAllData();

    const savedTab = localStorage.getItem('selectedTab');
    if (savedTab) {
      this.selectedTab = savedTab; // Define a aba selecionada com base no valor armazenado
    }
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
  }

  onTabChange(event: Event): void {
    const target = event.target as HTMLSelectElement; // Assegura que o 'target' é um select
    this.selectTab(target.value); // Chama o método selectTab com o valor selecionado
  }

  // Método para carregar usuários
  loadUsers(): void {
    this.loading = true; // Inicia o estado de carregamento
    console.log('Loading users...');
    this.userService.getUsers().subscribe({
      next: (users) => {
        console.log('Users loaded successfully:', users);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.message = 'Failed to load users.';
        this.loading = false;
      },
    });
  }

  // Método para carregar posts de admin
  loadPostsAdmin(): void {
    this.loading = true; // Inicia o estado de carregamento
    console.log('Loading posts...');
    this.postService.getPostsAdminDashboard().subscribe({
      next: (posts) => {
        console.log('Posts loaded successfully:', posts);
        this.loading = false; // Atualiza o estado de carregamento
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.message = 'Failed to load posts.';
        this.loading = false; // Atualiza o estado de carregamento
      },
    });
  }

  // Método para carregar categorias
  loadCategories(newCategory?: Category): void {
    this.loading = true; // Inicia o estado de carregamento
    console.log('Loading categories...');

    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        console.log('Categories loaded successfully:', categories);

        // Se uma nova categoria foi criada, adicione-a ao início da lista
        if (newCategory) {
          categories.unshift(newCategory); // Adiciona a nova categoria no início da lista
        }

        // Atualiza categories$
        this.categories$ = of(categories);
        this.loading = false; // Atualiza o estado de carregamento
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.message = 'Failed to load categories.';
        this.loading = false; // Atualiza o estado de carregamento
      },
    });
  }

  loadComments(): void {
    this.loading = true; // Inicia o estado de carregamento
    console.log('Loading comments...');
    this.commentService.getAllComments().subscribe({
      next: (comments) => {
        console.log('Comments loaded successfully:', comments);
        this.commentService.updateComments(comments); // Atualiza o BehaviorSubject
        this.loading = false; // Atualiza o estado de carregamento
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.message = 'Failed to load comments.';
        this.loading = false; // Atualiza o estado de carregamento
      },
    });
  }

  public onReady(editor: any): void {
    delete editor.plugins.get('FileRepository').createUploadAdapter;
  }

  // Editar usuário
  startEditUser(user: any) {
    console.log('Editing user:', user);
    this.editingUser = { ...user };
  }

  saveEditUser() {
    if (this.editingUser) {
      this.loading = true; // Inicia o carregamento
      console.log('Saving user:', this.editingUser);

      this.userService
        .updateUserAdmin(this.editingUser.id, this.editingUser)
        .subscribe({
          next: () => {
            console.log('User updated successfully:', this.editingUser);
            this.message = 'User updated successfully!';
            this.success = true;
            this.editingUser = null;
          },
          error: (error) => {
            console.error('Error updating user:', error);
            this.message = 'Failed to update user.';
            this.success = false;
          },
          complete: () => {
            this.loading = false; // Finaliza o carregamento em qualquer caso
            this.loadUsers(); // Atualiza a lista após a operação
          },
        });
    }
  }

  cancelEditUser() {
    console.log('Edit canceled for user:', this.editingUser);
    this.editingUser = null;
  }

  // Deletar usuário
  deleteUser(id: number) {
    this.loading = true;
    this.userService.deleteUser(id).subscribe({
      next: (response) => {
        console.log('User deleted successfully:', response);
        this.message = 'User deleted successfully!';
        this.success = true;
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        this.message = 'Failed to delete user.';
        this.success = false;
      },
      complete: () => {
        this.loading = false; // Finaliza o carregamento
      },
    });
  }

  // Editar categoria
  startEditCategory(category: any) {
    console.log('Editing category:', category);
    this.editingCategory = { ...category };
  }

  saveEditCategory() {
    if (this.editingCategory) {
      this.loading = true;
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
          complete: () => {
            this.loading = false; // Finaliza o carregamento
          },
        });
    }
  }

  addCategory(): void {
    console.log('Tentando adicionar uma nova categoria');

    if (this.newCategoryName.trim()) {
      console.log('Nome da nova categoria:', this.newCategoryName);
      console.log('ID do post associado:', this.currentPostId);

      const category: Omit<Category, 'id'> = {
        name: this.newCategoryName,
        postId: this.currentPostId,
      };

      console.log('Criando categoria com os seguintes dados:', category);

      this.categoryService.createCategory(category).subscribe({
        next: (createdCategory) => {
          console.log('Categoria criada com sucesso:', createdCategory);
          this.newCategoryName = ''; // Limpa o campo após a adição

          // Chama loadCategories passando a nova categoria criada
          this.loadCategories(createdCategory);
        },
        error: (error) => {
          console.error('Erro ao criar categoria:', error);
        },
      });
    } else {
      console.error('O nome da categoria não pode estar vazio');
    }
  }

  cancelEditCategory() {
    console.log('Edit canceled for category:', this.editingCategory);
    this.editingCategory = null;
  }

  // Deletar categoria
  deleteCategory(id: number) {
    this.loading = true;
    this.categoryService.deleteCategory(id).subscribe({
      next: (response) => {
        console.log('Category deleted successfully:', response);
        this.message = 'Category deleted successfully!';
        this.success = true;
        this.loadCategories();
      },
      error: (err) => {
        console.error('Error deleting category:', err);
        this.message = 'Failed to delete category.';
        this.success = false;
      },
      complete: () => {
        this.loading = false; // Finaliza o carregamento
      },
    });
  }

  // Editar comentário
  startEditComment(comment: any) {
    console.log('Editing comment:', comment);
    this.editingComment = { ...comment };
  }

  saveEditComment() {
    if (this.editingComment) {
      this.loading = true;
      console.log('Saving comment:', this.editingComment);
      this.commentService
        .updateComment(this.editingComment.id, this.editingComment)
        .subscribe({
          next: () => {
            console.log('Comment updated successfully:', this.editingComment);
            this.message = 'Comment updated successfully!';
            this.success = true;
            this.loadComments();
            this.editingComment = null;
          },
          error: (error) => {
            console.error('Error updating comment:', error);
            this.message = 'Failed to update comment.';
            this.success = false;
            this.loading = false; // Finaliza o carregamento
          },
          complete: () => {
            this.loading = false; // Finaliza o carregamento
          },
        });
    }
  }

  addComment(): void {
    const userId = parseInt(localStorage.getItem('userId') || '0', 10) || null;
    const username = localStorage.getItem('userName') || 'Visitor';

    if (this.newComment.trim()) {
      const comment: Comment = {
        postId: this.selectedPostId!,
        userId: userId,
        content: this.newComment,
        created_at: new Date().toISOString(),
        visibility: 'public',
        username,
      };

      console.log('Conteúdo do novo comentário:', this.newComment);
      console.log('ID do post associado:', this.selectedPostId);
      console.log('ID do usuário:', userId);
      console.log('Nome de usuário:', username);
      console.log('Comentário a ser enviado:', comment);

      this.commentService.addComment(comment).subscribe(
        () => {
          console.log('Comentário enviado ao backend');
          this.newComment = '';
          this.loadComments(); // Método para carregar os comentários do post
        },
        (error) => {
          console.error('Erro ao adicionar comentário:', error);
          this.message = 'Erro ao adicionar comentário. Tente novamente.';
        }
      );
    } else {
      console.error('O conteúdo do comentário não pode estar vazio');
      this.message = 'Por favor, insira um comentário antes de enviar.';
    }
  }

  cancelEditComment() {
    console.log('Edit canceled for comment:', this.editingComment);
    this.editingComment = null;
  }

  // Deletar comentário
  deleteComment(id: number) {
    this.loading = true;
    this.commentService.deleteComment(id).subscribe({
      next: (response) => {
        console.log('Comment deleted successfully:', response);
        this.message = 'Comment deleted successfully!';
        this.success = true;
        this.loadComments();
      },
      error: (err) => {
        console.error('Error deleting comment:', err);
        this.message = 'Failed to delete comment.';
        this.success = false;
        this.loading = false; // Finaliza o carregamento
      },
      complete: () => {
        this.loading = false; // Finaliza o carregamento
      },
    });
  }

  // Editar post
  startEditPost(post: any) {
    console.log('Editing post:', post);
    this.editingPost = { ...post };
  }

  saveEditPost() {
    if (this.editingPost) {
      this.loading = true;
      console.log('Saving post:', this.editingPost);
      this.postService
        .updatePost(this.editingPost.id, this.editingPost)
        .subscribe({
          next: () => {
            console.log('Post updated successfully:', this.editingPost);
            this.message = 'Post updated successfully!';
            this.success = true;
            this.editingPost = null;
            this.loadPostsAdmin();
          },
          error: (error) => {
            console.error('Error updating post:', error);
            this.message = 'Failed to update post.';
            this.success = false;
            this.loading = false; // Finaliza o carregamento
          },
          complete: () => {
            this.loading = false; // Finaliza o carregamento
          },
        });
    }
  }

  cancelEditPost() {
    console.log('Edit canceled for post:', this.editingPost);
    this.editingPost = null;
  }

  // Deletar post
  deletePost(id: number) {
    this.loading = true;
    this.postService.deletePost(id).subscribe({
      next: (response) => {
        console.log('Post deleted successfully:', response);
        this.message = 'Post deleted successfully!';
        this.success = true;
        this.editingPost = null;
        this.loadPostsAdmin();
      },
      error: (err) => {
        console.error('Error deleting post:', err);
        this.message = 'Failed to delete post.';
        this.success = false;
        this.loading = false; // Finaliza o carregamento
      },
      complete: () => {
        this.loading = false; // Finaliza o carregamento
      },
    });
  }

  // Método para abrir o modal para qualquer tipo de item
  openModal(
    itemId: number,
    type: 'user' | 'post' | 'comment' | 'category'
  ): void {
    this.currentId = itemId;
    this.itemType = type;
    this.isModalOpen = true;
  }

  // Método para fechar o modal
  closeModal(): void {
    this.isModalOpen = false;
    this.currentId = null;
    this.itemType = null;
  }

  // Método para confirmar a deleção
  confirmDelete(
    itemId: number,
    type: 'user' | 'post' | 'comment' | 'category'
  ): void {
    this.openModal(itemId, type);
  }

  // Método para deletar o item conforme seu tipo
  // ...

  // Método para deletar o item conforme seu tipo
  deleteItemModal(): void {
    if (this.currentId && this.itemType) {
      let deleteObservable;

      // Verifica o tipo do item e atribui o serviço correspondente
      switch (this.itemType) {
        case 'user':
          deleteObservable = this.userService.deleteUser(this.currentId);
          break;
        case 'post':
          deleteObservable = this.postService.deletePost(this.currentId);
          break;
        case 'category':
          deleteObservable = this.categoryService.deleteCategory(
            this.currentId
          );
          break;
        case 'comment':
          deleteObservable = this.commentService.deleteComment(this.currentId);
          break;
        default:
          console.error('Tipo de item não reconhecido:', this.itemType);
          return;
      }

      // Executa o serviço de deleção e trata o resultado
      deleteObservable.subscribe({
        next: () => {
          console.log(`${this.itemType} deletado com sucesso!`);
          this.message = `${this.itemType} deletado com sucesso!`;
          this.success = true;

          // Recarrega os dados da lista correspondente ao tipo do item
          switch (this.itemType) {
            case 'user':
              this.loadUsers();
              break;
            case 'post':
              this.loadPostsAdmin();
              break;
            case 'category':
              this.loadCategories();
              break;
            case 'comment':
              this.loadComments();
              break;
          }

          this.closeModal(); // Fecha o modal após a deleção
        },
        error: (err) => {
          console.error(`Erro ao deletar ${this.itemType}:`, err);
          this.message = `Falha ao deletar ${this.itemType}.`;
          this.success = false;
        },
        complete: () => {
          setTimeout(() => {
            this.message = ''; // Limpa a mensagem após um tempo
          }, 2000);
        },
      });
    } else {
      console.error(
        'ID ou tipo de item não são válidos:',
        this.currentId,
        this.itemType
      );
    }
  }

  loadAllData(): void {
    this.loadUsers();
    this.loadPostsAdmin();
    this.loadCategories();
    this.loadComments();
  }
}
