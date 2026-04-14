import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByToTasks1700000000004 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD COLUMN "created_by" UUID REFERENCES "users" ("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_created_by" ON "tasks" ("created_by")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_created_by"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "created_by"`);
  }
}
