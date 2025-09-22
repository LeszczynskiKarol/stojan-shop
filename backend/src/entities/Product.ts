// backend/src/entities/Product.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './Category';
import { Manufacturer } from './Manufacturer';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Modyfikujemy deklarację relacji ManyToMany
  @ManyToMany(() => Category, (category) => category.products)
  @JoinTable({
    name: 'product_categories',
    joinColumn: {
      name: 'product_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'category_id',
      referencedColumnName: 'id',
    },
  })
  categories: Category[];

  @Column()
  name: string;

  @ManyToOne(() => Manufacturer, { nullable: true })
  @JoinColumn({ name: 'manufacturer_id' })
  manufacturerRelation: Manufacturer | null;

  @Column()
  manufacturer: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('jsonb')
  power: {
    value: string;
    range: string;
  };

  @Column('jsonb')
  rpm: {
    value: string;
    range: string;
  };

  @Column({
    type: 'enum',
    enum: ['nowy', 'uzywany', 'nieuzywany'],
  })
  condition: 'nowy' | 'uzywany' | 'nieuzywany';

  @Column('decimal')
  shaftDiameter: number;

  @Column('decimal', { nullable: true })
  sleeveDiameter?: number;

  @Column('decimal', { nullable: true })
  flangeSize?: number;

  @Column('integer')
  mechanicalSize: number;

  @Column('text', { array: true })
  images: string[];

  @Column('integer')
  stock: number;

  @Column('text', { nullable: true })
  description: string;

  @Column('boolean', { default: false })
  hasEx: boolean;

  @Column({
    type: 'enum',
    enum: [
      'bezpośredni - 220/380V',
      'bezpośredni - 230/400V',
      'gwiazda-trójkąt - 380/660V',
      'gwiazda-trójkąt - 400/690V',
      'gwiazda-trójkąt - 380V△',
      'gwiazda-trójkąt - 400V△',
    ],
    nullable: true,
  })
  startType?: string | null;

  @Column('jsonb')
  marketplaces: {
    allegro?: {
      active: boolean;
      productId?: string;
      price?: number;
      url?: string;
      lastSyncAt?: Date;
      parameters?: Array<{
        id: string;
        name: string;
        values: string[];
        valuesIds?: string[];
      }>;
      description?: {
        sections?: Array<{
          items?: Array<{
            content?: string;
            type?: string;
          }>;
        }>;
      };
      images?: string[];
      stock?: number;
      wielkoscMechaniczna?: string;
      waga?: string;
      srednicaWalu?: string;
      napiecie?: string;
      category?: {
        id: string;
      };
    };
    ownStore?: {
      active: boolean;
      price?: number;
      slug?: string;
      category_path?: string;
      seo?: {
        title?: string;
        description?: string;
        keywords?: string[];
      };
    };
    olx?: {
      active: boolean;
      advertId?: string;
      price?: number;
      url?: string;
      status?:
        | 'new'
        | 'active'
        | 'limited'
        | 'removed_by_user'
        | 'outdated'
        | 'moderated'
        | 'blocked';
      validTo?: Date;
      createdAt?: Date;
      activatedAt?: Date;
      viewCount?: number;
      phoneViewCount?: number;
      usersObserving?: number;
      title?: string;
      description?: string;
      categoryId?: number;
      advertiserType?: 'private' | 'business';
      location?: {
        cityId: number;
        districtId?: number;
        latitude?: number;
        longitude?: number;
      };
      images?: string[];
      attributes?: Array<{
        code: string;
        value: string;
        values?: string[];
      }>;
    };
  };

  @Column('jsonb', { nullable: true })
  attributes: {
    weight?: number;
    voltage?: string;
    [key: string]: any;
  };

  @Column('text', { nullable: true })
  mainImage: string;

  @Column('text', { array: true, default: [] })
  galleryImages: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('integer', { default: 0 })
  viewCount: number;

  @Column('integer', { default: 0 })
  purchaseCount: number;

  @Column('decimal', { nullable: true })
  weight: number;

  @Column('text', { array: true, default: [] })
  dataSheets: string[];

  @Column('text', { nullable: true })
  technicalDetails: string;

  @Column('jsonb', { nullable: true })
  customParameters: {
    name: string;
    value: string;
  }[];

  @Column('jsonb', { nullable: true })
  matched_store_product: {
    store_product_id: string;
    store_product_name: string;
    matched_at: Date;
  } | null;

  @Column('jsonb', { nullable: true })
  matched_olx_advert?: {
    olx_advert_id: string;
    olx_advert_title: string;
    matched_at: Date;
  } | null;

  @Column('text', { nullable: true })
  legSpacing?: string;

  @Column('boolean', { default: false })
  hasBreak: boolean;

  @Column('boolean', { default: false })
  hasForeignCooling: boolean;

  @Column('decimal', { nullable: true })
  flangeBoltCircle?: number;
}
