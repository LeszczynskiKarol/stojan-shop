// backend/src/scripts/addAccessoriesSubcategories.ts - POPRAWIONA WERSJA
import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';
import * as dotenv from 'dotenv';

// Załaduj zmienne środowiskowe
dotenv.config({ path: '../../.env' }); // Ścieżka względna do .env

const addAccessoriesSubcategories = async () => {
  console.log('Próba połączenia z bazą danych...');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);

  try {
    await AppDataSource.initialize();
    console.log('✓ Połączono z bazą danych');
  } catch (error) {
    console.error('❌ Błąd połączenia z bazą:', error);
    console.log('\nSprawdź czy:');
    console.log('1. PostgreSQL jest uruchomiony');
    console.log('2. Hasło w pliku .env jest poprawne');
    console.log('3. Baza danych "stojan_shop" istnieje');
    return;
  }

  try {
    const categoryRepo = AppDataSource.getRepository(Category);
    const productRepo = AppDataSource.getRepository(Product);

    // Znajdź kategorię główną Akcesoria
    const akcesoriaCategory = await categoryRepo.findOne({
      where: { slug: 'akcesoria' },
      relations: ['products'],
    });

    if (!akcesoriaCategory) {
      console.error('Nie znaleziono kategorii Akcesoria');
      return;
    }

    console.log(
      `Znaleziono kategorię Akcesoria z ${akcesoriaCategory.products?.length || 0} produktami`
    );

    // Definicje podkategorii
    const subcategories = [
      {
        name: 'Koła pasowe',
        slug: 'kola-pasowe',
        description:
          'Koła pasowe do silników elektrycznych - różne średnice i typy',
        order: 1,
        metadata: {
          title: 'Koła pasowe do silników elektrycznych | Sklep Stojan',
          description:
            'Szeroki wybór kół pasowych do silników elektrycznych. Różne średnice i typy.',
          keywords: ['koła pasowe', 'koło pasowe', 'koła do silników'],
        },
      },
      {
        name: 'Sprzęgła',
        slug: 'sprzegla',
        description:
          'Sprzęgła do silników elektrycznych - elastyczne, sztywne, przeciążeniowe',
        order: 2,
        metadata: {
          title: 'Sprzęgła do silników elektrycznych | Sklep Stojan',
          description:
            'Sprzęgła elastyczne, sztywne i przeciążeniowe do silników elektrycznych.',
          keywords: ['sprzęgła', 'sprzęgło', 'sprzęgła silnikowe'],
        },
      },
      {
        name: 'Falowniki',
        slug: 'falowniki',
        description:
          'Falowniki i przetwornice częstotliwości do sterowania silnikami',
        order: 3,
        metadata: {
          title: 'Falowniki do silników elektrycznych | Sklep Stojan',
          description:
            'Falowniki i przetwornice częstotliwości do płynnej regulacji obrotów.',
          keywords: [
            'falowniki',
            'falownik',
            'przetwornice częstotliwości',
            'VFD',
          ],
        },
      },
      {
        name: 'Kołnierze boczne',
        slug: 'kolnierze-boczne',
        description: 'Kołnierze boczne do montażu silników elektrycznych',
        order: 4,
        metadata: {
          title: 'Kołnierze boczne do silników | Sklep Stojan',
          description:
            'Kołnierze boczne do montażu silników elektrycznych różnych wielkości.',
          keywords: ['kołnierze boczne', 'kołnierz', 'montaż silnika'],
        },
      },
      {
        name: 'Wały',
        slug: 'waly',
        description:
          'Wały napędowe i przedłużenia wałów do silników elektrycznych',
        order: 5,
        metadata: {
          title: 'Wały do silników elektrycznych | Sklep Stojan',
          description:
            'Wały napędowe, przedłużenia i adaptery wałów do silników.',
          keywords: ['wały', 'wał napędowy', 'przedłużenie wału'],
        },
      },
      {
        name: 'Ramiona reakcyjne',
        slug: 'ramiona-reakcyjne',
        description: 'Ramiona reakcyjne do motoreduktorów',
        order: 6,
        metadata: {
          title: 'Ramiona reakcyjne do motoreduktorów | Sklep Stojan',
          description:
            'Ramiona reakcyjne zapobiegające obracaniu się motoreduktora.',
          keywords: [
            'ramiona reakcyjne',
            'ramię reakcyjne',
            'mocowanie motoreduktora',
          ],
        },
      },
      {
        name: 'Inne akcesoria',
        slug: 'inne-akcesoria',
        description: 'Pozostałe akcesoria do silników elektrycznych',
        order: 7,
        metadata: {
          title: 'Inne akcesoria do silników | Sklep Stojan',
          description:
            'Różne akcesoria i części zamienne do silników elektrycznych.',
          keywords: ['akcesoria', 'części zamienne', 'akcesoria silnikowe'],
        },
      },
    ];

    // Tworzenie podkategorii
    for (const subcat of subcategories) {
      const existingSubcat = await categoryRepo.findOne({
        where: { slug: subcat.slug },
      });

      if (existingSubcat) {
        console.log(`Podkategoria ${subcat.name} już istnieje`);
        continue;
      }

      const newSubcategory = categoryRepo.create({
        ...subcat,
        parent: akcesoriaCategory,
      });

      await categoryRepo.save(newSubcategory);
      console.log(`✓ Utworzono podkategorię: ${subcat.name}`);
    }

    // Opcjonalnie: Przypisz istniejące produkty do odpowiednich podkategorii
    // na podstawie nazwy produktu lub innych kryteriów
    if (akcesoriaCategory.products && akcesoriaCategory.products.length > 0) {
      console.log('\nPrzypisywanie produktów do podkategorii...');

      for (const product of akcesoriaCategory.products) {
        let targetSubcategory: Category | null = null;
        const productNameLower = product.name.toLowerCase();

        // Logika przypisywania na podstawie nazwy
        if (
          productNameLower.includes('koło pasowe') ||
          productNameLower.includes('koła pasowe')
        ) {
          targetSubcategory = await categoryRepo.findOne({
            where: { slug: 'kola-pasowe' },
          });
        } else if (
          productNameLower.includes('sprzęgło') ||
          productNameLower.includes('sprzęgła')
        ) {
          targetSubcategory = await categoryRepo.findOne({
            where: { slug: 'sprzegla' },
          });
        } else if (
          productNameLower.includes('falownik') ||
          productNameLower.includes('przetwornica')
        ) {
          targetSubcategory = await categoryRepo.findOne({
            where: { slug: 'falowniki' },
          });
        } else if (productNameLower.includes('kołnierz')) {
          targetSubcategory = await categoryRepo.findOne({
            where: { slug: 'kolnierze-boczne' },
          });
        } else if (productNameLower.includes('wał')) {
          targetSubcategory = await categoryRepo.findOne({
            where: { slug: 'waly' },
          });
        } else if (
          productNameLower.includes('ramię reakcyjne') ||
          productNameLower.includes('ramiona reakcyjne')
        ) {
          targetSubcategory = await categoryRepo.findOne({
            where: { slug: 'ramiona-reakcyjne' },
          });
        } else {
          targetSubcategory = await categoryRepo.findOne({
            where: { slug: 'inne-akcesoria' },
          });
        }

        if (targetSubcategory) {
          // Sprawdź czy relacja już istnieje
          const existingRelation = await AppDataSource.createQueryBuilder()
            .select()
            .from('product_categories', 'pc')
            .where('pc.product_id = :productId', { productId: product.id })
            .andWhere('pc.category_id = :categoryId', {
              categoryId: targetSubcategory.id,
            })
            .getRawOne();

          if (!existingRelation) {
            await AppDataSource.createQueryBuilder()
              .insert()
              .into('product_categories')
              .values({
                product_id: product.id,
                category_id: targetSubcategory.id,
              })
              .execute();

            console.log(
              `  → Przypisano "${product.name}" do ${targetSubcategory.name}`
            );
          } else {
            console.log(
              `  → "${product.name}" już jest w ${targetSubcategory.name}`
            );
          }
        }
      }
    }

    console.log('\n✅ Zakończono dodawanie podkategorii!');
  } catch (error) {
    console.error('Błąd:', error);
  } finally {
    await AppDataSource.destroy();
  }
};

// Uruchom skrypt
addAccessoriesSubcategories();
