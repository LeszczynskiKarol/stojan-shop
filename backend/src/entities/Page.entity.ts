// backend/src/entities/Page.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column('json')
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };

  @Column('text')
  content: string;

  @Column()
  type: 'category' | 'manufacturer' | 'power' | 'legal';

  @Column('json', { nullable: true })
  filters: Record<string, any>;

  @Column()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Dodatkowe pola zależne od typu
  @Column({ nullable: true })
  categoryId?: string;

  @Column({ nullable: true })
  manufacturerName?: string;

  @Column({ nullable: true })
  powerValue?: number;
}
