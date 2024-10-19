// comment.model.ts
export interface Comment {
  id?: number; // Adicione esta linha para incluir o ID do comentário
  postId: number; // ID do post ao qual o comentário pertence
  userId: number | null; // Permite que userId seja null
  content: string; // Conteúdo do comentário
  visibility: string; // Adicionando a visibilidade
  created_at: string; // Adicione essa linha
}
