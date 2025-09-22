// backend/src/entities/TaskComment.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Task } from './Task';

@Entity()
export class TaskComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => User, (user) => user.taskComments)
  author: User;

  @ManyToOne(() => Task, (task) => task.comments)
  task: Task;

  @CreateDateColumn()
  createdAt: Date;
}
