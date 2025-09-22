// backend/src/entities/Order.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Index,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  orderNumber: string;

  @Column('json')
  items: {
    productId: string;
    quantity: number;
    name: string;
    price: number;
    image?: string;
    mainImage?: string;
    slug?: string;
    categorySlug?: string;
    weight: number;
  }[];

  @Column('json')
  shipping: {
    // Dane podstawowe
    firstName?: string;
    lastName?: string;
    companyName?: string;
    nip?: string;
    email: string;
    phone: string;

    // Adres główny
    street: string;
    city: string;
    postalCode: string;
    country?: string;

    // Adres dostawy (jeśli inny)
    differentShippingAddress?: boolean;
    shippingStreet?: string;
    shippingPostalCode?: string;
    shippingCity?: string;

    // Adres do faktury (jeśli inny)
    differentInvoiceAddress?: boolean;
    invoiceStreet?: string;
    invoicePostalCode?: string;
    invoiceCity?: string;

    // Uwagi
    notes?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  shippingDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  shippingCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  })
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

  @Column('jsonb', { nullable: true })
  paymentDetails?: {
    method: string;
    type: string;
    status: string;
  };

  @Column({ nullable: true })
  paymentIntentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ default: false })
  isStockReserved: boolean;

  @Column({ nullable: true })
  @Index()
  stripeSessionId: string;

  @Column('json', { nullable: true, default: [] })
  invoiceUrls: string[];

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalWeight: number;

  @Column({
    type: 'enum',
    enum: ['prepaid', 'cod'],
    default: 'prepaid',
  })
  paymentMethod: 'prepaid' | 'cod';

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  cancelledBy?: string;
}
