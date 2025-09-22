// backend/src/config/database.ts

import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Order } from '../entities/Order';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { AllegroToken } from '../entities/AllegroToken';
import { OlxToken } from '../entities/OlxToken';
import { User } from '../entities/User';
import { TaskComment } from '../entities/TaskComment';
import { Task } from '../entities/Task';
import { Manufacturer } from '../entities/Manufacturer';
import { LegalPage } from '../entities/LegalPage';
import { BlogPost } from '../entities/BlogPost';
import { AnalyticsEvent } from '../entities/AnalyticsEvent';
import { AnalyticsSession } from '../entities/AnalyticsSession';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Koszykowka123**',
  database: process.env.DB_NAME || 'stojan_shop',
  synchronize: true,
  logging: false,
  entities: [
    Product,
    Manufacturer,
    BlogPost,
    LegalPage,
    Category,
    AnalyticsSession,
    User,
    Order,
    AllegroToken,
    OlxToken,
    AnalyticsEvent,
    TaskComment,
    Task,
  ],
  subscribers: [],
  migrations: [],
});
