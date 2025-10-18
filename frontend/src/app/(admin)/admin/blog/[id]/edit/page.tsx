// frontend/src/app/(admin)/admin/blog/[id]/edit/page.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/use-toast";
import { useBlogStore } from "@/store/blogStore";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { updatePost, getPostById, loading } = useBlogStore();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    author: "",
    tags: "",
    featuredImage: "",
  });

  const [loadingPost, setLoadingPost] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const post = await getPostById(params.id as string);
        setFormData({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || "",
          author: post.author || "",
          tags: post.tags?.join(", ") || "",
          featuredImage: post.featuredImage || "",
        });
      } catch (error) {
        toast({
          title: "Błąd",
          description: "Nie udało się załadować posta",
          variant: "destructive",
        });
        router.push("/admin/blog");
      } finally {
        setLoadingPost(false);
      }
    };

    if (params.id) {
      loadPost();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast({
        title: "Błąd",
        description: "Tytuł i treść są wymagane",
        variant: "destructive",
      });
      return;
    }

    try {
      await updatePost(params.id as string, {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      });

      toast({
        title: "Sukces",
        description: "Post został zaktualizowany",
      });

      router.push("/admin/blog");
    } catch (error) {
      toast({
        title: "Błąd",
        description:
          error instanceof Error
            ? error.message
            : "Nie udało się zaktualizować posta",
        variant: "destructive",
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loadingPost) {
    return (
      <div className="p-6">
        <div className="text-center py-10">Ładowanie posta...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/blog">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edytuj post blogowy</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Tytuł <span className="text-red-500">*</span>
          </label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Wprowadź tytuł posta"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Skrót (excerpt)
          </label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            placeholder="Krótki opis posta (opcjonalnie)"
            className="w-full px-3 py-2 border rounded-lg bg-gray-900 min-h-[80px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Treść <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Wprowadź treść posta (możesz użyć HTML)"
            className="w-full px-3 py-2 border rounded-lg bg-gray-900 min-h-[400px] font-mono text-sm"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Możesz używać znaczników HTML do formatowania treści
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Autor</label>
          <Input
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="Imię autora"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Tagi (rozdzielone przecinkami)
          </label>
          <Input
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="np. technologia, przemysł, silniki"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            URL zdjęcia wyróżniającego
          </label>
          <Input
            name="featuredImage"
            value={formData.featuredImage}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            type="url"
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Zapisywanie..." : "Zapisz zmiany"}
          </Button>
          <Link href="/admin/blog">
            <Button type="button" variant="outline">
              Anuluj
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
