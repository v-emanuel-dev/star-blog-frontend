export interface Category {
  id?: number; // Se houver um id opcional
  name: string;
  postId: number | null; // Permitir null como um valor válido
}
