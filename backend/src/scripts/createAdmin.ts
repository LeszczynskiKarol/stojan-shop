// backend/src/scripts/createAdmin.ts
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import * as bcrypt from 'bcrypt';

// Tablica z danymi adminów
const adminsToCreate = [
  {
    email: 'silniki.elektryczne123@gmail.com',
    name: 'Stojan',
    password: 'Stilnik123***',
  },
  {
    email: 'karolleszczynskikorektor@gmail.com',
    name: 'Karol',
    password: 'Koszykowka123**',
  },
  // Dodaj więcej adminów według potrzeb
];

async function createAdmins() {
  try {
    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);

    for (const adminInfo of adminsToCreate) {
      // Sprawdź czy admin już istnieje
      const existingAdmin = await userRepository.findOne({
        where: { email: adminInfo.email },
      });

      if (existingAdmin) {
        console.log(`Admin ${adminInfo.email} już istnieje!`);
        continue;
      }

      // Przygotuj dane admina
      const adminData = {
        email: adminInfo.email,
        name: adminInfo.name,
        password: await bcrypt.hash(adminInfo.password, 10),
        role: UserRole.ADMIN,
        isActive: true,
        receiveEmails: true,
      };

      const admin = userRepository.create(adminData);
      await userRepository.save(admin);
      console.log(`✅ Admin ${adminInfo.email} został utworzony pomyślnie!`);
    }
  } catch (error) {
    console.error('❌ Błąd podczas tworzenia adminów:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

createAdmins();
