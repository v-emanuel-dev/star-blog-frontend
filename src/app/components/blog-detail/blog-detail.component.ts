import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../../services/post.service';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { Comment } from '../../models/comment.model';
import { Post } from '../../models/post.model';
import { Subscription } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';

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
  categories: Category[] = []; // Array para armazenar as categorias
  allCategories: Category[] = []; // Para todas as categorias
  newCategoryName: string = ''; // Campo para o nome da nova categoria
  editCategoryId: number | null = null; // ID da categoria em edição
  editCategoryName: string = ''; // Nome da categoria em edição
  private userNameSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService,
    private authService: AuthService,
    private categoryService: CategoryService
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
      this.loadCategories(this.postId);
    }
  }

  toggleLike(postId: number): void {
    this.postService.toggleLike(postId).subscribe(
      response => {
        console.log(response);
        // Atualiza a contagem de likes chamando a função loadPost para garantir que os dados estejam atualizados
        this.loadPost();
      },
      error => {
        console.error('Erro ao curtir/descurtir post:', error);
      }
    );
  }

  loadPost(): void {
    this.postService.getPostById(this.postId).subscribe(
      (post) => {
        this.post = post;
        this.post.comments = this.post.comments || [];
      },
      (error) => {
        console.error('Erro ao carregar o post:', error);
      }
    );
  }

  loadComments(): void {
    this.commentService.getCommentsByPostId(this.postId).subscribe(
      (comments: Comment[]) => {
        this.comments = comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());;
      },
      (error) => {
        console.error('Erro ao carregar comentários:', error);
      }
    );
  }

  loadCategories(postId: number): void {
    console.log('Chamando loadCategories com postId:', postId); // Verifica se a função é chamada

    this.categoryService.getCategoriesByPostId(postId).subscribe(
      (data: Category[]) => {
        console.log('postId:', postId);
        console.log('Categorias carregadas:', data);
        this.categories = data;
      },
      (error) => {
        console.error('Erro ao obter categorias:', error);
      }
    );
  }

  loadAllCategories(): void {
    console.log('Chamando loadAllCategories');

    this.categoryService.getAllCategories().subscribe(
      (data: Category[]) => {
        console.log('Todas as categorias carregadas:', data);
        this.allCategories = data;
      },
      (error) => {
        console.error('Erro ao obter todas as categorias:', error);
      }
    );
  }

  addComment(): void {
    const userId = parseInt(localStorage.getItem('userId') || '0', 10) || null;

    const comment: Comment = {
      postId: this.postId,
      userId: userId, // Deve ser um número ou null
      content: this.newComment,
      created_at: new Date().toISOString(),
      visibility: 'public',
    };

    console.log('Comentário a ser enviado:', comment); // Log para verificar a estrutura do comentário

    this.commentService.addComment(comment).subscribe(
      (newComment) => {
        console.log('Novo comentário adicionado:', newComment);
        this.comments.push(newComment);
        this.newComment = '';
        this.commentService.getCommentsByPostId(this.postId);
      },
      (error) => {
        console.error('Erro ao adicionar comentário:', error);
      }
    );
  }


  // Método para iniciar a edição de um comentário
  editComment(comment: Comment): void {
    this.editCommentId = comment.id ?? null; // Use o operador nullish coalescing
    this.editCommentContent = comment.content;
  }

  // Método para salvar o comentário editado
  saveComment(): void {
    if (this.editCommentContent && this.editCommentId !== null) {
      this.commentService
        .updateComment(this.editCommentId, { content: this.editCommentContent }) // Certifique-se de que editCommentId está definido
        .subscribe(
          (updatedComment) => {
            const index = this.comments.findIndex(
              (c) => c.id === this.editCommentId
            );
            if (index !== -1) {
              this.comments[index].content = updatedComment.content; // Atualiza o conteúdo do comentário
            }
            this.cancelEdit(); // Cancela a edição
          },
          (error) => {
            console.error('Erro ao salvar comentário:', error);
          }
        );
    }
  }

  // Método para deletar um comentário
  deleteComment(commentId: number): void {
    this.commentService.deleteComment(commentId).subscribe(() => {
      this.comments = this.comments.filter(
        (comment) => comment.id !== commentId
      ); // Remove o comentário da lista
    });
  }

  // Método para cancelar a edição
  cancelEdit(): void {
    this.editCommentId = null;
    this.editCommentContent = '';
  }

  // Métodos para gerenciar categorias
  addCategory(): void {
    if (this.newCategoryName.trim()) {
      const category: Omit<Category, 'id'> = {
        name: this.newCategoryName,
        postId: this.postId, // Inclui o postId aqui
      };

      this.categoryService.createCategory(category).subscribe({
        next: () => {
          this.loadCategories(this.postId); // Recarrega a lista de categorias após a adição
          this.newCategoryName = ''; // Limpa o campo de entrada após adicionar
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
    this.editCategoryId = category.id ?? null; // Use o operador nullish coalescing
    this.editCategoryName = category.name;
  }

  saveCategory(): void {
    if (this.editCategoryId && this.editCategoryName && this.postId) {
      const updatedCategory: Category = {
        id: this.editCategoryId,
        name: this.editCategoryName,
        postId: this.postId,
      };

      this.categoryService
        .updateCategory(this.editCategoryId, updatedCategory)
        .subscribe({
          next: () => {
            this.loadCategories(this.postId); // Recarrega a lista de categorias após a atualização
            this.cancelEditCategory(); // Limpa o estado de edição
          },
          error: (error) => {
            console.error('Erro ao atualizar categoria:', error);
          },
        });
    } else {
      console.error(
        'O nome da categoria e o ID do post não podem estar vazios'
      );
    }
  }

  deleteCategory(categoryId: number): void {
    this.categoryService.deleteCategory(categoryId).subscribe(() => {
      this.categories = this.categories.filter((cat) => cat.id !== categoryId);
    });
  }

  cancelEditCategory(): void {
    this.editCategoryId = null;
    this.editCategoryName = '';
  }

  ngOnDestroy(): void {
    this.userNameSubscription.unsubscribe(); // Limpa a assinatura ao destruir o componente
  }
}
