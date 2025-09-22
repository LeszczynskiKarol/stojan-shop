// backend/src/entities/Manufacturer.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('manufacturers')
export class Manufacturer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
