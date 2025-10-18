// frontend/src/app/(admin)/admin/blog/[id]/page.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";
import { useBlogStore } from "@/store/blogStore";
import { ArrowLeft, Calendar, Edit2, Tag, Trash2, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BlogPost } from "../../../../../types/blog.types";

export default function BlogPostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { getPostById, deletePost } = useBlogStore();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const postData = await getPostById(params.id as string);
        setPost(postData);
      } catch (error) {
        toast({
          title: "Błąd",
          description: "Nie udało się załadować posta",
          variant: "destructive",
        });
        router.push("/admin/blog");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadPost();
    }
  }, [params.id]);

  const handleDelete = async () => {
    if (!post) return;

    if (window.confirm("Czy na pewno chcesz usunąć ten post?")) {
      try {
        await deletePost(post.id);
        toast({
          title: "Sukces",
          description: "Post został usunięty",
        });
        router.push("/admin/blog");
      } catch (error) {
        toast({
          title: "Błąd",
          description: "Nie udało się usunąć posta",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-10">Ładowanie posta...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6">
        <div className="text-center py-10">Post nie został znaleziony</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Podgląd posta</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/blog/${post.id}/edit`}>
            <Button variant="outline" size="icon">
              <Edit2 className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6 space-y-6">
        {post.featuredImage && (
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div>
          <h2 className="text-3xl font-bold mb-4">{post.title}</h2>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {post.author || "Brak autora"}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(post.created_at).toLocaleDateString("pl-PL", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-2 flex-wrap">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-700 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {post.excerpt && (
          <div className="border-l-4 border-primary pl-4 py-2 bg-gray-800/50">
            <p className="text-lg italic text-gray-300">{post.excerpt}</p>
          </div>
        )}

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Treść:</h3>
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        <div className="border-t pt-4 text-sm text-muted-foreground">
          <p>
            Ostatnia aktualizacja:{" "}
            {new Date(post.updated_at).toLocaleDateString("pl-PL", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="mt-1">Slug: {post.slug}</p>
        </div>
      </div>
    </div>
  );
}
