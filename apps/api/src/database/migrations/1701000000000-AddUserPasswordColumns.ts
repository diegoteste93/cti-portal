import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPasswordColumns1701000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" varchar');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordSalt" varchar');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordSalt"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordHash"');
  }
}
