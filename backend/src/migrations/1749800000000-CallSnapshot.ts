import { MigrationInterface, QueryRunner } from 'typeorm';

export class CallSnapshot1749800000000 implements MigrationInterface {
  name = 'CallSnapshot1749800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calls" ADD COLUMN "snapshot_url" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calls" DROP COLUMN "snapshot_url"`);
  }
}
