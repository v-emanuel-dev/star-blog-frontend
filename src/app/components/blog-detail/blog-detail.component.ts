import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Category } from '../../models/category.model';
import { Comment } from '../../models/comment.model';
import { Post } from '../../models/post.model';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { CommentService } from '../../services/comment.service';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.css'],
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  postId: number = 0;
  post: Post | null = null;
  comments: Comment[] = [];
  newComment: string = '';
  editCommentId: number | null = null;
  editCommentContent: string = '';
  userName: string | undefined;
  isLoggedIn: boolean = false;
  categories: Category[] = [];
  allCategories: Category[] = [];
  newCategoryName: string = '';
  editCategoryId: number | null = null;
  editCategoryName: string = '';
  private userNameSubscription: Subscription;
  isModalOpen = false;
  currentCommentId: number | null = null;
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService,
    private authService: AuthService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {
    this.userNameSubscription = this.authService.userName$.subscribe((name) => {
      this.userName = name;
    });
  }

  ngOnInit(): void {
    const postIdParam = this.route.snapshot.paramMap.get('id');
    if (postIdParam) {
      this.postId = +postIdParam;
      this.isLoggedIn = this.authService.isLoggedIn();
      this.loadPost();
      this.loadComments();
      this.loadCategories();
    }
  }

  toggleLike(postId: number): void {
    this.postService.toggleLike(postId).subscribe(
      (response) => {
        this.loadPost();
      },
      (error) => {
        this.openSnackBar('Error liking/unliking post');
      }
    );
  }

  loadPost(): void {
    this.loading = true; // Inicia o carregamento

    this.postService.getPostById(this.postId).subscribe(
      (post) => {
        this.post = post;
        this.post.comments = this.post.comments || [];
        this.loading = false; // Finaliza o carregamento
      },
      (error) => {
        this.openSnackBar('Error loading post');
        this.loading = false; // Finaliza o carregamento mesmo em erro
      }
    );
  }

  loadComments(): void {
    this.loading = true; // Inicia o carregamento

    this.commentService.getCommentsByPostId(this.postId).subscribe(
      (comments: Comment[]) => {
        this.comments = comments.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.loading = false; // Finaliza o carregamento
      },
      (error) => {
        this.openSnackBar('Error loading comments');
        this.loading = false; // Finaliza o carregamento mesmo em erro
      }
    );
  }

  loadCategories(): void {
    this.loading = true; // Inicia o carregamento

    this.categoryService.getCategoriesByPostId(this.postId).subscribe(
      (data: Category[]) => {
        this.categories = data;
        this.loading = false; // Finaliza o carregamento
      },
      (error) => {
        this.openSnackBar('Error fetching categories');
        this.loading = false; // Finaliza o carregamento mesmo em erro
      }
    );
  }

  addComment(): void {
    const userId = parseInt(localStorage.getItem('userId') || '0', 10) || null;
    const username = localStorage.getItem('userName') || 'Anonymous';

    if (!this.newComment.trim()) {
      this.openSnackBar('Comment cannot be empty');
      return; // Exit the function if the comment is empty
    }

    const comment: Comment = {
      postId: this.postId,
      userId: userId,
      content: this.newComment,
      created_at: new Date().toISOString(),
      visibility: 'public',
      username,
    };

    this.loading = true;

    this.commentService.addComment(comment).subscribe(
      (newComment) => {
        this.comments.push(newComment);
        this.newComment = '';
        this.loading = false;
      },
      (error) => {
        this.openSnackBar('Error adding comment');
        this.loading = false;
      }
    );
  }
  editComment(comment: Comment): void {
    this.editCommentId = comment.id ?? null;
    this.editCommentContent = comment.content;
  }

  saveComment(): void {
    if (this.editCommentContent && this.editCommentId !== null) {
      const commentToUpdate = this.comments.find(
        (c) => c.id === this.editCommentId
      );

      if (commentToUpdate) {
        const updatedComment: Comment = {
          ...commentToUpdate,
          content: this.editCommentContent,
        };

        this.loading = true;

        this.commentService
          .updateComment(this.editCommentId, updatedComment)
          .subscribe(
            (response) => {
              const index = this.comments.findIndex(
                (c) => c.id === this.editCommentId
              );
              if (index !== -1) {
                this.comments[index].content = updatedComment.content;
              }
              this.cancelEdit();
              this.loading = false;
            },
            (error) => {
              this.openSnackBar('Error saving comment');
              this.loading = false;
            }
          );
      }
    }
  }

  deleteComment(commentId: number): void {
    this.commentService.deleteComment(commentId).subscribe(() => {
      this.comments = this.comments.filter(
        (comment) => comment.id !== commentId
      );
    });
  }

  cancelEdit(): void {
    this.editCommentId = null;
    this.editCommentContent = '';
  }

  addCategory(): void {
    if (this.newCategoryName.trim()) {
      const category: Omit<Category, 'id'> = {
        name: this.newCategoryName,
        postId: this.postId,
      };

      this.loading = true;

      this.categoryService.createCategory(category).subscribe(
        () => {
          this.loadCategories();
          this.newCategoryName = '';
          this.loading = false;
        },
        (error) => {
          this.openSnackBar('Error creating category');
          this.loading = false;
        }
      );
    } else {
      this.openSnackBar('Category name cannot be empty');
    }
  }

  editCategory(category: Category): void {
    this.editCategoryId = category.id ?? null;
    this.editCategoryName = category.name;
  }

  saveCategory(): void {
    if (this.editCategoryId && this.editCategoryName) {
      const updatedCategory: Category = {
        id: this.editCategoryId,
        name: this.editCategoryName,
        postId: this.postId,
      };

      this.loading = true;

      this.categoryService
        .updateCategory(this.editCategoryId, updatedCategory)
        .subscribe(
          () => {
            this.loadCategories();
            this.cancelEditCategory();
            this.loading = false;
          },
          (error) => {
            this.openSnackBar('Error updating category');
            this.loading = false;
          }
        );
    } else {
      this.openSnackBar('Category name and post ID cannot be empty');
    }
  }

  deleteCategoryFromPost(postId: number, categoryId: number): void {
    this.categoryService.deleteCategoryFromPost(categoryId, postId).subscribe(
      () => {
        this.loadCategories();
      },
      (error) => {
        this.openSnackBar('Error deleting category association from post');
      }
    );
  }

  cancelEditCategory(): void {
    this.editCategoryId = null;
    this.editCategoryName = '';
  }

  ngOnDestroy(): void {
    this.userNameSubscription.unsubscribe();
  }

  openCommentModal(commentId: number): void {
    this.currentCommentId = commentId;
    this.isModalOpen = true;
  }

  confirmDeleteComment(commentId: number): void {
    this.openCommentModal(commentId);
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentCommentId = null;
  }

  deleteCommentModal(commentId: number): void {
    if (commentId) {
      this.commentService.deleteComment(commentId).subscribe({
        next: () => {
          this.comments = this.comments.filter(
            (comment) => comment.id !== commentId
          );
          this.closeModal();
        },
        error: (err) => {
          this.openSnackBar('Error deleting comment');
        },
      });
    } else {
      this.openSnackBar('Invalid comment ID');
    }
  }

  private openSnackBar(
    message: string,
    action: string = 'Close',
    duration: number = 3000
  ): void {
    this.snackBar.open(message, action, {
      panelClass: ['star-snackbar'],
      duration: duration,
    });
  }
}
