import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Observable, of } from 'rxjs';
import { Category } from '../../../models/category.model';
import { Comment } from '../../../models/comment.model';
import { Post } from '../../../models/post.model';
import { User } from '../../../models/user.model';
import { CategoryService } from '../../../services/category.service';
import { CommentService } from '../../../services/comment.service';
import { PostService } from '../../../services/post.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  editingUser: any = null;
  editingCategory: any = null;
  editingComment: any = null;
  editingPost: any = null;
  isModalOpen: boolean = false;
  currentPostId: number | null = null;
  currentId: number | null = null;
  itemType: 'user' | 'post' | 'comment' | 'category' | null = null;
  loading: boolean = true;
  newCategoryName: string = '';
  postId: number = 0;
  newComment: string = '';
  comments: Comment[] = [];
  selectedPostId: number | null = null;

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
  selectedPost: string | null = '';

  public Editor = ClassicEditor.default;
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
    private snackBar: MatSnackBar
  ) {
    this.selectedTab = 'users';
    this.users$ = this.userService.users$;
    this.posts$ = this.postService.posts$;
    this.categories$ = this.categoryService.categories$;
    this.comments$ = this.commentService.comments$;
  }

  ngOnInit() {
    this.loadAllData();

    const savedTab = localStorage.getItem('selectedTab');
    if (savedTab) {
      this.selectedTab = savedTab;
    }
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
    localStorage.setItem('selectedTab', tab);
  }

  onTabChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectTab(target.value);
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.snackbar('Failed to load users.');
        this.loading = false;
      },
    });
  }

  loadPostsAdmin(): void {
    this.loading = true;
    this.postService.getPostsAdminDashboard().subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        this.snackbar('Failed to load posts.');
        this.loading = false;
      },
    });
  }

  loadCategories(newCategory?: Category): void {
    this.loading = true;

    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        if (newCategory) {
          categories.unshift(newCategory); // Adiciona a nova categoria no início da lista
        }
        // Ordena as categorias após adicionar a nova, caso haja uma ordem específica desejada
        this.categories$ = of(
          categories.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
        );
        this.loading = false;
      },
      error: () => {
        this.snackbar('Failed to load categories.');
        this.loading = false;
      },
    });
  }

  loadComments(): void {
    this.loading = true;
    this.commentService.getAllComments().subscribe({
      next: (comments) => {
        this.commentService.updateComments(comments);
        this.loading = false;
      },
      error: () => {
        this.snackbar('Failed to load comments.');
        this.loading = false;
      },
    });
  }

  public onReady(editor: any): void {
    delete editor.plugins.get('FileRepository').createUploadAdapter;
  }

  startEditUser(user: any) {
    this.editingUser = { ...user };
  }

  saveEditUser() {
    if (this.editingUser) {
      this.loading = true;

      this.userService
        .updateUserAdmin(this.editingUser.id, this.editingUser)
        .subscribe({
          next: () => {
            this.snackbar('User updated successfully!');
            this.editingUser = null;
          },
          error: () => {
            this.snackbar('Failed to update user.');
          },
          complete: () => {
            this.loading = false;
            this.loadUsers();
          },
        });
    }
  }

  cancelEditUser() {
    this.editingUser = null;
  }

  deleteUser(id: number) {
    this.loading = true;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.snackbar('User deleted successfully!');
        this.loadUsers();
      },
      error: () => {
        this.snackbar('Failed to delete user.');
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  startEditCategory(category: any) {
    this.editingCategory = { ...category };
  }

  saveEditCategory() {
    if (this.editingCategory) {
      this.loading = true;

      this.categoryService
        .updateCategory(this.editingCategory.id, this.editingCategory)
        .subscribe({
          next: () => {
            this.snackbar('Category updated successfully!');
            this.loadCategories();
            this.editingCategory = null;
          },
          error: () => {
            this.snackbar('Failed to update category.');
          },
          complete: () => {
            this.loading = false;
          },
        });
    }
  }

  addCategory(): void {
    if (this.newCategoryName.trim()) {
      const category: Omit<Category, 'id'> = {
        name: this.newCategoryName,
        postId: this.currentPostId,
      };

      this.categoryService.createCategory(category).subscribe({
        next: (createdCategory) => {
          this.newCategoryName = '';
          this.loadCategories(createdCategory);
          this.snackbar('Category created successfully!');
        },
        error: () => {
          this.snackbar('Failed to create category.');
        },
      });
    } else {
      this.snackbar('Category name cannot be empty.');
    }
  }

  cancelEditCategory() {
    this.editingCategory = null;
  }

  deleteCategory(id: number) {
    this.loading = true;
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.snackbar('Category deleted successfully!');
        this.loadCategories();
      },
      error: () => {
        this.snackbar('Failed to delete category.');
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  startEditComment(comment: any) {
    this.editingComment = { ...comment };
  }

  saveEditComment() {
    if (this.editingComment) {
      this.loading = true;
      this.commentService
        .updateComment(this.editingComment.id, this.editingComment)
        .subscribe({
          next: () => {
            this.snackbar('Comment updated successfully!');
            this.loadComments();
            this.editingComment = null;
          },
          error: () => {
            this.snackbar('Failed to update comment.');
            this.loading = false;
          },
          complete: () => {
            this.loading = false;
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

      this.commentService.addComment(comment).subscribe(
        () => {
          this.newComment = '';
          this.loadComments();
          this.snackbar('Comment added successfully!');
        },
        () => {
          this.snackbar('Failed to add comment. Please try again.');
        }
      );
    } else {
      this.snackbar('Comment cannot be empty.');
    }
  }

  cancelEditComment() {
    this.editingComment = null;
  }

  deleteComment(id: number) {
    this.loading = true;
    this.commentService.deleteComment(id).subscribe({
      next: () => {
        this.snackbar('Comment deleted successfully!');
        this.loadComments();
      },
      error: () => {
        this.snackbar('Failed to delete comment.');
      },
      complete: () => {
        this.loading = false;
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
            this.snackbar('Post updated successfully!');
            this.editingPost = null;
            this.loadPostsAdmin();
          },
          error: (error) => {
            this.snackbar('Failed to update post.');
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
        this.snackbar('Post deleted successfully!');
        this.editingPost = null;
        this.loadPostsAdmin();
      },
      error: (err) => {
        this.snackbar('Failed to delete post.');
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
          this.snackbar(`${this.itemType} Deleted successfully!`);

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
          this.snackbar(`Failed to delete ${this.itemType}.`);
        },
      });
    } else {
      this.snackbar('ID or item type are not valid:');
    }
  }

  loadAllData(): void {
    this.loadUsers();
    this.loadPostsAdmin();
    this.loadCategories();
    this.loadComments();
  }

  snackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: 'star-snackbar',
    });
  }
}
