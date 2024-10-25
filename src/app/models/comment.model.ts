export interface Comment {
  id?: number; // ID do comentário
  postId: number; // ID do post ao qual o comentário pertence
  userId: number | null; // Permite que userId seja null
  username: string; // Adiciona o username
  content: string; // Conteúdo do comentário
  visibility: string; // Adicionando a visibilidade
  created_at: string; // Data de criação do comentário
}
