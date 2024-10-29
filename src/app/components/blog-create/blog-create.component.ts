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
  selector: 'app-blog-create',
  templateUrl: './blog-create.component.html',
  styleUrls: ['./blog-create.component.css'],
})
export class BlogCreateComponent implements OnInit {
  title: string = '';
  content: string = '';
  visibility: string = 'public';
  user_id: number = 0;
  postId: number | null = null;
  categories: Category[] = [];
  newCategoryName: string = '';
  selectedCategoryIds: number[] = [];
  currentPostId: number | null = null;
  editorContent: string = '';
  isModalOpen: boolean = false;
  currentCategoryId: number | null = null;
  editingCategory: any = null;
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
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.categoryService.loadCategories();

    this.categoryService.categories$.subscribe((categories) => {
      this.categories = categories;
    });

    this.route.params.subscribe((params) => {
      this.currentPostId = +params['postId'];

      if (this.currentPostId !== null) {
        this.loadCategories();
      } else {
        this.snackbar('currentPostId is null. Cannot load categories.');
      }
    });

    this.getUserId();
    this.setVisibility();
  }

  public onReady(editor: any): void {
    delete editor.plugins.get('FileRepository').createUploadAdapter;
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

  createPost(): void {
    const userRole = 'user';

    if (!this.title.trim() || !this.content.trim()) {
      this.snackbar('Title and content are required.');
      return;
    }

    if (this.selectedCategoryIds.length === 0) {
      this.snackbar('At least one category is required.');
      return;
    }

    const newPost: Post = {
      id: 0,
      title: this.title.trim(),
      content: this.content.trim(),
      user_id: this.user_id,
      visibility: this.visibility,
      categoryIds: this.selectedCategoryIds,
      role: userRole,
      likes: 0,
    };

    this.loading = true;

    this.postService.createPost(newPost).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackbar('Post created successfully!');
        this.router.navigate(['/blog']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating post:', error);
        this.snackbar('Error creating post.');
      },
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe((data: Category[]) => {
      this.categories = data;
    });
  }

  addCategory(): void {
    if (this.newCategoryName.trim()) {
      const category: Omit<Category, 'id'> = {
        name: this.newCategoryName,
        postId: this.currentPostId,
      };

      this.categoryService.createCategory(category).subscribe({
        next: () => {
          this.newCategoryName = '';
        },
        error: (error) => {
          this.snackbar('Error creating category:');
        },
      });
    }
  }

  startEditCategory(category: any) {
    this.editingCategory = { ...category };
  }

  saveEditCategory() {
    if (this.editingCategory) {
      this.categoryService
        .updateCategory(this.editingCategory.id, this.editingCategory)
        .subscribe({
          next: () => {
            this.snackbar('Category updated successfully!');
            this.loadCategories();
            this.editingCategory = null;
          },
          error: (error) => {
            this.snackbar('Failed to update category.');
          },
        });
    }
  }

  cancelEditCategory() {
    this.editingCategory = null;
  }

  deleteCategory(categoryId: number): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoryService.deleteCategory(categoryId).subscribe({
        next: () => {
          if (this.currentPostId !== null) {
            this.loadCategories();
          } else {
            this.snackbar(
              'CurrentPostId is null. Cannot load categories after deletion.'
            );
          }
          this.snackbar('Category deleted successfully!');
        },
        error: (error) => {
          this.snackbar('Failed to delete category.');
        },
      });
    }
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

  openModal(categoryId: number): void {
    this.currentCategoryId = categoryId;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentPostId = null;
    this.currentCategoryId = null;
  }

  confirmDelete(categoryId: number): void {
    this.openModal(categoryId);
  }

  deletePostCategory(): void {
    if (this.currentCategoryId) {
      this.categoryService.deleteCategory(this.currentCategoryId).subscribe({
        next: () => {
          this.snackBar.open('Category removed successfully!', 'Close', {
            panelClass: ['star-snackbar'],
            duration: 3000,
          });
          this.closeModal();
          this.loadCategories();
        },
        error: (err) => {
          this.snackbar('Failed to remove category.');
        },
      });
    } else {
      this.snackbar('Invalid Category ID!');
    }
  }

  snackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: 'star-snackbar'
    });
  }
}
