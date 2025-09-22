// backend/src/scripts/verify-sync.ts
import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { Order } from '../entities/Order';

async function verifySync() {
  await AppDataSource.initialize();

  const products = await AppDataSource.getRepository(Product).count();
  const categories = await AppDataSource.getRepository(Category).count();
  const orders = await AppDataSource.getRepository(Order).count();

  console.log(`
    Statystyki bazy danych:
    - Produkty: ${products}
    - Kategorie: ${categories}
    - Zamówienia: ${orders}
  `);

  await AppDataSource.destroy();
}

verifySync().catch(console.error);
