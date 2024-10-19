import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { CategoryService } from '../../../services/category.service';
import { CommentService } from '../../../services/comment.service';
import { PostService } from '../../../services/post.service';
import { catchError, forkJoin, Observable, of, tap } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'], // Corrigi 'styleUrl' para 'styleUrls'
})
export class DashboardComponent implements OnInit {
  users: any[] = [];
  editingUser: any = null;
  categories: any[] = [];
  editingCategory: any = null;
  comments: any[] = [];
  editingComment: any = null;
  posts: any[] = [];
  editingPost: any = null;
  success: boolean = false; // Status de sucesso ou falha das ações
  message: string | null = null; // Mensagem a ser exibida
  isModalOpen: boolean = false;
  currentPostId: number | null = null;
  currentId: number | null = null; // ID do item a ser deletado (genérico para post, user, comment, category)
  itemType: 'user' | 'post' | 'comment' | 'category' | null = null; // Tipo de item
  loading: boolean = true; // Indicador de carregamento
  sections = [
    { name: 'Users', isEditing: false },
    { name: 'Categories', isEditing: false },
    { name: 'Comments', isEditing: false },
    { name: 'Posts', isEditing: false },
  ];

  constructor(
    private userService: UserService,
    private categoryService: CategoryService,
    private commentService: CommentService,
    private postService: PostService
  ) {}

  ngOnInit() {
    console.log('ngOnInit called');
    this.loadAllData();
  }

  loadUsers(): Observable<any> {
    return this.userService.getUsers().pipe(
      tap((data) => {
        this.users = data;
        console.log('Users loaded:', this.users);
      }),
      catchError((error) => {
        console.error('Error loading users:', error);
        return of([]); // Retorna um array vazio em caso de erro para evitar quebra
      })
    );
  }

  loadCategories(): Observable<any> {
    return this.categoryService.getAllCategories().pipe(
      tap((data) => {
        this.categories = data;
        console.log('Categories loaded:', this.categories);
      }),
      catchError((error) => {
        console.error('Error loading categories:', error);
        return of([]);
      })
    );
  }

  loadComments(): Observable<any> {
    return this.commentService.getAllComments().pipe(
      tap((data) => {
        this.comments = data;
        console.log('Comments loaded:', this.comments);
      }),
      catchError((error) => {
        console.error('Error loading comments:', error);
        return of([]);
      })
    );
  }

  loadPosts(): Observable<any> {
    return this.postService.getPosts().pipe(
      tap((data) => {
        this.posts = data;
        console.log('Posts loaded:', this.posts);
      }),
      catchError((error) => {
        console.error('Error loading posts:', error);
        return of([]);
      })
    );
  }

  // Editar usuário
  startEditUser(user: any) {
    console.log('Editing user:', user);
    this.editingUser = { ...user };
  }

  saveEditUser() {
    if (this.editingUser) {
      this.loading = true;
      console.log('Saving user:', this.editingUser);
      this.userService
        .updateUserAdmin(this.editingUser.id, this.editingUser)
        .subscribe({
          next: () => {
            console.log('User updated successfully:', this.editingUser);
            this.message = 'User updated successfully!';
            this.success = true;
            this.loadUsers();
            this.editingUser = null;
          },
          error: (error) => {
            console.error('Error updating user:', error);
            this.message = 'Failed to update user.';
            this.success = false;
            this.loading = false; // Garantindo que loading seja false em caso de erro
          },
          complete: () => {
            this.loading = false; // Finaliza o carregamento
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
            this.loadPosts();
            this.editingPost = null;
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
        this.loadPosts();
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
          // Chama o método correto para recarregar a lista após a exclusão
          switch (this.itemType) {
            case 'user':
              this.loadUsers();
              break;
            case 'post':
              this.loadPosts();
              break;
            case 'category':
              this.loadCategories();
              break;
            case 'comment':
              this.loadComments();
              break;
          }

          this.message = `${this.itemType} deletado com sucesso!`;
          this.success = true;
          this.closeModal(); // Fecha o modal após a deleção
        },
        error: (err) => {
          console.error(`Erro ao deletar ${this.itemType}:`, err); // Exibe o erro detalhado no console
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

  // Método para carregar todos os dados
  loadAllData() {
    this.loading = true; // Inicia o carregamento
    // Cria um array de observables para aguardar a conclusão de todas as operações
    forkJoin([
      this.loadUsers(),
      this.loadCategories(),
      this.loadComments(),
      this.loadPosts(),
    ]).subscribe({
      next: () => {
        console.log('All data loaded successfully.');
      },
      error: (error) => {
        console.error('Error loading data:', error);
      },
      complete: () => {
        this.loading = false; // Finaliza o carregamento quando todos os dados forem carregados
      },
    });
  }
}
