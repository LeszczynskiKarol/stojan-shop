// backend/src/scripts/initCategories.ts
import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';

const initCategories = async () => {
  await AppDataSource.initialize();
  console.log('✅ Połączono z bazą danych');

  const repository = AppDataSource.getTreeRepository(Category);
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    // Używamy raw SQL do wyczyszczenia powiązań i kategorii
    await queryRunner.query('UPDATE categories SET "parentId" = NULL');
    await queryRunner.query('DELETE FROM categories');

    // Teraz tworzymy nowe kategorie
    const categories = [
      { name: 'Silniki elektryczne', slug: 'silniki-elektryczne' },
      { name: 'Silniki jednofazowe', slug: 'silniki-jednofazowe' },
      { name: 'Silniki trójfazowe', slug: 'silniki-trojfazowe' },
      { name: 'Silniki z hamulcem', slug: 'silniki-z-hamulcem' },
      { name: 'Silniki dwubiegowe', slug: 'silniki-dwubiegowe' },
      { name: 'Silniki pierścieniowe', slug: 'silniki-pierscieniowe' },
      { name: 'Skup silników', slug: 'skup-silnikow' },
      { name: 'Motoreduktory', slug: 'motoreduktory' },
      { name: 'Akcesoria', slug: 'akcesoria' },
      { name: 'Wentylatory przemysłowe', slug: 'wentylatory-przemyslowe' },
    ];

    for (const cat of categories) {
      const category = repository.create({
        name: cat.name,
        slug: cat.slug,
        order: 0,
      });
      await repository.save(category);
      console.log(`Utworzono kategorię: ${cat.name}`);
    }

    console.log('✅ Zakończono inicjalizację kategorii');
  } catch (error) {
    console.error('Błąd:', error);
  } finally {
    await queryRunner.release();
    process.exit(0);
  }
};

initCategories().catch(console.error);
