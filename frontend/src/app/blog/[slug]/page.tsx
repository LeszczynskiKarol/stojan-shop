// frontend/src/app/blog/[slug]/page.tsx
import { processWordPressContent } from "@/lib/wordpress";
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
        next: { revalidate: 60 }, // ISR - odświeżanie co 60 sekund
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

  // Przetwórz WordPress content
  const processedContent = processWordPressContent(post.content);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2 text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  Strona główna
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>/</li>
              <li className="text-foreground font-medium truncate">
                {post.title}
              </li>
            </ol>
          </nav>

          {/* Article */}
          <article className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
            {/* Header */}
            <header className="p-8 md:p-12">
              {post.featuredImage && (
                <div className="relative w-full h-96 -mx-8 md:-mx-12 -mt-8 md:-mt-12 mb-8">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                </div>
              )}

              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  {post.title}
                </h1>

                {post.excerpt && (
                  <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg">
                    <p className="text-lg text-foreground/90 italic leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {post.author && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {post.author[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{post.author}</span>
                    </div>
                  )}

                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
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
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </header>

            {/* Content */}
            <div className="px-8 md:px-12 pb-12">
              <div className="border-t border-border pt-8">
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                />
              </div>
            </div>

            {/* Footer */}
            <footer className="px-8 md:px-12 pb-8 pt-8 border-t border-border bg-muted/30">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium group"
                >
                  <svg
                    className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Powrót do bloga
                </Link>

                <div className="text-sm text-muted-foreground">
                  <span className="block sm:inline">
                    Ostatnia aktualizacja:{" "}
                  </span>
                  <time
                    dateTime={post.updated_at}
                    className="font-medium text-foreground"
                  >
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

          {/* CTA Section */}
          <div className="mt-12 p-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">
                Zainteresował Cię ten temat?
              </h3>
              <p className="text-muted-foreground mb-6">
                Sprawdź naszą ofertę silników elektrycznych lub skontaktuj się z
                nami!
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/"
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  Zobacz produkty
                </Link>
                <Link
                  href="/kontakt"
                  className="px-6 py-3 bg-card border border-border rounded-lg hover:bg-card/80 transition-colors font-semibold"
                >
                  Skontaktuj się
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
