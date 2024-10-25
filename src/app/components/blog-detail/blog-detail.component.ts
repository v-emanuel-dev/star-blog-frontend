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
  isModalOpen = false; // Controle do modal
  currentCommentId: number | null = null; // ID do comentário atual

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
      this.loadCategories();
    }
  }

  toggleLike(postId: number): void {
    this.postService.toggleLike(postId).subscribe(
      (response) => {
        console.log(response);
        this.loadPost(); // Atualiza o post após curtir/descurtir
      },
      (error) => {
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
    // Inscrevendo-se no Observable `comments$` diretamente
    this.commentService.comments$.subscribe(
      (comments: Comment[]) => {
        this.comments = comments.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      },
      (error) => {
        console.error('Erro ao carregar comentários:', error);
      }
    );

    // Chame getCommentsByPostId para carregar os comentários do post
    this.commentService.getCommentsByPostId(this.postId).subscribe();
  }

  loadCategories(): void {
    this.categoryService.getCategoriesByPostId(this.postId).subscribe(
      (data: Category[]) => {
        this.categories = data;
      },
      (error) => {
        console.error('Erro ao obter categorias:', error);
      }
    );
  }

  addComment(): void {
    const userId = parseInt(localStorage.getItem('userId') || '0', 10) || null;
    const username = localStorage.getItem('userName') || 'Anônimo'; // Pegando o username do localStorage

    const comment: Comment = {
      postId: this.postId,
      userId: userId,
      content: this.newComment,
      created_at: new Date().toISOString(),
      visibility: 'public',
      username // Inclui o username no objeto enviado
    };

    this.commentService.addComment(comment).subscribe(
      (newComment) => {
        this.comments.push(newComment);
        console.log('Comentário enviado ao backend:', comment); // Verifique aqui

        this.newComment = '';
      },
      (error) => {
        console.error('Erro ao adicionar comentário:', error);
      }
    );
  }

  editComment(comment: Comment): void {
    this.editCommentId = comment.id ?? null; // Use o operador nullish coalescing
    this.editCommentContent = comment.content;
  }

  saveComment(): void {
    if (this.editCommentContent && this.editCommentId !== null) {
      // Encontre o comentário que está sendo editado
      const commentToUpdate = this.comments.find(
        (c) => c.id === this.editCommentId
      );

      if (commentToUpdate) {
        const updatedComment: Comment = {
          ...commentToUpdate, // Copia as propriedades existentes do comentário
          content: this.editCommentContent, // Atualiza apenas o conteúdo
        };

        this.commentService
          .updateComment(this.editCommentId, updatedComment)
          .subscribe(
            (response) => {
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

      this.categoryService.createCategory(category).subscribe(
        () => {
          this.loadCategories(); // Recarrega a lista de categorias após a adição
          this.newCategoryName = ''; // Limpa o campo de entrada após adicionar
        },
        (error) => {
          console.error('Erro ao criar categoria:', error);
        }
      );
    } else {
      console.error('O nome da categoria não pode estar vazio');
    }
  }

  editCategory(category: Category): void {
    this.editCategoryId = category.id ?? null; // Use o operador nullish coalescing
    this.editCategoryName = category.name;
  }

  saveCategory(): void {
    if (this.editCategoryId && this.editCategoryName) {
      const updatedCategory: Category = {
        id: this.editCategoryId,
        name: this.editCategoryName,
        postId: this.postId,
      };

      this.categoryService
        .updateCategory(this.editCategoryId, updatedCategory)
        .subscribe(
          () => {
            this.loadCategories(); // Recarrega a lista de categorias após a atualização
            this.cancelEditCategory(); // Limpa o estado de edição
          },
          (error) => {
            console.error('Erro ao atualizar categoria:', error);
          }
        );
    } else {
      console.error(
        'O nome da categoria e o ID do post não podem estar vazios'
      );
    }
  }

  deleteCategoryFromPost(postId: number, categoryId: number): void {
    this.categoryService.deleteCategoryFromPost(categoryId, postId).subscribe(
      () => {
        this.loadCategories(); // Recarrega a lista após a exclusão da associação
      },
      (error) => {
        console.error(
          'Erro ao deletar a associação da categoria ao post:',
          error
        );
      }
    );
  }

  cancelEditCategory(): void {
    this.editCategoryId = null;
    this.editCategoryName = '';
  }

  ngOnDestroy(): void {
    this.userNameSubscription.unsubscribe(); // Limpa a assinatura ao destruir o componente
  }

  // Método para abrir o modal para deletar comentário
  openCommentModal(commentId: number): void {
    this.currentCommentId = commentId; // Armazena o ID do comentário a ser deletado
    this.isModalOpen = true; // Abre o modal
  }

  // Método de confirmação de deleção de comentário
  confirmDeleteComment(commentId: number): void {
    this.openCommentModal(commentId); // Abre o modal com o ID do comentário
  }

  // Método para fechar o modal
  closeModal(): void {
    this.isModalOpen = false; // Fecha o modal
    this.currentCommentId = null; // Limpa o ID atual
  }

  // Método para deletar o comentário
  deleteCommentModal(commentId: number): void {
    if (commentId) {
      this.commentService.deleteComment(commentId).subscribe({
        next: () => {
          this.comments = this.comments.filter(
            (comment) => comment.id !== commentId
          ); // Remove o comentário da lista
          this.closeModal(); // Fecha o modal após a deleção
        },
        error: (err) => {
          console.error('Erro ao deletar comentário:', err);
        },
        complete: () => {
          setTimeout(() => {
          }, 2000);
        },
      });
    } else {
      console.error('ID do comentário não é válido:', commentId);
    }
  }
}
