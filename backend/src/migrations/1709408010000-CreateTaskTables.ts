// backend/src/migrations/1709408010000-CreateTaskTables.ts
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateTaskTables1709408010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tworzymy tabelę tasks
    await queryRunner.createTable(
      new Table({
        name: 'task',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['todo', 'in_progress', 'done'],
            default: "'todo'",
          },
          {
            name: 'assigned_to_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      })
    );

    // Tworzymy tabelę task_comments
    await queryRunner.createTable(
      new Table({
        name: 'task_comment',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'task_id',
            type: 'int',
          },
          {
            name: 'author_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      })
    );

    // Dodajemy klucze obce
    await queryRunner.createForeignKey(
      'task',
      new TableForeignKey({
        columnNames: ['assigned_to_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'task_comment',
      new TableForeignKey({
        columnNames: ['task_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'task',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'task_comment',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('task_comment');
    await queryRunner.dropTable('task');
  }
}
