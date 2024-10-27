import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { saveAs } from 'file-saver';
import { Post } from '../../models/post.model';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { catchError, forkJoin, of, Subscription } from 'rxjs';
import { UserService } from '../../services/user.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-blog-list',
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.css'],
})
export class BlogListComponent implements OnInit {
  posts: Post[] = []; // Todos os posts
  categories: Category[] = []; // Definindo a propriedade categories
  postId: number = 0;
  filteredPosts: Post[] = []; // Posts filtrados pela busca
  searchTerm: string = ''; // Termo de busca
  success: boolean = false; // Status de sucesso ou falha das ações
  isLoggedIn: boolean = false; // Verifica se o usuário está logado
  loading: boolean = true; // Indicador de carregamento
  postsTitle: string = ''; // Título dos posts
  isModalOpen: boolean = false;
  currentPostId: number | null = null;
  message: string | null = null; // Mensagem a ser exibida
  isLoadingCategories: boolean = true;
  isAdmin: boolean = false; // Adicione esta variável
  userRole: string | null = null; // Propriedade para armazenar o papel do usuário

  private roleSubscription: Subscription = new Subscription();

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private userService: UserService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.roleSubscription = this.authService.userRole$.subscribe((role) => {
      this.userRole = role;
      this.cd.detectChanges(); // Força a atualização da view
    });

    this.route.queryParams.subscribe((params) => {
      const profileImageUrl = params['profileImage'];

      if (profileImageUrl) {
        this.userService.updateProfilePicture(profileImageUrl);
      }
    });

    this.getPosts(); // Carrega os posts na inicialização

    this.isLoggedIn = this.authService.isLoggedIn();

    // Verifica se há mensagens de erro nos parâmetros de consulta
    this.route.queryParams.subscribe((params) => {
      if (params['message']) {
        this.message = params['message'];
        this.success = false;
      }
    });
  }

  toggleLike(postId: number): void {
    this.postService.toggleLike(postId).subscribe(
      (response) => {
        console.log(response);
        // Aqui, você deve atualizar a contagem de likes do post
        const post = this.posts.find((p) => p.id === postId);
        if (post) {
          post.likes = post.likes ? post.likes + 1 : 1; // Incrementa ou inicializa o número de likes
        }
      },
      (error) => {
        console.error('Erro ao curtir/descurtir post:', error);
      }
    );
  }

  loadCategories(postId: number): void {
    this.categoryService.getCategoriesByPostId(postId).subscribe(
      (data: Category[]) => {
        // Encontre o post correspondente e atualize suas categorias
        const post = this.posts.find((p) => p.id === postId);
        if (post) {
          post.categories = data;
        }
      },
      (error) => {
        console.error('Erro ao obter categorias:', error);
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
            // Ordenação de posts mais recentes primeiro
            this.posts = data.sort((a, b) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateB - dateA; // Ordem decrescente
            });

            // Filtragem para exibir apenas posts públicos para usuários não logados
            this.filteredPosts = this.isLoggedIn
              ? this.posts
              : this.posts.filter((post) => post.visibility === 'public');

            this.updatePostsTitle();
            this.loading = false;

            // Carrega as categorias para cada post, verificando se o ID é válido
            this.posts.forEach((post) => {
              if (post.id !== undefined) {
                this.loadCategories(post.id);
              } else {
                console.error('Post ID é undefined:', post);
              }
            });
          },
          error: (error) => {
            console.error('Erro ao obter posts:', error);
            this.loading = false;
          },
        });
      },
      (error) => {
        console.error('Error fetching user role:', error);
        this.loading = false;
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

    this.updatePostsTitle(); // Atualiza o título após filtrar os posts
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
        this.getPosts(); // Atualiza a lista de posts após a exclusão
        this.message = 'Post deletado com sucesso!';
        this.success = true;
      },
      error: (err) => {
        console.error('Erro ao deletar post:', err); // Exibe o erro detalhado no console
        this.message = 'Falha ao deletar o post.';
        this.success = false;
      },
      complete: () => {
        setTimeout(() => {
          this.message = '';
        }, 2000);
      },
    });
  }

  exportAsTxt(post: Post): void {
    // Remove tags HTML do conteúdo
    const plainText = post.content.replace(/<[^>]*>/g, '');

    const content = `Título: ${post.title}\n\nConteúdo:\n${plainText}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${post.title}.txt`);
    this.message = 'Texto exportado com sucesso!';
    this.success = true;
    setTimeout(() => {
      this.message = '';
    }, 2000);
  }

  // Método para abrir o modal
  openModal(postId: number): void {
    this.currentPostId = postId; // Armazena o ID do post a ser deletado
    this.isModalOpen = true; // Abre o modal
  }

  // Método para fechar o modal
  closeModal(): void {
    this.isModalOpen = false; // Fecha o modal
    this.currentPostId = null; // Limpa o ID atual
  }

  // Método de confirmação de deleção
  confirmDelete(postId: number): void {
    this.openModal(postId); // Abre o modal com o ID do post
  }

  // Método para deletar o post
  deletePostModal(postId: number): void {
    if (postId) {
      this.postService.deletePost(postId).subscribe({
        next: () => {
          this.getPosts(); // Atualiza a lista de posts após a exclusão
          this.message = 'Post deletado com sucesso!';
          this.success = true;
          this.closeModal(); // Fecha o modal após a deleção
        },
        error: (err) => {
          console.error('Erro ao deletar post:', err); // Exibe o erro detalhado no console
          this.message = 'Falha ao deletar o post.';
          this.success = false;
        },
        complete: () => {
          setTimeout(() => {
            this.message = ''; // Limpa a mensagem após um tempo
          }, 2000);
        },
      });
    } else {
      console.error('ID do post não é válido:', postId);
    }
  }
}
