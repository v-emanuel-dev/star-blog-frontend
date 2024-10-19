import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { saveAs } from 'file-saver';
import { Post } from '../../models/post.model';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { catchError, forkJoin, of } from 'rxjs';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-blog-list',
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.css'],
})
export class BlogListComponent implements OnInit {
  posts: Post[] = []; // Todos os posts
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

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const profileImageUrl = params['profileImage'];

      if (profileImageUrl) {
        this.userService.updateProfilePicture(profileImageUrl);
        console.log(
          'Profile image updated after Google login:',
          profileImageUrl
        );
      }
    });
    this.loadPostsAndCategories();
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
      response => {
        console.log(response);
        // Aqui, você deve atualizar a contagem de likes do post
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.likes = post.likes ? post.likes + 1 : 1; // Incrementa ou inicializa o número de likes
        }
      },
      error => {
        console.error('Erro ao curtir/descurtir post:', error);
      }
    );
  }

  loadPostsAndCategories(): void {
    this.isLoadingCategories = true;

    this.postService.getPosts().subscribe({
      next: (posts) => {
        this.posts = posts;

        // Cria uma lista de observables para buscar as categorias de cada post
        const categoryRequests = this.posts.map((post) => {
          if (post.id !== undefined) {
            return this.categoryService.getCategoriesByPostId(post.id).pipe(
              catchError((error) => {
                console.error(
                  `Erro ao carregar categorias do post ${post.id}:`,
                  error
                );
                return of([]); // Retorna um array vazio em caso de erro
              })
            );
          } else {
            return of([]);
          }
        });

        // Usa forkJoin para esperar todas as requisições de categorias
        forkJoin(categoryRequests).subscribe({
          next: (categoriesArray) => {
            categoriesArray.forEach((categories, index) => {
              this.posts[index].categories = categories;
            });
            this.isLoadingCategories = false;
            this.updatePostsTitle(); // Atualiza o título após carregar categorias
          },
          error: (error) => {
            console.error('Erro ao carregar as categorias:', error);
            this.isLoadingCategories = false;
          },
        });
      },
      error: (error) => {
        console.error('Erro ao carregar os posts:', error);
        this.isLoadingCategories = false;
      },
    });
  }

  getPosts(): void {
    this.loading = true;

    // Inscreva-se no Observable para obter o papel do usuário
    this.authService.getUserRole().subscribe(
      (userRole) => {
        const isAdmin = userRole === 'admin'; // Verifica se o papel é admin

        // Se for admin, carrega todos os posts usando getPostsAdmin
        const postsObservable = isAdmin
          ? this.postService.getPostsAdmin()
          : this.postService.getPosts();

        postsObservable.subscribe({
          next: (data: Post[]) => {
            this.posts = data; // Atribui posts à variável posts
            console.log("Data:", data);
            this.filteredPosts = this.isLoggedIn
              ? this.posts
              : this.posts.filter((post) => post.visibility === 'public');
            this.updatePostsTitle();
            this.loading = false; // Para parar o loading
          },
          error: (error) => {
            console.error('Erro ao obter posts:', error);
            this.loading = false; // Para parar o loading em caso de erro
          },
        });

        // Define o título para admins
        this.postsTitle = isAdmin ? 'All Posts' : this.postsTitle;
      },
      (error) => {
        console.error('Error fetching user role:', error);
        this.loading = false; // Para parar o loading em caso de erro ao buscar o papel do usuário
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
      this.postsTitle = 'Public and Private Posts';
    } else if (hasPrivatePosts) {
      this.postsTitle = 'Private Posts';
    } else {
      this.postsTitle = 'Public Posts';
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
    const content = `Título: ${post.title}\n\nConteúdo:\n${post.content}`;
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
