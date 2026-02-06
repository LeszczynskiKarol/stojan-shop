// backend/src/scripts/createAdmin.ts
import * as bcrypt from 'bcrypt';
import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';

async function createAdmin() {
  try {
    console.log('🔌 Łączenie z bazą danych...');
    await AppDataSource.initialize();
    console.log('✅ Połączono z bazą!');

    const userRepository = AppDataSource.getRepository(User);

    // Sprawdź czy admin już istnieje
    const existingAdmin = await userRepository.findOne({
      where: { email: 'kontakt@webcopywriting.pl' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin już istnieje! Aktualizuję hasło...');
      const hashedPassword = await bcrypt.hash('Koszykowka123**', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = UserRole.ADMIN;
      existingAdmin.isActive = true;
      await userRepository.save(existingAdmin);
      console.log('✅ Hasło admina zostało zaktualizowane!');
    } else {
      console.log('👤 Tworzenie nowego admina...');
      const hashedPassword = await bcrypt.hash('Koszykowka123**', 10);

      const admin = userRepository.create({
        email: 'kontakt@webcopywriting.pl',
        name: 'Admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
        receiveEmails: true,
        consentSettings: {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          clarity_storage: 'denied',
        },
      });

      await userRepository.save(admin);
      console.log('✅ Admin utworzony pomyślnie!');
    }

    console.log('📧 Email: kontakt@webcopywriting.pl');
    console.log('🔑 Hasło: Koszykowka123**');

    await AppDataSource.destroy();
    console.log('👋 Rozłączono z bazą');
    process.exit(0);
  } catch (error) {
    console.error('❌ Błąd:', error);
    process.exit(1);
  }
}

createAdmin();
