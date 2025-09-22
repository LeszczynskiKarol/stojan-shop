// backend/src/entities/OlxToken.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('olx_tokens') // nazwa tabeli w PostgreSQL
export class OlxToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text' })
  refreshToken: string;

  @Column({ name: 'expires_in', type: 'integer' })
  expiresIn: number;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
