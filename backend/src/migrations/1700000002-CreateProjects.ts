import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjects1700000000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "name"        VARCHAR(255) NOT NULL,
        "description" TEXT,
        "owner_id"    UUID         NOT NULL,
        "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_owner" FOREIGN KEY ("owner_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_projects_owner_id" ON "projects" ("owner_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_projects_owner_id"`);
    await queryRunner.query(`DROP TABLE "projects"`);
  }
}
