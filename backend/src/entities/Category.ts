// backend/src/entities/Category.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  TreeParent,
  TreeChildren,
  Tree,
} from 'typeorm';
import { Product } from '../entities/Product';

@Entity('categories')
@Tree('materialized-path')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  order: number;

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Column('jsonb', { nullable: true })
  productFilters: {
    powerRange?: {
      min: string;
      max: string;
    };
    specificCategories?: string[];
    manufacturers?: string[];
  };

  @ManyToMany(() => Product, (product) => product.categories)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @TreeParent()
  parent: Category;

  @TreeChildren()
  children: Category[];

  @UpdateDateColumn()
  updatedAt: Date;
}
