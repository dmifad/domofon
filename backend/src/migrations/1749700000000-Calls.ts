import { MigrationInterface, QueryRunner } from 'typeorm';

export class Calls1749700000000 implements MigrationInterface {
  name = 'Calls1749700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "calls" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "intercom_id" uuid NOT NULL,
        "apartment_id" uuid,
        "building_id" uuid NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'ringing',
        "channel_id" varchar(100),
        "sip_uri" varchar(200),
        "answered_by" uuid,
        "answered_at" timestamptz,
        "ended_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_calls_intercom" ON "calls" ("intercom_id")`);
    await queryRunner.query(`CREATE INDEX "idx_calls_apartment" ON "calls" ("apartment_id")`);
    await queryRunner.query(`CREATE INDEX "idx_calls_building" ON "calls" ("building_id")`);
    await queryRunner.query(`CREATE INDEX "idx_calls_created" ON "calls" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "calls"`);
  }
}
