// backend/src/entities/AnalyticsEvent.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  eventType: string;

  @Column('jsonb')
  data: {
    url: string;
    path: string;
    referrer?: string;
    userAgent?: string;
    screenResolution?: string;
    deviceType?: string;
    sessionId?: string;
    productId?: string;
    categoryId?: string;
    manufacturerId?: string;
    [key: string]: any;
  };

  @Column({ nullable: true })
  @Index()
  userId?: string;

  @Column()
  @Index()
  sessionId: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @Column({ nullable: true })
  @Index()
  productId?: string;

  @Column({ nullable: true })
  @Index()
  categoryId?: string;

  @Column({ nullable: true })
  @Index()
  manufacturerId?: string;

  @Column('inet', { nullable: true })
  ipAddress?: string;
}
