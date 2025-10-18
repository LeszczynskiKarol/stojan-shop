// frontend/src/app/blog/[slug]/page.tsx
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getBlogPost(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/blog/by-slug/${slug}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: "Post nie znaleziony",
      description: "Szukany post nie istnieje",
    };
  }

  return {
    title: `${post.title} | Blog Stojan`,
    description: post.excerpt || post.title,
    keywords: post.tags?.join(", ") || "",
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      type: "article",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.author || "Stojan"],
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/" className="text-gray-400 hover:text-white">
            Strona główna
          </Link>
          <span className="mx-2 text-gray-600">/</span>
          <Link href="/blog" className="text-gray-400 hover:text-white">
            Blog
          </Link>
          <span className="mx-2 text-gray-600">/</span>
          <span className="text-white">{post.title}</span>
        </nav>

        {/* Header */}
        <article>
          <header className="mb-8">
            {post.featuredImage && (
              <div className="relative w-full h-96 mb-6 rounded-lg overflow-hidden">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
              {post.author && (
                <span className="flex items-center gap-2">
                  👤 <span>{post.author}</span>
                </span>
              )}
              <span className="flex items-center gap-2">
                📅{" "}
                <time dateTime={post.created_at}>
                  {new Date(post.created_at).toLocaleDateString("pl-PL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </span>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {post.excerpt && (
              <div className="border-l-4 border-primary pl-4 py-2 bg-gray-800/50 mb-8">
                <p className="text-lg text-gray-300 italic">{post.excerpt}</p>
              </div>
            )}
          </header>

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none
              prose-headings:text-white 
              prose-p:text-gray-300 
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-code:text-primary prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded
              prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
              prose-img:rounded-lg
              prose-ul:text-gray-300
              prose-ol:text-gray-300"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <Link
                href="/blog"
                className="text-primary hover:underline flex items-center gap-2"
              >
                ← Powrót do bloga
              </Link>

              <div className="text-sm text-gray-400">
                Ostatnia aktualizacja:{" "}
                <time dateTime={post.updated_at}>
                  {new Date(post.updated_at).toLocaleDateString("pl-PL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
