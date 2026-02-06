// frontend/src/app/(admin)/admin/import/page.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { productAPI } from '@/lib/api';
import { IProduct } from '@/types/product.types';
import { ArrowUpDown, X, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface WooProduct {
  ID: number;
  post_title: string;
  post_content: string;
  post_excerpt: string;
  description: string;
  price: string;
  stock: string;
  image_url?: string;
  categories?: string;
  mechanicalSize: number;
  sleeveDiameter: number;
  shaftDiameter: number;
  weight: number;
  flangeSize: number;
  manufacturer: string;
  condition: 'nowy' | 'uzywany';
  mounting: string[];
  category: {
    // zmiana tutaj - dodane `?`
    name: string;
    slug: string;
  } | null;
  raw_categories: string;
}

interface PreviewProduct {
  wooProduct: WooProduct;
  mappedProduct: Partial<IProduct>;
  selected?: boolean;
  status?: 'pending' | 'success' | 'error';
  errorMessage?: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export default function ImportPage() {
  const [preview, setPreview] = useState<PreviewProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'post_title', direction: 'asc' });
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, item: PreviewProduct) => {
    setPreview((prev) =>
      prev.map((p) =>
        p.wooProduct.ID === item.wooProduct.ID ? { ...p, selected: e.target.checked } : p
      )
    );
    setSelectedProducts((prev) =>
      e.target.checked
        ? [...prev, item.wooProduct.ID]
        : prev.filter((id) => id !== item.wooProduct.ID)
    );
  };

  const formatValue = (value: any, unit?: string) => {
    if (value === undefined || value === null) return '-';
    return unit ? `${value} ${unit}` : value;
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      const response = await productAPI.previewWooCommerce();
      setPreview(
        response.data.map((item: PreviewProduct) => ({
          ...item,
          selected: false,
        }))
      );
    } catch (error) {
      console.error('Błąd podglądu:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się pobrać podglądu produktów',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      const productsToImport = preview.filter((p) => p.selected);

      if (productsToImport.length === 0) {
        toast({
          title: 'Błąd',
          description: 'Nie wybrano żadnych produktów do importu',
          variant: 'destructive',
        });
        return;
      }

      // Przekazujemy ID wybranych produktów do importu
      const selectedIds = productsToImport.map((p) => p.wooProduct.ID);
      const response = await productAPI.importWooCommerce(selectedIds);

      if (response.success) {
        // Aktualizujemy status zaimportowanych produktów
        setPreview((prev) =>
          prev.map((p) => ({
            ...p,
            status: selectedIds.includes(p.wooProduct.ID) ? 'success' : p.status,
          }))
        );

        toast({
          title: 'Import zakończony',
          description: `Zaimportowano ${selectedIds.length} produktów pomyślnie`,
        });
      } else {
        throw new Error(response.error || 'Błąd podczas importu');
      }
    } catch (error) {
      console.error('Błąd importu:', error);
      toast({
        title: 'Błąd',
        description: error instanceof Error ? error.message : 'Wystąpił błąd podczas importu',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const filteredProducts = preview
    .filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.wooProduct.post_title.toLowerCase().includes(searchLower) ||
        item.wooProduct.post_content.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const aValue = String(a.wooProduct[sortConfig.key as keyof WooProduct]);
      const bValue = String(b.wooProduct[sortConfig.key as keyof WooProduct]);
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  const paginatedProducts = filteredProducts.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const columns = [
    { key: 'post_title', label: 'Nazwa' },
    { key: 'manufacturer', label: 'Producent' },
    { key: 'power', label: 'Moc' },
    { key: 'rpm', label: 'Obroty' },
    { key: 'shaftDiameter', label: 'Średnica wału' },
    { key: 'mechanicalSize', label: 'Wielkość mechaniczna' },
    { key: 'sleeveDiameter', label: 'Średnica tulei' },
    { key: 'flangeSize', label: 'Średnica kołnierza' },
    { key: 'price', label: 'Cena' },
    { key: 'stock', label: 'Stan magazynowy' },
    { key: 'weight', label: 'Waga' },
    { key: 'mounting', label: 'Montaż' },
    { key: 'category', label: 'Kategoria' },
    { key: 'condition', label: 'Stan' },
    { key: 'seo_title', label: 'SEO Title' },
    { key: 'seo_description', label: 'SEO Opis' },
    { key: 'status', label: 'Status importu' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Import z WooCommerce</h1>
        <div className="space-x-4">
          <Button onClick={handlePreview} disabled={loading}>
            {loading ? 'Ładowanie...' : 'Pokaż podgląd'}
          </Button>
          <Button onClick={handleImport} disabled={isImporting || selectedProducts.length === 0}>
            {isImporting ? `Importowanie (${importProgress.toFixed(1)}%)` : 'Importuj zaznaczone'}
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Szukaj produktów..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full min-w-[1500px]">
          <thead>
            <tr>
              <th className="p-2">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    const newSelected = e.target.checked
                      ? filteredProducts.map((p) => p.wooProduct.ID)
                      : [];
                    setSelectedProducts(newSelected);
                    setPreview((prev) =>
                      prev.map((p) => ({
                        ...p,
                        selected: e.target.checked,
                      }))
                    );
                  }}
                  checked={selectedProducts.length === filteredProducts.length}
                />
              </th>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  className="p-2 text-left cursor-pointer"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center">
                    {label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </th>
              ))}
              <th className="p-2">Podgląd</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((item) => (
              <tr key={item.wooProduct.ID}>
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) => handleCheckboxChange(e, item)}
                  />
                </td>
                <td className="p-2">{item.wooProduct.post_title}</td>
                <td className="p-2">{item.wooProduct.manufacturer}</td>
                <td className="p-2">{formatValue(item.mappedProduct.power?.value, 'kW')}</td>
                <td className="p-2">{item.mappedProduct.rpm?.value} obr/min</td>
                <td className="p-2">{formatValue(item.wooProduct.shaftDiameter, 'mm')}</td>
                <td className="p-2">{item.wooProduct.mechanicalSize}</td>
                <td className="p-2">{formatValue(item.wooProduct.sleeveDiameter, 'mm')}</td>
                <td className="p-2">{formatValue(item.wooProduct.flangeSize, 'mm')}</td>
                <td className="p-2">{item.wooProduct.price} zł</td>
                <td className="p-2">{item.wooProduct.stock}</td>
                <td className="p-2">{formatValue(item.wooProduct.weight, 'kg')}</td>
                <td className="p-2">{item.wooProduct.mounting.join(', ')}</td>
                <td className="p-2">{item.wooProduct.category?.name || 'Silniki Elektryczne'}</td>
                <td className="p-2">{item.wooProduct.condition}</td>
                <td className="p-2">
                  {item.mappedProduct.seo?.title ||
                    item.wooProduct.post_title.charAt(0).toUpperCase() +
                      item.wooProduct.post_title.slice(1) +
                      ' - zamów teraz!'}
                </td>
                <td className="p-2">{item.mappedProduct.seo?.description || ''}</td>
                <td className="p-2">
                  {item.status === 'success' && <Check className="text-green-500" />}
                  {item.status === 'error' && (
                    <div className="flex items-center text-red-500">
                      <AlertCircle className="mr-1" />
                      {item.errorMessage}
                    </div>
                  )}
                </td>
                <td className="p-2">
                  {item.wooProduct.image_url && (
                    <img
                      src={item.mappedProduct.images?.[0] || item.wooProduct.image_url}
                      alt={item.wooProduct.post_title}
                      className="w-20 h-20 object-cover"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="border rounded p-1"
        >
          <option value={10}>10 na stronę</option>
          <option value={20}>20 na stronę</option>
          <option value={50}>50 na stronę</option>
          <option value={100}>100 na stronę</option>
          <option value={500}>500 na stronę</option>
          <option value={1000}>1000 na stronę</option>
          <option value={2000}>2000 na stronę</option>
        </select>

        <div className="space-x-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            Poprzednia
          </Button>
          <span>
            Strona {currentPage + 1} z {Math.ceil(filteredProducts.length / itemsPerPage)}
          </span>
          <Button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(Math.ceil(filteredProducts.length / itemsPerPage) - 1, prev + 1)
              )
            }
            disabled={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage) - 1}
          >
            Następna
          </Button>
        </div>
      </div>
    </div>
  );
}
