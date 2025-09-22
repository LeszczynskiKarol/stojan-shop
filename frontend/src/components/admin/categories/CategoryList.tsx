// frontend/src/components/admin/categories/CategoryList.tsx
import { ICategory } from '@/types/category.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Edit, Trash } from 'lucide-react';
import Link from 'next/link';
import { useCategoryStore } from '@/store/categoryStore';

interface CategoryListProps {
  categories: ICategory[];
  loading: boolean;
}

export function CategoryList({ categories, loading }: CategoryListProps) {
  const { deleteCategory } = useCategoryStore();

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę kategorię?')) {
      return;
    }

    try {
      await deleteCategory(id);
    } catch (error) {
      console.error('Błąd podczas usuwania:', error);
      alert('Wystąpił błąd podczas usuwania kategorii');
    }
  };

  if (loading) {
    return <div>Ładowanie kategorii...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nazwa</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Opis</TableHead>
          <TableHead className="text-right">Akcje</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell>{category.name}</TableCell>
            <TableCell>/{category.slug}/</TableCell>
            <TableCell>{category.description || '-'}</TableCell>
            <TableCell className="text-right space-x-2">
              <Link href={`/admin/categories/${category.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
                <Trash className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
