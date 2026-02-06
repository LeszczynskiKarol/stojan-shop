// backend/src/services/user.service.ts
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/User';
import { AppDataSource } from '../config/database';
import { ApiError } from '../utils/apiError';
import { JwtPayload } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as speakeasy from 'speakeasy';
import { env } from '../config/env.config';

interface TokenPayload extends JwtPayload {
  userId: string;
  role: UserRole;
}

export class UserService {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async createUser(data: {
    email: string;
    name: string;
    password: string;
    role?: UserRole;
    receiveEmails?: boolean;
  }) {
    const existingUser = await this.repository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ApiError(400, 'Użytkownik z tym emailem już istnieje');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.repository.create({
      ...data,
      password: hashedPassword,
    });

    return this.repository.save(user);
  }

  // ZMODYFIKOWANA METODA LOGIN - BEZ 2FA
  async login(email: string, password: string) {
    const user = await this.repository.findOne({
      where: { email, isActive: true },
      select: [
        'id',
        'email',
        'password',
        'role',
        'name',
        // Usunięte: 'twoFactorSecret', 'isTwoFactorEnabled'
      ],
    });

    if (!user) {
      throw new ApiError(401, 'Nieprawidłowy email lub hasło');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ApiError(401, 'Nieprawidłowy email lub hasło');
    }

    // USUNIĘTA CAŁA LOGIKA 2FA
    // if (user.isTwoFactorEnabled) {
    //   if (!twoFactorCode) {
    //     return { requires2FA: true };
    //   }
    //   if (!user.twoFactorSecret) {
    //     throw new ApiError(401, 'Brak skonfigurowanego 2FA');
    //   }
    //   const isValidCode = speakeasy.totp.verify({
    //     secret: user.twoFactorSecret,
    //     encoding: 'base32',
    //     token: twoFactorCode,
    //   });
    //   if (!isValidCode) {
    //     throw new ApiError(401, 'Nieprawidłowy kod 2FA');
    //   }
    // }

    user.lastLoginAt = new Date();
    await this.repository.save(user);

    const payload: TokenPayload = {
      userId: user.id,
      role: user.role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30d' });

    // ZAWSZE ZWRACAMY TOKEN I DANE UŻYTKOWNIKA
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async getEmailRecipients() {
    return this.repository.find({
      where: {
        isActive: true,
        receiveEmails: true,
      },
      select: ['id', 'email', 'name', 'role'],
    });
  }

  async updateUser(
    id: string,
    data: {
      name?: string;
      receiveEmails?: boolean;
      role?: UserRole;
      password?: string;
    }
  ) {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      throw new ApiError(404, 'Użytkownik nie znaleziony');
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    Object.assign(user, data);
    return this.repository.save(user);
  }

  async getAllUsers() {
    return this.repository.find({
      select: [
        'id',
        'email',
        'name',
        'role',
        'isActive',
        'receiveEmails',
        'lastLoginAt',
        'createdAt',
      ],
    });
  }

  async deactivateUser(id: string) {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      throw new ApiError(404, 'Użytkownik nie znaleziony');
    }

    user.isActive = false;
    return this.repository.save(user);
  }

  // METODY 2FA - MOŻNA JE ZAKOMENTOWAĆ LUB ZOSTAWIĆ NA PRZYSZŁOŚĆ
  async generateTwoFactorSecret(userId: string) {
    const user = await this.repository.findOne({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'Użytkownik nie znaleziony');

    const secret = speakeasy.generateSecret({
      name: `StojanShop (${user.email})`,
      issuer: 'StojanShop',
      length: 20,
    });

    user.twoFactorTempSecret = secret.base32;
    await this.repository.save(user);

    return {
      secret: secret.base32,
      otpAuthUrl: secret.otpauth_url,
    };
  }

  async verifyAndEnableTwoFactor(userId: string, token: string) {
    const user = await this.repository.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorTempSecret) {
      throw new ApiError(400, 'Błędna konfiguracja 2FA');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: 'base32',
      token,
    });

    if (!isValid) {
      throw new ApiError(401, 'Nieprawidłowy kod weryfikacyjny');
    }

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = null;
    user.isTwoFactorEnabled = true;
    await this.repository.save(user);

    return true;
  }

  async disable2FA(userId: string) {
    const user = await this.repository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'Użytkownik nie znaleziony');
    }

    user.twoFactorSecret = null;
    user.isTwoFactorEnabled = false;
    await this.repository.save(user);

    return true;
  }

  async getUser(userId: string) {
    const user = await this.repository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'name', 'role', 'isActive', 'isTwoFactorEnabled'],
    });

    if (!user) {
      throw new ApiError(404, 'Użytkownik nie znaleziony');
    }

    return user;
  }
}
