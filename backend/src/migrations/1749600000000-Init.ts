import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1749600000000 implements MigrationInterface {
  name = 'Init1749600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "phone" varchar(20) NOT NULL,
        "full_name" varchar(200),
        "avatar_url" varchar,
        "locale" varchar(8) NOT NULL DEFAULT 'ru',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_users_phone" UNIQUE ("phone")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "buildings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "city" varchar(120) NOT NULL,
        "address" varchar(300) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "apartments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "building_id" uuid NOT NULL REFERENCES "buildings"("id"),
        "number" varchar(16) NOT NULL,
        "account_number" varchar(32) NOT NULL,
        "link_code" varchar(16) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_apartments_account" UNIQUE ("account_number")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_apartments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "apartment_id" uuid NOT NULL REFERENCES "apartments"("id"),
        "role" varchar(16) NOT NULL DEFAULT 'member',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_user_apartment" UNIQUE ("user_id", "apartment_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "intercoms" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "building_id" uuid NOT NULL REFERENCES "buildings"("id"),
        "name" varchar(120) NOT NULL,
        "sip_uri" varchar(200),
        "open_url" varchar(300),
        "camera_path" varchar(120),
        "status" varchar(16) NOT NULL DEFAULT 'online',
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "cameras" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "building_id" uuid NOT NULL REFERENCES "buildings"("id"),
        "name" varchar(120) NOT NULL,
        "stream_path" varchar(120) NOT NULL,
        "has_archive" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "devices" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id"),
        "platform" varchar(8) NOT NULL,
        "push_token" varchar(300) NOT NULL,
        "voip_token" varchar(300),
        "app_version" varchar(32),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_devices_push_token" UNIQUE ("push_token")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "apartment_id" uuid,
        "building_id" uuid,
        "type" varchar(32) NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}',
        "snapshot_url" varchar,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_events_apartment" ON "events" ("apartment_id")`);
    await queryRunner.query(`CREATE INDEX "idx_events_building" ON "events" ("building_id")`);
    await queryRunner.query(`CREATE INDEX "idx_events_created" ON "events" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TABLE "devices"`);
    await queryRunner.query(`DROP TABLE "cameras"`);
    await queryRunner.query(`DROP TABLE "intercoms"`);
    await queryRunner.query(`DROP TABLE "user_apartments"`);
    await queryRunner.query(`DROP TABLE "apartments"`);
    await queryRunner.query(`DROP TABLE "buildings"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
