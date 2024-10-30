import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Category } from '../../models/category.model';
import { Post } from '../../models/post.model';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { PostService } from '../../services/post.service';

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
  role: string = 'user';
  selectedCategoryIds: number[] = [];
  categories: Category[] = [];
  newCategoryName: string = '';
  currentPostId: number | null = null;
  post: Post;
  isModalOpen = false;
  currentCategoryId: number | null = null;
  editorContent: string = '';
  loading: boolean = false;

  public Editor = ClassicEditor.default;
  public blogEditorContent: string = '';
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
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {
    this.post = {
      id: 0,
      title: '',
      content: '',
      categories: [],
      user_id: 0,
      visibility: '',
      role: '',
      likes: 0,
    };
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const postIdParam = params['id'];
      this.postId = +postIdParam;
      if (isNaN(this.postId)) {
        return;
      }
      this.loadPost();
      this.loadCategories();
      this.loadCategoriesByPostId(this.postId);
    });

    this.userId = this.authService.getLoggedUserId() ?? 0;
  }

  loadPost(): void {
    this.loading = true;

    this.postService.getPostById(this.postId).subscribe({
      next: (post: Post) => {
        this.title = post.title;
        this.content = post.content;
        this.visibility = post.visibility as 'public' | 'private';
        this.selectedCategoryIds = post.categoryIds || [];
        this.loading = false;
      },
      error: () => {
        this.snackbar('Failed to load post.');
        this.router.navigate(['/blog']);
        this.loading = false;
      },
    });
  }

  public onReady(editor: any): void {
    delete editor.plugins.get('FileRepository').createUploadAdapter;
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
      likes: this.post.likes || 0,
    };

    this.loading = true;

    this.postService.updatePost(this.postId, updatedPost).subscribe(
      () => {
        this.snackbar('Update successful!');
        this.loading = false;
        this.router.navigate(['/blog']);
      },
      (error) => {
        this.snackbar('Failed to update post.');
        this.loading = false;
      }
    );
  }

  loadCategories(): void {
    this.loading = true;

    this.categoryService.getAllCategories().subscribe(
      (data: Category[]) => {
        // Ordena as categorias em ordem decrescente de id (assumindo que maiores ids são mais recentes)
        this.categories = data.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        this.loadCategoriesByPostId(this.postId); // Carrega as categorias relacionadas ao post
        this.loading = false;
      },
      (error) => {
        this.snackbar('Error retrieving all categories');
        this.loading = false;
      }
    );
  }

  loadCategoriesByPostId(postId: number): void {
    this.loading = true;

    this.categoryService.getCategoriesByPostId(postId).subscribe(
      (data: Category[]) => {
        // Mapeia para obter apenas os ids, tratando `id` potencialmente `undefined`
        this.selectedCategoryIds = data.map((cat) => cat.id ?? 0);
        this.loading = false;
      },
      (error) => {
        this.snackbar('Error retrieving categories by post');
        this.loading = false;
      }
    );
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
      });
    }
  }

  editCategory(category: Category): void {
    this.newCategoryName = category.name;
    this.selectedCategoryIds = category.id !== undefined ? [category.id] : [];
  }

  deleteCategory(categoryId: number): void {
    if (categoryId) {
      this.openModal(categoryId);
    }
  }

  deleteCategoryModal(categoryId: number): void {
    this.categoryService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.loadCategories();
        this.snackbar('Category deleted successfully!');
        this.closeModal();
      },
      error: (error) => {
        this.snackbar('Failed to delete category.');
      },
      complete: () => {
        setTimeout(() => {}, 2000);
      },
    });
  }

  confirmDelete(categoryId: number): void {
    this.openModal(categoryId);
  }

  openModal(categoryId: number): void {
    this.currentCategoryId = categoryId;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentCategoryId = null;
  }

  snackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: 'star-snackbar'
    });
  }
}
