// backend/src/controllers/blog.controller.ts
import axios from 'axios';
import { Request, Response } from 'express';
import slugify from 'slugify';
import { AppDataSource } from '../config/database';
import { BlogPost } from '../entities/BlogPost';

export class BlogController {
  private repository = AppDataSource.getRepository(BlogPost);

  // NOWA METODA - Pobieranie po ID (UUID)
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const post = await this.repository.findOne({ where: { id } });
      if (!post) {
        res.status(404).json({ error: 'Wpis nie znaleziony' });
        return;
      }
      res.json(post);
    } catch (error) {
      console.error('Błąd pobierania posta po ID:', error);
      res.status(500).json({ error: 'Błąd serwera' });
    }
  };

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;
      const RESERVED_SLUGS = ['new', 'edit', 'create', 'admin', 'import'];
      if (RESERVED_SLUGS.includes(slug)) {
        res.status(400).json({
          error: 'Nieprawidłowy slug',
          message: 'Ten slug jest zarezerwowany przez system',
        });
        return;
      }

      const post = await this.repository.findOne({ where: { slug } });
      if (!post) {
        res.status(404).json({ error: 'Wpis nie znaleziony' });
        return;
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const posts = await this.repository.find({
        order: { created_at: 'DESC' },
      });
      res.json({
        data: posts,
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Błąd serwera',
      });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, content, excerpt, author, tags, featuredImage } = req.body;
      const slug = slugify(title, { lower: true, strict: true });

      const existingPost = await this.repository.findOne({ where: { slug } });
      if (existingPost) {
        res.status(400).json({ error: 'Wpis o takim tytule już istnieje' });
        return;
      }

      const post = this.repository.create({
        title,
        content,
        excerpt,
        author,
        tags,
        featuredImage,
        slug,
      });

      await this.repository.save(post);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, content, excerpt, author, tags, featuredImage } = req.body;

      const post = await this.repository.findOne({ where: { id } });
      if (!post) {
        res.status(404).json({ error: 'Wpis nie znaleziony' });
        return;
      }

      const slug = slugify(title, { lower: true, strict: true });
      const existingPost = await this.repository.findOne({ where: { slug } });
      if (existingPost && existingPost.id !== id) {
        res.status(400).json({ error: 'Wpis o takim tytule już istnieje' });
        return;
      }

      post.title = title;
      post.content = content;
      post.excerpt = excerpt;
      post.author = author;
      post.tags = tags;
      post.featuredImage = featuredImage;
      post.slug = slug;

      await this.repository.save(post);
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const post = await this.repository.findOne({ where: { id } });
      if (!post) {
        res.status(404).json({ error: 'Wpis nie znaleziony' });
        return;
      }
      await this.repository.remove(post);
      res.json({ message: 'Wpis został usunięty' });
    } catch (error) {
      res.status(500).json({ error: 'Błąd serwera' });
    }
  };

  // Nowa metoda do importu z WordPressa
  importFromWordPress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { posts } = req.body; // Tablica postów z WordPressa
      const importedPosts = [];

      for (const wpPost of posts) {
        const slug = slugify(wpPost.post_title, { lower: true, strict: true });

        // Sprawdź czy post już istnieje
        const existingPost = await this.repository.findOne({ where: { slug } });
        if (existingPost) continue;

        const post = this.repository.create({
          title: wpPost.post_title,
          content: wpPost.post_content,
          excerpt: wpPost.post_excerpt || '',
          author: wpPost.author_name || wpPost.post_author || 'Admin', // używamy author_name jeśli jest dostępne
          tags: wpPost.tags || [],
          featuredImage: wpPost.featured_image || '',
          slug,
        });

        await this.repository.save(post);
        importedPosts.push(post);
      }

      res.json({
        success: true,
        message: `Zaimportowano ${importedPosts.length} wpisów`,
        data: importedPosts,
      });
    } catch (error) {
      console.error('Błąd importu:', error);
      res.status(500).json({
        error: 'Błąd podczas importu',
      });
    }
  };

  fetchWordPressData = async (req: Request, res: Response): Promise<void> => {
    try {
      const response = await axios.get(
        'https://www.silniki-elektryczne.com.pl/export-posts.php',
        {
          timeout: 30000, // zwiększamy timeout do 30 sekund
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (response.data.success) {
        res.json(response.data);
      } else {
        throw new Error('Błędna odpowiedź z WordPress');
      }
    } catch (error) {
      console.error('Błąd pobierania danych z WordPress:', error);
      res.status(500).json({
        error: 'Błąd podczas pobierania danych z WordPress',
        details: error instanceof Error ? error.message : 'Nieznany błąd',
      });
    }
  };
}
