import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { saveAs } from 'file-saver';
import { Subscription } from 'rxjs';
import { Category } from '../../models/category.model';
import { Post } from '../../models/post.model';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { PostService } from '../../services/post.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-blog-list',
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.css'],
})
export class BlogListComponent implements OnInit {
  posts: Post[] = [];
  categories: Category[] = [];
  postId: number = 0;
  filteredPosts: Post[] = [];
  searchTerm: string = '';
  isLoggedIn: boolean = false;
  loading: boolean = true;
  postsTitle: string = '';
  isModalOpen: boolean = false;
  currentPostId: number | null = null;
  isLoadingCategories: boolean = true;
  isAdmin: boolean = false;
  userRole: string | null = null;
  private roleSubscription: Subscription = new Subscription();

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.roleSubscription = this.authService.userRole$.subscribe((role) => {
      this.userRole = role;
      this.cd.detectChanges();
    });

    this.route.queryParams.subscribe((params) => {
      const profileImageUrl = params['profileImage'];
      if (profileImageUrl) {
        this.userService.updateProfilePicture(profileImageUrl);
      }
    });

    this.getPosts();
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  toggleLike(postId: number): void {
    this.postService.toggleLike(postId).subscribe(
      (response) => {
        const post = this.posts.find((p) => p.id === postId);
        if (post) {
          post.likes = post.likes ? post.likes + 1 : 1;
        }
      },
      (error) => {
        this.snackbar('Error toggling like');
      }
    );
  }

  loadCategories(postId: number): void {
    this.categoryService.getCategoriesByPostId(postId).subscribe(
      (data: Category[]) => {
        const post = this.posts.find((p) => p.id === postId);
        if (post) {
          post.categories = data;
        }
      },
      (error) => {
        this.snackbar('Error fetching categories');
      }
    );
  }

  getPosts(): void {
    this.loading = true;

    this.authService.getUserRole().subscribe(
      (userRole) => {
        const isAdmin = userRole === 'admin';
        const postsObservable = isAdmin
          ? this.postService.getPostsAdmin()
          : this.postService.getPosts();

        postsObservable.subscribe({
          next: (data: Post[]) => {
            this.posts = data.sort((a, b) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA;
            });

            this.filteredPosts = this.isLoggedIn
              ? this.posts
              : this.posts.filter((post) => post.visibility === 'public');

            this.updatePostsTitle();
            this.loading = false; // Atualiza o loading imediatamente

            this.posts.forEach((post) => {
              if (post.id !== undefined) {
                this.loadCategories(post.id);
              } else {
                this.snackbar('Post ID is undefined');
              }
            });
          },
          error: (error) => {
            this.snackbar('Error fetching posts');
            this.loading = false; // Atualiza o loading imediatamente
          },
        });
      },
      (error) => {
        this.snackbar('Error fetching user role.');
        this.loading = false; // Atualiza o loading imediatamente
      }
    );
  }

  filterPosts(): void {
    const searchTermLower = this.searchTerm.toLowerCase().trim();
    this.filteredPosts = this.posts.filter((post) => {
      const matchesTitle = post.title.toLowerCase().includes(searchTermLower);
      const matchesContent = post.content
        .toLowerCase()
        .includes(searchTermLower);

      const matchesCategory =
        post.categories && Array.isArray(post.categories)
          ? post.categories.some((category) =>
              category.name.toLowerCase().includes(searchTermLower)
            )
          : false;

      return matchesTitle || matchesContent || matchesCategory;
    });

    this.updatePostsTitle();
  }

  updatePostsTitle(): void {
    const hasPrivatePosts = this.filteredPosts.some(
      (post) => post.visibility === 'private'
    );
    const hasPublicPosts = this.filteredPosts.some(
      (post) => post.visibility === 'public'
    );
    if (hasPrivatePosts && hasPublicPosts) {
      this.postsTitle = 'Public and Private';
    } else if (hasPrivatePosts) {
      this.postsTitle = 'Private';
    } else {
      this.postsTitle = 'Public';
    }
  }

  editPost(postId: number): void {
    this.router.navigate(['/blog/edit', postId]);
  }

  deletePost(postId: number): void {
    this.postService.deletePost(postId).subscribe({
      next: () => {
        this.getPosts();
        this.snackbar('Post deleted successfully.');
      },
      error: (err) => {
        console.error('Error deleting post:', err);
        this.snackbar('Failed to delete post.');
      },
    });
  }

  exportAsTxt(post: Post): void {
    const plainText = post.content.replace(/<[^>]*>/g, '');

    const content = `Title: ${post.title}\n\nContent:\n${plainText}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${post.title}.txt`);
    this.snackbar('Text exported successfully.');
  }

  openModal(postId: number): void {
    this.currentPostId = postId;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentPostId = null;
  }

  confirmDelete(postId: number): void {
    this.openModal(postId);
  }

  deletePostModal(postId: number): void {
    if (postId) {
      this.postService.deletePost(postId).subscribe({
        next: () => {
          this.getPosts();
          this.snackbar('Post deleted successfully.');
          this.closeModal();
        },
        error: (err) => {
          this.snackbar('Error deleting post:');
          this.snackbar('Failed to delete post.');
        },
      });
    } else {
      this.snackbar('Invalid post ID:');
    }
  }

  snackbar(message: string): void {
    this.snackBar.open(message, '', {
      duration: 2000,
    });
  }
}
