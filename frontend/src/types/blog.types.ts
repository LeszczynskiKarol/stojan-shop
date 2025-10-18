// frontend/src/types/blog.types.ts
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  tags: string[];
  featuredImage: string;
  created_at: Date;
  updated_at: Date;
}
