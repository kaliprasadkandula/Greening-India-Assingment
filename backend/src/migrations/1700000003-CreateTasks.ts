import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasks1700000000003 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "task_status"   AS ENUM ('todo', 'in_progress', 'done')`);
    await queryRunner.query(`CREATE TYPE "task_priority" AS ENUM ('low', 'medium', 'high')`);
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id"          UUID          NOT NULL DEFAULT uuid_generate_v4(),
        "title"       VARCHAR(255)  NOT NULL,
        "description" TEXT,
        "status"      task_status   NOT NULL DEFAULT 'todo',
        "priority"    task_priority NOT NULL DEFAULT 'medium',
        "project_id"  UUID          NOT NULL,
        "assignee_id" UUID,
        "due_date"    DATE,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tasks_project" FOREIGN KEY ("project_id")
          REFERENCES "projects" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tasks_assignee" FOREIGN KEY ("assignee_id")
          REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_project_id"  ON "tasks" ("project_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_assignee_id" ON "tasks" ("assignee_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_status"      ON "tasks" ("status")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_assignee_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_project_id"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "task_priority"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "task_status"`);
  }
}
