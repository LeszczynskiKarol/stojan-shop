// frontend/src/app/(admin)/admin/blog/page.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";
import { useBlogStore } from "@/store/blogStore";
import { Edit2, FileText, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BlogPost } from "../../../../types/blog.types";

export default function BlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    posts,
    loading,
    currentPage,
    totalPages,
    itemsPerPage,
    fetchPosts,
    deletePost,
    setPage,
    setItemsPerPage,
  } = useBlogStore();

  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Czy na pewno chcesz usunąć ten post?")) {
      try {
        await deletePost(id);
        toast({
          title: "Sukces",
          description: "Post został usunięty",
        });
      } catch (error) {
        toast({
          title: "Błąd",
          description: "Nie udało się usunąć posta",
          variant: "destructive",
        });
      }
    }
  };

  const paginatedPosts = posts.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Posty blogowe</h1>
        <div className="flex items-center gap-4">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setPage(0);
            }}
            className="px-3 py-2 border rounded-lg bg-gray-900"
          >
            <option value="20">20 na stronę</option>
            <option value="50">50 na stronę</option>
            <option value="100">100 na stronę</option>
          </select>

          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import z WordPress
          </Button>

          <Link href="/admin/blog/new">
            <Button>Dodaj nowy post</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Ładowanie...</div>
      ) : (
        <>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-200">Tytuł</th>
                  <th className="px-4 py-3 text-left text-gray-200">Autor</th>
                  <th className="px-4 py-3 text-left text-gray-200">Tagi</th>
                  <th className="px-4 py-3 text-left text-gray-200">
                    Data utworzenia
                  </th>
                  <th className="px-4 py-3 text-left text-gray-200">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedPosts.map((post: BlogPost) => (
                  <tr key={post.id} className="hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-blue-500 hover:text-blue-400 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{post.author}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {post.tags?.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(post.created_at).toLocaleDateString("pl-PL")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/admin/blog/${post.id}/edit`)
                          }
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <Button
              onClick={() => setPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              Poprzednia strona
            </Button>
            <span>
              Strona {currentPage + 1} z {totalPages}
            </span>
            <Button
              onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Następna strona
            </Button>
          </div>
        </>
      )}

      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const { fetchWordPressData, importFromWordPress } = useBlogStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wpPosts, setWpPosts] = useState<any[]>([]);

  const handleFetchWordPress = async () => {
    setLoading(true);
    try {
      const data = await fetchWordPressData();
      if (data.success && data.posts) {
        setWpPosts(data.posts);
        toast({
          title: "Sukces",
          description: `Znaleziono ${data.posts.length} postów`,
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać danych z WordPress",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const result = await importFromWordPress(wpPosts);
      toast({
        title: "Sukces",
        description: "Posty zostały zaimportowane",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaimportować postów",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Import z WordPress</h2>

        {wpPosts.length === 0 ? (
          <div className="space-y-4">
            <p className="text-gray-400">
              Kliknij poniżej, aby pobrać posty z WordPress
            </p>
            <Button onClick={handleFetchWordPress} disabled={loading}>
              {loading ? "Pobieranie..." : "Pobierz posty z WordPress"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400">
              Znaleziono {wpPosts.length} postów. Kliknij poniżej, aby
              zaimportować.
            </p>
            <div className="max-h-60 overflow-y-auto border border-gray-700 rounded p-2">
              {wpPosts.map((post, index) => (
                <div key={index} className="p-2 border-b border-gray-800">
                  {post.post_title}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={loading}>
                {loading ? "Importowanie..." : "Importuj wszystkie"}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Anuluj
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
