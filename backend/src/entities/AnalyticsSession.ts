// backend/src/entities/AnalyticsSession.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

export enum TrafficSource {
  SEARCH_ENGINE = 'search_engine',
  SOCIAL = 'social',
  REFERRAL = 'referral',
  DIRECT = 'direct',
  GOOGLE_ADS = 'google_ads',
}

export enum SearchEngine {
  GOOGLE = 'google',
  BING = 'bing',
  DUCK_DUCK_GO = 'duckduckgo',
  YAHOO = 'yahoo',
  OTHER = 'other',
}

export enum SocialPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  OTHER = 'other',
}

@Entity('analytics_sessions')
export class AnalyticsSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sessionId: string;

  @Column({
    type: 'enum',
    enum: TrafficSource,
  })
  @Index()
  trafficSource: TrafficSource;

  @Column({
    type: 'enum',
    enum: SearchEngine,
    nullable: true,
  })
  searchEngine?: SearchEngine;

  @Column({
    type: 'enum',
    enum: SocialPlatform,
    nullable: true,
  })
  socialPlatform?: SocialPlatform;

  @Column({ nullable: true })
  referringDomain?: string;

  @Column({ nullable: true })
  referringUrl?: string;

  @Column('inet')
  ipAddress: string;

  @Column()
  userAgent: string;

  @Column()
  deviceType: string;

  @Column()
  browserName: string;

  @Column()
  browserVersion: string;

  @Column()
  osName: string;

  @Column()
  osVersion: string;

  @Column('jsonb')
  geoLocation: {
    country?: string;
    city?: string;
    region?: string;
  };

  @CreateDateColumn()
  startTime: Date;

  @UpdateDateColumn()
  lastActivityTime: Date;

  @Column({ nullable: true })
  endTime?: Date;

  @Column({ type: 'integer', default: 0 })
  duration: number;

  @Column('int', { default: 0 })
  pageViews: number;

  @Column('boolean', { default: false })
  isBot: boolean;

  @Column('jsonb', { default: [] })
  events: {
    eventType: string;
    timestamp: Date;
    url: string;
    data: any;
  }[];

  @Column('jsonb', { default: {} })
  conversion: {
    occurred: boolean;
    type?:
      | 'add_to_cart_conversion'
      | 'order_pending'
      | 'order_success'
      | 'order_cancelled';
    value?: number;
    productId?: string;
    orderId?: string;
    paymentMethod?: string;
    paymentType?: string;
    paymentStatus?: string;
  };
}
