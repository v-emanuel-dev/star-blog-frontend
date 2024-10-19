import { Category } from "./category.model";

export interface Post {
  id?: number;
  title: string;
  content: string;
  user_id: number;
  visibility: string;
  created_at?: string
  username?: string;
  categoryId?: number | null; // Opcional, se a categoria não estiver definida
  comments?: Comment[]; // Adicione esta linha
  category_name?: string; // Adicione esta linha
  categoryIds?: number[]; // Use `categoryIds` se você precisar de um array
  categories?: Category[]; // Adiciona a nova propriedade
  role?: string; // Se o campo role for opcional
  imageUrl?: string | null; // Permitir null
  likes: number; // Mude de 0 para number
}
