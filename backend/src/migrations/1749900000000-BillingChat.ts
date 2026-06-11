import { MigrationInterface, QueryRunner } from 'typeorm';

export class BillingChat1749900000000 implements MigrationInterface {
  name = 'BillingChat1749900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "billing_accounts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "apartment_id" uuid NOT NULL,
        "account_number" varchar(32) NOT NULL,
        "balance" numeric(12,2) NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_billing_account_number" UNIQUE ("account_number")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_billing_accounts_apartment" ON "billing_accounts" ("apartment_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "charges" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "account_id" uuid NOT NULL,
        "period" varchar(7) NOT NULL,
        "title" varchar(200) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "paid" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_charges_account" ON "charges" ("account_id")`);

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "account_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'pending',
        "provider_id" varchar(64),
        "confirmation_url" varchar,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_payments_account" ON "payments" ("account_id")`);

    await queryRunner.query(`
      CREATE TABLE "meter_readings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "apartment_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "meter_type" varchar(16) NOT NULL,
        "value" numeric(12,3) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_meter_readings_apartment" ON "meter_readings" ("apartment_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "apartment_id" uuid NOT NULL,
        "user_id" uuid,
        "text" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_chat_messages_apartment" ON "chat_messages" ("apartment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_chat_messages_created" ON "chat_messages" ("created_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "announcements" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "building_id" uuid NOT NULL,
        "title" varchar(200) NOT NULL,
        "body" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_announcements_building" ON "announcements" ("building_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "announcements"`);
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(`DROP TABLE "meter_readings"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "charges"`);
    await queryRunner.query(`DROP TABLE "billing_accounts"`);
  }
}
