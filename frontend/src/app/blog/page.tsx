// frontend/src/app/blog/page.tsx
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog - Silniki Elektryczne | Stojan",
  description:
    "Blog o silnikach elektrycznych, motorach i napędach przemysłowych",
};

async function getBlogPosts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blog`, {
      next: { revalidate: 60 }, // Odśwież co 60 sekund (ISR)
    });

    if (!res.ok) {
      throw new Error("Failed to fetch posts");
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Brak postów do wyświetlenia</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {posts.map((post: any) => (
              <article
                key={post.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors"
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="flex flex-col md:flex-row">
                    {post.featuredImage && (
                      <div className="md:w-1/3 relative h-48 md:h-auto">
                        <Image
                          src={post.featuredImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1">
                      <h2 className="text-2xl font-bold mb-3 hover:text-primary transition-colors">
                        {post.title}
                      </h2>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        {post.author && (
                          <span className="flex items-center gap-1">
                            👤 {post.author}
                          </span>
                        )}
                        <span>
                          📅{" "}
                          {new Date(post.created_at).toLocaleDateString(
                            "pl-PL",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>

                      {post.excerpt && (
                        <p className="text-gray-300 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <span className="text-primary hover:underline">
                        Czytaj więcej →
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
