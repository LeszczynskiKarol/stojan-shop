// backend/src/entities/User.ts
import { ConsentSettings } from '../types/consent';
import { Task } from './Task';
import { TaskComment } from './TaskComment';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  receiveEmails: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true, type: 'varchar' })
  twoFactorSecret: string | null;

  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ nullable: true, type: 'varchar' })
  twoFactorTempSecret: string | null;

  @OneToMany(() => Task, (task) => task.assignedTo)
  tasks: Task[];

  @OneToMany(() => TaskComment, (comment) => comment.author)
  taskComments: TaskComment[];

  @Column('json', {
    nullable: true,
    default: {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      clarity_storage: 'denied',
    },
  })
  consentSettings: ConsentSettings;
}
