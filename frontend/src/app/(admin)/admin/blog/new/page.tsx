// frontend/src/app/(admin)/admin/blog/new/page.tsx
"use client";

import { BlogImageUpload } from "@/components/blog/BlogImageUpload";
import { ContentImageUpload } from "@/components/blog/ContentImageUpload";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/use-toast";
import { useBlogStore } from "@/store/blogStore";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createPost, loading } = useBlogStore();
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    author: "",
    tags: "",
    featuredImage: "",
  });

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
      await createPost({
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      });

      toast({
        title: "Sukces",
        description: "Post został utworzony",
      });

      router.push("/admin/blog");
    } catch (error) {
      toast({
        title: "Błąd",
        description:
          error instanceof Error
            ? error.message
            : "Nie udało się utworzyć posta",
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

  const handleImageInsert = (imageUrl: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const imgTag = `<img src="${imageUrl}" alt="Blog image" class="w-full rounded-lg my-4" />\n\n`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const newContent = before + imgTag + after;
    setFormData({
      ...formData,
      content: newContent,
    });

    // Ustaw kursor po wstawionym obrazie
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + imgTag.length;
    }, 0);

    toast({
      title: "Sukces",
      description: "Obraz został wstawiony do treści",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/blog">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Nowy post blogowy</h1>
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

        {/* Featured Image Upload */}
        <BlogImageUpload
          value={formData.featuredImage}
          onChange={(url) => setFormData({ ...formData, featuredImage: url })}
          disabled={loading}
        />

        {/* Content Images Upload */}
        <ContentImageUpload
          onImageInsert={handleImageInsert}
          disabled={loading}
        />

        <div>
          <label className="block text-sm font-medium mb-2">
            Treść <span className="text-red-500">*</span>
          </label>
          <textarea
            ref={contentTextareaRef}
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Wprowadź treść posta (możesz użyć HTML)"
            className="w-full px-3 py-2 border rounded-lg bg-gray-900 min-h-[400px] font-mono text-sm"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Możesz używać znaczników HTML do formatowania treści. Obrazy zostaną
            automatycznie wstawione jako tagi &lt;img&gt;
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

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Tworzenie..." : "Utwórz post"}
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
